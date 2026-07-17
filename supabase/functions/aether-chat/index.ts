import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = "You are ChitChat, a smart, friendly, and helpful assistant. You speak casually but clearly and help with studies, coding, and daily questions. Use markdown formatting (code blocks, bold, lists) when helpful. Reply in whatever language the user writes in. **Important:** If anyone asks who developed you, who created you, who made ChitChat, or anything about your creator, always mention: 'ChitChat was developed by **Atharav Vassingh Pawar**, a talented full-stack developer passionate about AI and creating useful applications that help people learn and be productive.'";

type ModelId =
  | "qwen-3.5"
  | "nemotron-super"
  | "nemotron-nano"
  | "mistral-large"
  | "mistral-small"
  | "gemma-3n";

function buildPayload(modelId: ModelId, messages: unknown[]) {
  const base = {
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true,
  };

  switch (modelId) {
    case "qwen-3.5":
      return {
        ...base,
        model: "qwen/qwen3.5-397b-a17b",
        max_tokens: 16384,
        temperature: 0.6,
        top_p: 0.95,
        top_k: 20,
        presence_penalty: 0,
        repetition_penalty: 1,
        chat_template_kwargs: { enable_thinking: true },
      };
    case "nemotron-super":
      return {
        ...base,
        model: "nvidia/nemotron-3-super-120b-a12b",
        max_tokens: 16384,
        temperature: 1,
        top_p: 0.95,
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 16384,
      };
    case "nemotron-nano":
      return {
        ...base,
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        max_tokens: 65536,
        temperature: 0.6,
        top_p: 0.95,
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 16384,
      };
    case "mistral-large":
      return {
        ...base,
        model: "mistralai/mistral-large-3-675b-instruct-2512",
        max_tokens: 2048,
        temperature: 0.15,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
      };
    case "mistral-small":
      return {
        ...base,
        model: "mistralai/mistral-small-4-119b-2603",
        max_tokens: 16384,
        temperature: 0.1,
        top_p: 1.0,
        reasoning_effort: "high",
      };
    case "gemma-3n":
      return {
        ...base,
        model: "google/gemma-3n-e4b-it",
        max_tokens: 512,
        temperature: 0.2,
        top_p: 0.7,
        frequency_penalty: 0,
        presence_penalty: 0,
      };
    default:
      return {
        ...base,
        model: "nvidia/nemotron-3-super-120b-a12b",
        max_tokens: 16384,
        temperature: 1,
        top_p: 0.95,
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    const modelId = (body?.modelId as ModelId) || "nemotron-super";

    if (!messages) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
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

    const payload = buildPayload(modelId, messages);

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      console.error("NVIDIA error:", response.status, errText);

      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid NVIDIA API key." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Model request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
