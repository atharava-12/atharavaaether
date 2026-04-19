import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, frameCount = 6 } = await req.json();
    if (!prompt) throw new Error("Missing prompt");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const totalFrames = Math.min(Math.max(frameCount, 3), 8);

    // Generate frames in parallel as a sequence
    const framePrompts = Array.from({ length: totalFrames }, (_, i) =>
      `Cinematic video frame ${i + 1} of ${totalFrames} from this scene: ${prompt}. Maintain visual continuity with subtle motion progression. Frame ${i + 1}/${totalFrames}.`
    );

    const results = await Promise.all(
      framePrompts.map(async (fp) => {
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: fp }],
            modalities: ["image", "text"],
          }),
        });
        if (!r.ok) {
          if (r.status === 429) throw new Error("Rate limit exceeded");
          if (r.status === 402) throw new Error("Usage limit reached");
          throw new Error(`Gateway error ${r.status}`);
        }
        const data = await r.json();
        return data.choices?.[0]?.message?.images?.[0]?.image_url?.url as string | undefined;
      })
    );

    const frames = results.filter((u): u is string => !!u);
    if (frames.length < 2) throw new Error("Failed to generate enough frames");

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
