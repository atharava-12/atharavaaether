import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, image } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY");
    if (!NVIDIA_API_KEY) {
      return new Response(JSON.stringify({ error: "NVIDIA_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build payload - include image array for editing if provided
    const payload: Record<string, unknown> = {
      prompt,
      width: 1024,
      height: 1024,
      seed: 0,
      steps: 4,
    };
    let uploadedAssetId: string | null = null;

    if (image) {
      // NVIDIA requires image upload to their assets API first, then reference by asset_id
      const inputImage = Array.isArray(image) ? image[0] : image;

      // Parse data URL: "data:image/png;base64,XXXX"
      const match = typeof inputImage === "string" ? inputImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/) : null;
      if (!match) {
        return new Response(JSON.stringify({ error: "Image must be a base64 data URL" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const mimeType = match[1];
      const base64Data = match[2].replace(/\s/g, "");

      // Step 1: Authorize asset upload
      const authRes = await fetch("https://api.nvcf.nvidia.com/v2/nvcf/assets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          contentType: mimeType,
          description: "input image for flux edit",
        }),
      });

      if (!authRes.ok) {
        const t = await authRes.text();
        console.error("Asset authorize failed:", authRes.status, t);
        return new Response(JSON.stringify({ error: `Asset upload authorization failed: ${t.slice(0, 200)}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { uploadUrl, assetId } = await authRes.json();

      // Step 2: Upload binary to presigned URL
      const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
          "x-amz-meta-nvcf-asset-description": "input image for flux edit",
        },
        body: binary,
      });

      if (!uploadRes.ok) {
        const t = await uploadRes.text();
        console.error("Asset upload failed:", uploadRes.status, t);
        return new Response(JSON.stringify({ error: `Asset upload failed: ${t.slice(0, 200)}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Step 3: Reference the uploaded asset in the payload
      payload.image = [`data:${mimeType};asset_id,${assetId}`];
      uploadedAssetId = assetId;
    }

    const response = await fetch(
      "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("NVIDIA image error:", response.status, errText);
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid NVIDIA API key." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Image generation failed: ${errText.slice(0, 200)}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    const b64 =
      data?.image ||
      data?.images?.[0] ||
      data?.artifacts?.[0]?.base64 ||
      data?.data?.[0]?.b64_json;

    const directUrl = data?.url || data?.images?.[0]?.url;

    let imageUrl: string | null = null;
    if (typeof b64 === "string" && b64.length > 0) {
      imageUrl = b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
    } else if (typeof directUrl === "string") {
      imageUrl = directUrl;
    }

    if (!imageUrl) {
      console.error("Unexpected NVIDIA response shape:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No image returned by model" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
