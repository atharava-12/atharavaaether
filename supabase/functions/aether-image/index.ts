import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Provider = "lovable" | "nvidia" | "hf-fal" | "hf-nscale";

interface RequestBody {
  prompt: string;
  image?: string | string[];
  provider?: Provider;
  model?: string;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/* ---------- NVIDIA Flux (via NVCF assets) ---------- */

async function uploadNvcfAsset(
  dataUrl: string,
  apiKey: string,
): Promise<{ assetId: string; contentType: string }> {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl.trim());
  if (!match) throw new Error("Image must be a base64 data URL");
  const contentType = match[1];
  const base64Body = match[2].replace(/\s/g, "");

  const authResp = await fetch("https://api.nvcf.nvidia.com/v2/nvcf/assets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ contentType, description: "aether-image-edit-input" }),
  });
  if (!authResp.ok) {
    throw new Error(`Asset auth failed (${authResp.status}): ${(await authResp.text()).slice(0, 200)}`);
  }
  const { uploadUrl, assetId } = await authResp.json();
  if (!uploadUrl || !assetId) throw new Error("Asset auth returned no uploadUrl/assetId");

  const bytes = Uint8Array.from(atob(base64Body), (c) => c.charCodeAt(0));
  const putResp = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-meta-nvcf-asset-description": "aether-image-edit-input",
    },
    body: bytes,
  });
  if (!putResp.ok) {
    throw new Error(`Asset upload failed (${putResp.status}): ${(await putResp.text()).slice(0, 200)}`);
  }
  return { assetId, contentType };
}

async function callNvidiaFlux(prompt: string, image: string | null, apiKey: string) {
  const payload: Record<string, unknown> = {
    prompt,
    width: 1024,
    height: 1024,
    seed: 0,
    steps: 4,
  };
  const extraHeaders: Record<string, string> = {};

  if (image) {
    const { assetId, contentType } = await uploadNvcfAsset(image, apiKey);
    // NVIDIA Flux expects the form `data:<mime>;example_id,<UUID>`
    payload.image = [`data:${contentType};example_id,${assetId}`];
    extraHeaders["NVCF-INPUT-ASSET-REFERENCES"] = assetId;
  }

  const response = await fetch(
    "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    const t = await response.text();
    throw { status: response.status, message: t.slice(0, 300) };
  }
  const data = await response.json();
  const b64 =
    data?.image ||
    data?.images?.[0] ||
    data?.artifacts?.[0]?.base64 ||
    data?.data?.[0]?.b64_json;
  const directUrl = data?.url || data?.images?.[0]?.url;
  if (typeof b64 === "string" && b64.length > 0)
    return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
  if (typeof directUrl === "string") return directUrl;
  throw { status: 500, message: "No image returned by NVIDIA model" };
}

/* ---------- Hugging Face Inference (router) ---------- */

async function callLovableImage(prompt: string, image: string | null, model: string, apiKey: string): Promise<string> {
  const content = image
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: image } },
      ]
    : prompt;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw { status: response.status, message: t.slice(0, 300) };
  }

  const data = await response.json();
  const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (typeof imageUrl === "string" && imageUrl.length > 0) return imageUrl;
  throw { status: 500, message: "No image returned by Lovable image model" };
}

async function callHuggingFace(
  prompt: string,
  image: string | null,
  model: string,
  provider: "fal-ai" | "nscale",
  hfToken: string,
): Promise<string> {
  // HF router auto-selects the inference provider via path.
  // Text-to-image: POST raw JSON, response is binary image bytes.
  // Image-to-image (Flux 2): POST multipart/form-data with image + parameters.
  const url = `https://router.huggingface.co/${provider}/models/${model}`;

  let response: Response;
  if (image) {
    // image-to-image
    const match = /^data:([^;]+);base64,(.+)$/.exec(image.trim());
    if (!match) throw { status: 400, message: "Image must be a base64 data URL" };
    const contentType = match[1];
    const bytes = Uint8Array.from(atob(match[2].replace(/\s/g, "")), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: contentType });
    const form = new FormData();
    form.append("inputs", blob, "input.png");
    form.append("parameters", JSON.stringify({ prompt }));
    response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${hfToken}`, Accept: "image/png" },
      body: form,
    });
  } else {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      body: JSON.stringify({ inputs: prompt }),
    });
  }

  if (!response.ok) {
    const t = await response.text();
    throw { status: response.status, message: t.slice(0, 300) };
  }
  const ct = response.headers.get("content-type") || "";
  if (ct.startsWith("image/")) {
    const buf = new Uint8Array(await response.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return `data:${ct};base64,${btoa(bin)}`;
  }
  // Some providers return JSON wrapping a base64 image
  const data = await response.json().catch(() => null);
  const b64 =
    data?.image ||
    data?.images?.[0] ||
    data?.artifacts?.[0]?.base64 ||
    data?.data?.[0]?.b64_json;
  if (typeof b64 === "string" && b64.length > 0)
    return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
  throw { status: 500, message: "No image returned by HF model" };
}

/* ---------- Handler ---------- */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    const { prompt } = body;
    if (!prompt || typeof prompt !== "string") {
      return json(400, { error: "Prompt is required" });
    }

    const rawImage =
      typeof body.image === "string" && body.image.length > 0
        ? body.image
        : Array.isArray(body.image) && typeof body.image[0] === "string"
          ? body.image[0]
          : null;

    const provider: Provider = body.provider ?? "nvidia";
    const model = body.model ?? "";

    let imageUrl: string;
    try {
      if (provider === "lovable") {
        const key = Deno.env.get("LOVABLE_API_KEY");
        if (!key) return json(500, { error: "LOVABLE_API_KEY is not configured" });
        imageUrl = await callLovableImage(prompt, rawImage, model, key);
      } else if (provider === "nvidia") {
        const key = Deno.env.get("NVIDIA_API_KEY");
        if (!key) return json(500, { error: "NVIDIA_API_KEY is not configured" });
        imageUrl = await callNvidiaFlux(prompt, rawImage, key);
      } else {
        const hf = Deno.env.get("HF_TOKEN");
        if (!hf) return json(500, { error: "HF_TOKEN is not configured" });
        const hfProvider = provider === "hf-nscale" ? "nscale" : "fal-ai";
        imageUrl = await callHuggingFace(prompt, rawImage, model, hfProvider, hf);
      }
    } catch (e) {
      const err = e as { status?: number; message?: string };
      const status = err.status ?? 500;
      console.error("Image provider error:", status, err.message);
      if (status === 401) return json(401, { error: "Invalid API key for selected provider." });
      if (status === 429) return json(429, { error: "Rate limit exceeded. Try again shortly." });
      return json(500, { error: `Image generation failed: ${err.message ?? "unknown error"}` });
    }

    return json(200, { imageUrl });
  } catch (e) {
    console.error("Image error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
