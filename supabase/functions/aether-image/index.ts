import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Provider = "nvidia" | "hf";

interface RequestBody {
  prompt: string;
  image?: string | string[];
  provider?: Provider;
  model?: string;
  width?: number;
  height?: number;
  seed?: number;
}

const SUPPORTED_NVIDIA_MODELS = new Set([
  "black-forest-labs/flux.2-klein-4b",
  "black-forest-labs/flux.3-image-klein",
  "black-forest-labs/flux.1-schnell",
]);
const NVIDIA_EDIT_MODELS = new Set([
  "black-forest-labs/flux.2-klein-4b",
  "black-forest-labs/flux.3-image-klein",
]);
const SUPPORTED_HF_MODELS = new Set(["awen/awen-image", "qwen/qwen-image"]);
const SUPPORTED_DIMENSIONS = new Set([
  "1024x1024", "1568x880", "880x1568", "1184x880", "880x1184",
]);
const NVIDIA_IMAGE_EXAMPLE_REFERENCE = "data:image/png;example_id,0";

const DEFAULT_NVIDIA_MODEL = "black-forest-labs/flux.2-klein-4b";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function sanitizePrompt(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 && trimmed.length <= 4000 ? trimmed : "";
}

function resolveSupportedModel(provider: Provider, requestedModel?: string) {
  const candidate = requestedModel?.trim();

  if (provider === "hf") {
    return candidate && SUPPORTED_HF_MODELS.has(candidate)
      ? candidate
      : "awen/awen-image";
  }

  return candidate && SUPPORTED_NVIDIA_MODELS.has(candidate)
    ? candidate
    : DEFAULT_NVIDIA_MODEL;
}

function rewritePromptForNvidia(prompt: string): string {
  const input = prompt.trim().replace(/\s+/g, " ");
  const lower = input.toLowerCase();

  if (/(harry potter|potter)/i.test(lower)) {
    return "young wizard in a magical castle corridor, round glasses, fantasy illustration, warm cinematic lighting, detailed character portrait";
  }

  if (/(spider[- ]?man|marvel|batman|superman|iron man)/i.test(lower)) {
    return "stylish comic book hero in a dramatic city scene, bold fantasy colors, cinematic action pose, detailed illustration";
  }

  return input;
}

async function uploadNvidiaImage(imageDataUrl: string, apiKey: string) {
  const imageMatch = imageDataUrl.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!imageMatch) throw { status: 400, message: "Upload a PNG or JPEG image." };

  const contentType = `image/${imageMatch[1]}`;
  const assetDescription = "ChitChatGen temporary image edit input";
  const binary = atob(imageMatch[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);

  const createResponse = await fetch("https://api.nvcf.nvidia.com/v2/nvcf/assets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType, description: assetDescription }),
  });
  const created = await createResponse.json().catch(() => null);
  if (!createResponse.ok || typeof created?.assetId !== "string" || typeof created?.uploadUrl !== "string") {
    throw { status: createResponse.status || 500, stage: "asset-create", message: "Could not prepare a secure image upload with NVIDIA." };
  }
  const signedUploadUrl = new URL(created.uploadUrl);
  const signedHeaders = signedUploadUrl.searchParams.get("X-Amz-SignedHeaders") ?? "unspecified";

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(created.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "x-amz-meta-nvcf-asset-description": assetDescription,
      },
      body: bytes,
    });
  } catch {
    await fetch(`https://api.nvcf.nvidia.com/v2/nvcf/assets/${created.assetId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    }).catch(() => undefined);
    throw { status: 502, stage: "asset-upload", message: "NVIDIA's temporary image upload could not be reached." };
  }
  if (!uploadResponse.ok) {
    const uploadError = await uploadResponse.text().catch(() => "");
    const storageErrorCode = uploadError.match(/<Code>([^<]+)<\/Code>/)?.[1] ?? "unknown";
    await fetch(`https://api.nvcf.nvidia.com/v2/nvcf/assets/${created.assetId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    }).catch(() => undefined);
    throw { status: uploadResponse.status, stage: "asset-upload", code: storageErrorCode, message: "NVIDIA could not accept the uploaded image." };
  }

  return created.assetId as string;
}

async function deleteNvidiaImageAsset(assetId: string, apiKey: string) {
  const response = await fetch(`https://api.nvcf.nvidia.com/v2/nvcf/assets/${assetId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) console.warn("NVIDIA temporary image cleanup failed:", response.status);
}

async function callNvidiaFlux(
  prompt: string,
  apiKey: string,
  model: string = DEFAULT_NVIDIA_MODEL,
  image?: string,
  width = 1024,
  height = 1024,
  seed = 0,
) {
  const selectedModel = resolveSupportedModel("nvidia", model);
  const inputAssetId = image ? await uploadNvidiaImage(image, apiKey) : undefined;
  const attemptRequest = async (currentPrompt: string) => {
    const steps = selectedModel === "black-forest-labs/flux.3-image-klein" ? 50 : 4;
    const payload: Record<string, unknown> = {
      prompt: currentPrompt,
      width,
      height,
      seed,
      steps,
    };
    if (inputAssetId) {
      payload.image = [NVIDIA_IMAGE_EXAMPLE_REFERENCE];
    }

    const response = await fetch(`https://ai.api.nvidia.com/v1/genai/${selectedModel}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(inputAssetId ? { "NVCF-INPUT-ASSET-REFERENCES": inputAssetId } : {}),
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    if (!response.ok) {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
      const detail = parsed && typeof parsed === "object" ? (parsed as any)?.detail : null;
      const validationMessages = Array.isArray(detail)
        ? detail.map((item: any) => {
            const field = Array.isArray(item?.loc) ? item.loc.filter((part: unknown) => typeof part === "string" || typeof part === "number").join(".") : "request";
            const issue = typeof item?.msg === "string" ? item.msg : "Invalid value";
            return `${field}: ${issue}`;
          }).slice(0, 5).join("; ")
        : "";
      const safeMessage = validationMessages || (response.status === 401 ? "NVIDIA authentication failed." : `NVIDIA request failed (${response.status}).`);
      throw { status: response.status, stage: "model-inference", message: safeMessage };
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

    if (artifact?.finishReason === "ERROR") {
      throw { status: 500, stage: "model-inference", message: "NVIDIA image generation failed." };
    }
    const b64 =
      artifact?.base64 ||
      (data as any)?.image ||
      (data as any)?.images?.[0] ||
      (data as any)?.data?.[0]?.b64_json;
    const directUrl = (data as any)?.url || (data as any)?.images?.[0]?.url;
    if (typeof b64 === "string" && b64.length > 0)
      return b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
    if (typeof directUrl === "string") return directUrl;
    if (artifact && artifact.finishReason) {
      throw {
        status: 422,
        message: `NVIDIA model finished with reason: ${artifact.finishReason}. Try a different prompt.`,
      };
    }
    throw { status: 500, stage: "model-inference", message: "No image returned by NVIDIA model" };
  };

  try {
    try {
      return await attemptRequest(prompt);
    } catch (err) {
      const error = err as { status?: number; message?: string };
      const fallbackPrompt = rewritePromptForNvidia(prompt);
      if (error.status === 422 && fallbackPrompt !== prompt) {
        return await attemptRequest(fallbackPrompt);
      }
      throw err;
    }
  } finally {
    if (inputAssetId) await deleteNvidiaImageAsset(inputAssetId, apiKey);
  }
}

async function callHuggingFace(prompt: string, token: string, model: string) {
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json, image/*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!response.ok) {
    throw { status: response.status, message: text.slice(0, 1000) };
  }

  if (contentType.includes("application/json")) {
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    const b64 = data?.image || data?.images?.[0] || data?.artifacts?.[0]?.base64 || data?.data?.[0]?.b64_json;
    const directUrl = data?.url || data?.images?.[0]?.url;
    if (typeof b64 === "string" && b64.length > 0) return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
    if (typeof directUrl === "string") return directUrl;
    throw { status: 500, message: "No image returned by Hugging Face model" };
  }

  if (contentType.startsWith("image/")) {
    const buf = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const b64 = btoa(binary);
    return `data:${contentType};base64,${b64}`;
  }

  throw { status: 500, stage: "hf-inference", message: `Unexpected Hugging Face response: ${contentType}` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    const prompt = sanitizePrompt(body?.prompt);
    if (!prompt) {
      return json(400, { error: "Please enter a description of the image you want to create." });
    }

    const provider: Provider = body.provider ?? "nvidia";
    const rawImage = typeof body.image === "string"
      ? body.image
      : Array.isArray(body.image) && body.image.length === 1 && typeof body.image[0] === "string"
        ? body.image[0]
        : null;
    if (Array.isArray(body.image) && body.image.length > 1) {
      return json(400, { error: "This model accepts one reference image per request." });
    }

    const requestedModel = body.model?.trim();
    if (requestedModel) {
      const supported = provider === "nvidia"
        ? SUPPORTED_NVIDIA_MODELS.has(requestedModel)
        : SUPPORTED_HF_MODELS.has(requestedModel);
      if (!supported) return json(400, { error: "That image model is unavailable for this deployment." });
    }
    const model = resolveSupportedModel(provider, body.model);
    if (rawImage) {
      if (provider !== "nvidia" || !NVIDIA_EDIT_MODELS.has(model)) {
        return json(400, { error: "Choose Flux.2 Klein or Flux.3 Image Klein to edit an uploaded image." });
      }
      const imageMatch = rawImage.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/);
      if (!imageMatch || rawImage.length > 12_000_000) {
        return json(400, { error: "Upload a PNG or JPEG image smaller than 8 MB." });
      }
      const decodedSize = atob(imageMatch[2]).length;
      if (decodedSize > 8 * 1024 * 1024) {
        return json(400, { error: "Upload a PNG or JPEG image smaller than 8 MB." });
      }
    }

    const width = Number.isInteger(body.width) ? body.width! : 1024;
    const height = Number.isInteger(body.height) ? body.height! : 1024;
    if (!SUPPORTED_DIMENSIONS.has(`${width}x${height}`)) {
      return json(400, { error: "Choose a supported image aspect ratio." });
    }
    const seed = Number.isInteger(body.seed) && body.seed! >= 0 && body.seed! <= 4294967295
      ? body.seed!
      : 0;

    let imageUrl: string;
    let fallback = false;
    let fallbackModel: string | undefined;
    let fallbackMessage: string | undefined;

    try {
      if (provider === "nvidia") {
        const key = Deno.env.get("NVIDIA_API_KEY");
        if (!key) {
          console.error("Missing NVIDIA_API_KEY in Edge Function environment");
          return json(500, { error: "Image generation is temporarily unavailable. Please try again." });
        }

        const originalPrompt = prompt;
        const rewrittenPrompt = rewritePromptForNvidia(prompt);
        imageUrl = await callNvidiaFlux(prompt, key, model, rawImage ?? undefined, width, height, seed);
        if (rewrittenPrompt !== originalPrompt) {
          fallback = true;
          fallbackModel = model;
          fallbackMessage = "NVIDIA blocked the original prompt, so a generic fantasy variant was used instead.";
        }
      } else if (provider === "hf") {
        const token = Deno.env.get("HF_TOKEN");
        if (!token) {
          console.error("Missing HF_TOKEN in Edge Function environment");
          return json(500, { error: "Image generation is temporarily unavailable. Please try again." });
        }
        imageUrl = await callHuggingFace(prompt, token, model);
      } else {
        return json(400, { error: "Unsupported image provider" });
      }
    } catch (e) {
      const err = e as { status?: number; stage?: string; code?: string; message?: string };
      const status = err.status ?? 500;
      console.error("Image provider error:", { status, stage: err.stage, code: err.code, message: err.message, provider, model });

      if (err.stage === "asset-create" || err.stage === "asset-upload") {
        return json(502, {
          error: "Secure image upload to NVIDIA failed. Check NVIDIA NVCF asset access and try again.",
          code: err.stage === "asset-create" ? "nvidia_asset_create_failed" : "nvidia_asset_upload_failed",
          upstreamStatus: status,
        });
      }

      if (status === 401) return json(401, { error: "Image generation is temporarily unavailable. Please try again." });
      if (status === 422) return json(422, {
        error: "NVIDIA could not process this generation request.",
        details: err.message,
      });
      if (status === 429) return json(429, { error: "Image generation is temporarily unavailable. Please try again in a moment." });
      if (status === 402) return json(402, { error: "AI usage limit reached. Please try again later." });
      return json(500, { error: "Image generation failed. Please try again." });
    }

    return json(200, { imageUrl, fallback, fallbackModel, fallbackMessage });
  } catch (e) {
    console.error("Image error:", e);
    return json(500, { error: "Image generation failed. Please try again." });
  }
});
