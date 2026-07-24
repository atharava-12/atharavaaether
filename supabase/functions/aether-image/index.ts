import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Provider = "nvidia";

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

async function callNvidiaFlux(prompt: string, apiKey: string, model: string = "black-forest-labs/flux.2-klein-4b") {
  const payload: Record<string, unknown> = {
    prompt,
    width: 1024,
    height: 1024,
    seed: 0,
    steps: 4,
  };

  const response = await fetch(`https://ai.api.nvidia.com/v1/genai/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    throw { status: response.status, message: text.slice(0, 300) };
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  const artifact = (data as any)?.artifacts?.[0];
  if (artifact?.finishReason === "CONTENT_FILTERED") {
    throw {
      status: 422,
      message: "Prompt blocked by NVIDIA content filter. Please try a safer prompt.",
    };
  }
  const b64 =
    (data as any)?.image ||
    (data as any)?.images?.[0] ||
    (data as any)?.artifacts?.[0]?.base64 ||
    (data as any)?.data?.[0]?.b64_json;
  const directUrl = (data as any)?.url || (data as any)?.images?.[0]?.url;
  if (typeof b64 === "string" && b64.length > 0)
    return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
  if (typeof directUrl === "string") return directUrl;
  if (artifact && artifact.finishReason) {
    throw {
      status: 422,
      message: `NVIDIA model finished with reason: ${artifact.finishReason}. Try a different prompt.`,
    };
  }
  throw { status: 500, message: "No image returned by NVIDIA model" };
}

/* ---------- Hugging Face Inference (router) ---------- */


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

    if (rawImage) {
      return json(400, {
        error: "Image editing is not supported. Please generate a new image with text only.",
      });
    }

    const provider: Provider = body.provider ?? "nvidia";
    const model = body.model ?? "black-forest-labs/flux.2-klein-4b";

    let imageUrl: string;
    let fallback = false;
    let fallbackModel: string | undefined;
    let fallbackReason: string | undefined;
    let fallbackMessage: string | undefined;
    try {
      const key = Deno.env.get("NVIDIA_API_KEY");
      if (!key) return json(500, { error: "NVIDIA_API_KEY is not configured" });
      imageUrl = await callNvidiaFlux(prompt, key, model);
    } catch (e) {
      const err = e as { status?: number; message?: string };
      const status = err.status ?? 500;
      console.error("Image provider error:", status, err.message);
      if (status === 401) return json(401, { error: "Invalid API key for selected provider." });
      if (status === 422) return json(422, { error: err.message ?? "Prompt blocked by NVIDIA content filter." });
      if (status === 429) return json(429, { error: "Rate limit exceeded. Try again shortly." });
      if (status === 402) return json(402, { error: "Usage limit reached. Please add credits to continue." });
      return json(500, { error: `Image generation failed: ${err.message ?? "unknown error"}` });
    }

    return json(200, { imageUrl, fallback, fallbackModel, fallbackReason, fallbackMessage });
  } catch (e) {
    console.error("Image error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
