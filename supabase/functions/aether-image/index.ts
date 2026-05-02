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

    // Optional: image input enables editing mode. Accepts a single data URL string.
    const rawImage =
      typeof image === "string" && image.length > 0
        ? image
        : Array.isArray(image) && typeof image[0] === "string"
          ? image[0]
          : null;

    const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY");
    if (!NVIDIA_API_KEY) {
      return new Response(JSON.stringify({ error: "NVIDIA_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If editing, upload the image as an NVCF asset and reference it by asset_id.
    let imageRef: string | null = null;
    if (rawImage) {
      try {
        imageRef = await uploadNvcfAsset(rawImage, NVIDIA_API_KEY);
      } catch (e) {
        console.error("NVCF asset upload failed:", e);
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Image upload failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const payload: Record<string, unknown> = {
      prompt,
      width: 1024,
      height: 1024,
      seed: 0,
      steps: 4,
    };
    const extraHeaders: Record<string, string> = {};
    if (imageRef) {
      // NVIDIA expects the image field to reference the uploaded asset.
      payload.image = [imageRef];
      // Tell the gateway which assets are attached to this invocation.
      const assetId = imageRef.split(",")[1];
      extraHeaders["NVCF-INPUT-ASSET-REFERENCES"] = assetId;
    }

    const response = await fetch(
      "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          ...extraHeaders,
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
