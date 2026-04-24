import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = "You are ChitChat, a smart, friendly, and helpful assistant. You speak casually but clearly and help with studies, coding, and daily questions. Use markdown formatting (code blocks, bold, lists) when helpful. Reply in whatever language the user writes in.";

const streamWithLovableAi = async (messages: Array<{ role: string; content: string }>, apiKey: string) => {
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });
};

const streamWithOpenRouterFallback = async (messages: Array<{ role: string; content: string }>, apiKey: string) => {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chitchat.lovable.app",
      "X-Title": "ChitChat",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-exp:free",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : null;

    if (!messages) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    if (!LOVABLE_API_KEY && !OPENROUTER_API_KEY) {
      throw new Error("No AI provider is configured");
    }

    if (LOVABLE_API_KEY) {
      const lovableResponse = await streamWithLovableAi(messages, LOVABLE_API_KEY);

      if (lovableResponse.ok) {
        return new Response(lovableResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      const lovableErrorText = await lovableResponse.text();
      console.error("Lovable AI error:", lovableResponse.status, lovableErrorText);

      if (!OPENROUTER_API_KEY && lovableResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (OPENROUTER_API_KEY) {
      const openRouterResponse = await streamWithOpenRouterFallback(messages, OPENROUTER_API_KEY);

      if (openRouterResponse.ok) {
        return new Response(openRouterResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      const openRouterErrorText = await openRouterResponse.text();
      console.error("OpenRouter fallback error:", openRouterResponse.status, openRouterErrorText);

      if (openRouterResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "AI credits are exhausted for the configured providers. Add funds in Settings → Workspace → Usage, or switch to another provider." }), {
      status: 402,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
