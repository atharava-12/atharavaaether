import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = "Your name and identity are ChitChat. You are the AI assistant, not the human user. If asked your name, say ChitChat. Never use the user's display name as your own name or claim to be the user. You speak casually but clearly and help with studies, coding, and daily questions. Use markdown formatting (code blocks, bold, lists) when helpful. Reply in whatever language the user writes in. **Important:** If anyone asks who developed you, who created you, who made ChitChat, or anything about your creator, always mention: 'ChitChat was developed by **Atharava Singh Pawar**, a talented full-stack developer passionate about AI and creating useful applications that help people learn and be productive.'";

type ModelId =
  | "qwen-3.5"
  | "nemotron-super"
  | "nemotron-nano"
  | "mistral-large"
  | "mistral-small"
  | "gemma-3n";

type ProviderId = "nvidia" | "hf" | "openai" | "anthropic" | "google" | "custom";

function resolveProvider(provider: unknown, modelId: ModelId): ProviderId {
  const normalized = typeof provider === "string" ? provider.toLowerCase() : "";
  if (normalized === "hf" || normalized === "huggingface") return "hf";
  if (normalized === "openai") return "openai";
  if (normalized === "anthropic") return "anthropic";
  if (normalized === "google" || normalized === "gemini") return "google";
  if (normalized === "custom") return "custom";
  if (normalized === "nvidia") return "nvidia";
  if (modelId === "qwen-3.5") return "hf";
  return "nvidia";
}

function getNotConfiguredProviderResponse(provider: ProviderId) {
  const configMap: Record<ProviderId, string> = {
    nvidia: "NVIDIA_API_KEY is not configured on the server.",
    hf: "HF_TOKEN is not configured on the server.",
    openai: "OPENAI_API_KEY is not configured on the server for the OpenAI provider adapter.",
    anthropic: "ANTHROPIC_API_KEY is not configured on the server for the Anthropic provider adapter.",
    google: "GEMINI_API_KEY is not configured on the server for the Gemini provider adapter.",
    custom: "No custom provider adapter is configured for this request.",
  };

  return new Response(JSON.stringify({ error: configMap[provider] }), {
    status: 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getPersonalizationPrompt(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const profile = value as { displayName?: unknown; interests?: unknown };
  const displayName = typeof profile.displayName === "string"
    ? profile.displayName.trim().slice(0, 50)
    : "";
  const interests = Array.isArray(profile.interests)
    ? profile.interests.filter((item): item is string => typeof item === "string").slice(0, 12)
    : [];
  if (!displayName && interests.length === 0) return "";

  return [
    "The following profile fields describe the HUMAN USER, not you (the assistant). Use the user's name only when addressing the user. Never present it as your own name. Interests are optional context for tailoring relevant examples; do not force them into unrelated answers.",
    displayName ? `User's display name: ${JSON.stringify(displayName)}.` : "",
    interests.length ? `User's interests: ${JSON.stringify(interests)}.` : "",
  ].filter(Boolean).join(" ");
}

function buildPayload(modelId: ModelId, messages: unknown[], personalizationPrompt: string) {
  const base = {
    messages: [
      { role: "system", content: systemPrompt },
      ...(personalizationPrompt ? [{ role: "system", content: personalizationPrompt }] : []),
      ...messages,
    ],
    stream: true,
  };

  const resolveModelForProvider = (id: ModelId) => {
    switch (id) {
      case "qwen-3.5": return "qwen/qwen3.5-397b-a17b";
      case "nemotron-super": return "nvidia/nemotron-3-super-120b-a12b";
      case "nemotron-nano": return "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
      case "mistral-large": return "mistralai/mistral-large-3-675b-instruct-2512";
      case "mistral-small": return "mistralai/mistral-small-4-119b-2603";
      case "gemma-3n": return "google/gemma-3n-e4b-it";
      default: return "nvidia/nemotron-3-super-120b-a12b";
    }
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
        max_tokens: 8192,
        temperature: 1,
        top_p: 0.95,
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 4096,
      };
    case "nemotron-nano":
      return {
        ...base,
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        max_tokens: 8192,
        temperature: 0.6,
        top_p: 0.95,
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 4096,
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
        // Gemma 3n is listed by the provider catalog but is not deployed for
        // this API account. Use the working fast reasoning model instead of
        // returning a provider 404 to the user.
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        max_tokens: 8192,
        temperature: 0.6,
        top_p: 0.95,
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 4096,
      };
    default:
      return {
        ...base,
        model: resolveModelForProvider(modelId),
        max_tokens: 16384,
        temperature: 1,
        top_p: 0.95,
      };
  }
}

function buildOpenAiRequest(modelId: ModelId, messages: unknown[], personalizationPrompt: string) {
  const baseMessages = [
    { role: "system", content: systemPrompt },
    ...(personalizationPrompt ? [{ role: "system", content: personalizationPrompt }] : []),
    ...messages,
  ];

  return {
    model: modelId === "qwen-3.5" ? "gpt-4o-mini" : "gpt-4o-mini",
    messages: baseMessages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  };
}

function buildAnthropicRequest(modelId: ModelId, messages: unknown[], personalizationPrompt: string) {
  const normalizedMessages = messages.filter((message: any) => message && typeof message === "object" && message.role && message.content);
  const systemContent = [systemPrompt, personalizationPrompt].filter(Boolean).join("\n");

  return {
    model: modelId === "mistral-large" ? "claude-3-5-sonnet-20241022" : "claude-3-5-haiku-20241022",
    max_tokens: 2048,
    messages: normalizedMessages,
    system: systemContent,
    stream: true,
  };
}

function buildGeminiRequest(modelId: ModelId, messages: unknown[], personalizationPrompt: string) {
  const history = messages.map((message: any) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: String(message.content ?? "") }],
  }));

  return {
    contents: [
      ...history,
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n${personalizationPrompt ? `${personalizationPrompt}\n` : ""}` }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
    safetySettings: [],
  };
}

function wrapTextAsSse(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

function extractAssistantText(payload: any): string {
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload)) {
    const firstText = payload[0];
    if (firstText && typeof firstText === "object" && typeof firstText.generated_text === "string") return firstText.generated_text;
    return String(firstText ?? "");
  }
  if (payload && typeof payload === "object") {
    if (typeof payload.content === "string") return payload.content;
    if (Array.isArray(payload.content)) {
      return payload.content.map((part: any) => (typeof part?.text === "string" ? part.text : "")).join("");
    }
    if (typeof payload.output_text === "string") return payload.output_text;
    if (typeof payload.text === "string") return payload.text;
    if (Array.isArray(payload.candidates)) {
      const textParts = payload.candidates.flatMap((candidate: any) => candidate?.content?.parts ?? []);
      return textParts.map((part: any) => part?.text ?? "").join("");
    }
    if (typeof payload.message?.content === "string") return payload.message.content;
    if (Array.isArray(payload.messages)) {
      return payload.messages.map((message: any) => typeof message?.content === "string" ? message.content : "").join("\n");
    }
  }
  return "";
}

async function streamProviderResponse(provider: ProviderId, providerKey: string, requestBody: Record<string, unknown>, url: string, headers: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      ...(provider === "openai" ? { Authorization: `Bearer ${providerKey}` } : {}),
      ...(provider === "anthropic" ? { "x-api-key": providerKey, "anthropic-version": "2023-06-01" } : {}),
      ...(provider === "google" ? { "x-goog-api-key": providerKey } : {}),
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text();
    throw new Error(`Provider request failed (${response.status}): ${errText || response.statusText}`);
  }

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : null;
  const responseText = extractAssistantText(parsed) || "";
  return wrapTextAsSse(responseText);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    const modelId = (body?.modelId as ModelId) || "nemotron-super";
    const provider = resolveProvider(body?.provider, modelId);
    const fallbackProvider = resolveProvider(body?.fallbackProvider, modelId);
    const personalizationPrompt = getPersonalizationPrompt(body?.personalization);

    if (!messages) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (provider === "custom") {
      return new Response(JSON.stringify({ error: "Custom provider adapter is not configured for this deployment." }), {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (provider === "hf" || modelId === "qwen-3.5") {
      const HF_TOKEN = Deno.env.get("HF_TOKEN");
      if (!HF_TOKEN) {
        return getNotConfiguredProviderResponse("hf");
      }

      // Build a simple prompt concatenating system + history
      const userPrompt = [
        `System: ${systemPrompt}`,
        personalizationPrompt ? `System: ${personalizationPrompt}` : "",
        ...messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
        "Assistant:",
      ].filter(Boolean).join("\n");

      try {
        const hfRes = await fetch("https://api-inference.huggingface.co/models/qwen/qwen3.5-397b-a17b", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ inputs: userPrompt, parameters: { max_new_tokens: 1024, temperature: 0.6 } }),
        });

        if (!hfRes.ok) {
          const t = await hfRes.text().catch(() => "");
          console.error('HF Qwen error:', hfRes.status, t);
          return new Response(JSON.stringify({ error: 'Qwen model request failed' }), {
            status: hfRes.status || 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Attempt to parse HF result
        let text = await hfRes.text();
        try {
          const j = JSON.parse(text);
          // HF may return { generated_text } or an array; try to extract plain text
          if (typeof j === 'object') {
            if (Array.isArray(j) && j[0]?.generated_text) text = j[0].generated_text;
            else if (j.generated_text) text = j.generated_text;
            else if (j.error && typeof j.error === 'string') text = j.error;
            else text = JSON.stringify(j);
          }
        } catch {}

        const sseStream = new ReadableStream({
          start(controller) {
            const payload = { choices: [{ delta: { content: text } }] };
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
            controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
            controller.close();
          },
        });

        return new Response(sseStream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      } catch (err) {
        console.error('Qwen proxy error:', err);
        return new Response(JSON.stringify({ error: 'Qwen model proxying failed' }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fallback to NVIDIA integration for other models
    const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY");
    if (!NVIDIA_API_KEY) {
      return new Response(JSON.stringify({ error: "NVIDIA_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = buildPayload(modelId, messages, personalizationPrompt);

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
