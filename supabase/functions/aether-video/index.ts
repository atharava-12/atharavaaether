import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, frameCount = 12 } = await req.json();
    if (!prompt) throw new Error("Missing prompt");

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const totalFrames = Math.min(Math.max(frameCount, 6), 16);

    const framePrompts = Array.from({ length: totalFrames }, (_, i) => {
      const progress = i / (totalFrames - 1);
      const motionHint =
        progress < 0.33
          ? "establishing shot, camera beginning subtle pan"
          : progress < 0.66
          ? "mid-motion, continuous camera movement, slight zoom"
          : "closing shot, camera completing motion arc";
      return `Cinematic video keyframe ${i + 1} of ${totalFrames}. Scene: ${prompt}. ${motionHint}. Maintain identical subjects, lighting, color palette, and composition continuity with adjacent frames. Progressive motion at ${Math.round(progress * 100)}% through the shot. Photorealistic, no text, no watermark.`;
    });

    const results = await Promise.all(
      framePrompts.map(async (fp) => {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://chitchat.lovable.app",
            "X-Title": "ChitChat",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [{ role: "user", content: fp }],
            modalities: ["image", "text"],
          }),
        });
        if (!r.ok) {
          if (r.status === 429) throw new Error("Rate limit exceeded");
          if (r.status === 402) throw new Error("OpenRouter credit exhausted");
          throw new Error(`Provider error ${r.status}`);
        }
        const data = await r.json();
        return (
          data.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
          data.choices?.[0]?.message?.images?.[0]?.image_url
        ) as string | undefined;
      })
    );

    const frames = results.filter((u): u is string => !!u);
    if (frames.length < 3) throw new Error("Failed to generate enough frames");

    return new Response(JSON.stringify({ frames }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("aether-video error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
