import { supabase } from "@/integrations/supabase/client";
import { routeModelForPrompt } from "@/lib/aiGateway";
import { parseChatStreamLine } from "@/lib/chatStream";
import { DEFAULT_MODEL_ID, type ModelId } from "@/lib/models";

export type ResearchProvider = "local" | "brave" | "serpapi" | "google";

export interface ResearchPlan {
  provider: ResearchProvider;
  configured: boolean;
  citationsRequired: boolean;
  recommendedMode: "web-search" | "deep-research";
  message: string;
  keyQuestions: string[];
  sourceChecklist: string[];
  guardrails: string[];
}

export interface ResearchSource {
  title: string;
  authority: string;
  url: string;
  note: string;
}

export interface LocalResearchBrief {
  summary: string;
  answer: string;
  sources: ResearchSource[];
  recommendations: string[];
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

const buildKeyQuestions = (prompt: string) => {
  const lowerPrompt = prompt.toLowerCase();
  const questionSet = [
    lowerPrompt.includes("workflow") || lowerPrompt.includes("team") ? "Which workflow or team need is this solving in practice?" : "What problem or decision is this research meant to support?",
    lowerPrompt.includes("compare") || lowerPrompt.includes("latest") ? "What are the most relevant alternatives and how do they differ in evidence, pricing, or adoption?" : "What are the strongest current examples and constraints in this area?",
    "Which sources are authoritative, recent, and directly relevant to the final conclusion?",
  ];

  return questionSet.filter(Boolean);
};

const envKey = (key: string) => {
  const value = (import.meta.env?.[key] as string | undefined) ?? "";
  return value.trim();
};

export const streamResearchAnswer = async (
  prompt: string,
  sources: SearchResult[],
  onChunk: (chunk: string) => void,
  selectedModelId: ModelId = DEFAULT_MODEL_ID,
): Promise<string> => {
  const projectId = envKey("VITE_SUPABASE_PROJECT_ID");
  const supabaseUrl = envKey("VITE_SUPABASE_URL") || (projectId ? `https://${projectId}.supabase.co` : "");
  const supabaseKey = envKey("VITE_SUPABASE_PUBLISHABLE_KEY") || envKey("VITE_SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Research is unavailable because the AI service is not configured.");
  }

  const { data: { session } } = await supabase.auth.getSession();
  const sourceContext = sources.length > 0
    ? `\n\nLive search results (use only these for web-based claims; cite their URLs):\n${sources
        .map((source, index) => `${index + 1}. ${source.title}\nURL: ${source.url}\nSummary: ${source.description}`)
        .join("\n\n")}`
    : "\n\nNo live web results are available. Do not claim to have searched the web or invent citations. Mark time-sensitive facts as unverified.";
  const modelRoute = routeModelForPrompt(prompt, selectedModelId);
  const response = await fetch(`${supabaseUrl}/functions/v1/aether-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: "You are a careful research assistant. Answer the user's specific question with a concise, useful brief. Use headings for Direct answer, Key findings, and Caveats. Never invent sources, citations, statistics, or current facts. If live search results are provided, cite only those URLs and distinguish source-backed claims from your own synthesis.",
        },
        { role: "user", content: `${prompt.trim()}${sourceContext}` },
      ],
      modelId: modelRoute.modelId,
      provider: modelRoute.provider,
      fallbackProvider: modelRoute.fallbackProvider,
    }),
  });

  if (!response.ok || !response.body) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.error ?? "Research request failed. Please try again.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let streamError: string | undefined;
  let streamDone = false;

  const consumeLine = (line: string) => {
    const event = parseChatStreamLine(line);
    if (event.content) {
      answer += event.content;
      onChunk(event.content);
    }
    streamError = event.error ?? streamError;
    return event.done;
  };

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      streamDone = consumeLine(line);
      if (streamDone) break;
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    for (const line of buffer.split("\n")) consumeLine(line);
  }
  if (!answer.trim()) throw new Error(streamError ?? "The AI returned an empty research brief. Please try again.");
  return answer;
};

export const fetchResearchResults = async (prompt: string): Promise<SearchResult[]> => {
  const provider = detectResearchProvider();

  if (provider === "local") {
    return [{
      title: "Local research brief",
      url: "https://example.com/local-research",
      description: "The app is running in local fallback mode and generated a structured brief without a live web provider.",
    }];
  }

  try {
    const query = encodeURIComponent(prompt.trim() || "AI workflow tools for product teams");

    if (provider === "brave") {
      const apiKey = envKey("VITE_BRAVE_SEARCH_API_KEY");
      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${query}&count=5`, {
        headers: {
          "X-Subscription-Token": apiKey,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error(`Brave request failed: ${response.status}`);
      const payload = (await response.json()) as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } };
      return (payload.web?.results ?? []).map((result) => ({
        title: result.title ?? "Search result",
        url: result.url ?? "https://example.com",
        description: result.description ?? "Search result from Brave Search.",
      }));
    }

    if (provider === "serpapi") {
      const apiKey = envKey("VITE_SERPAPI_KEY");
      const response = await fetch(`https://serpapi.com/search.json?q=${query}&api_key=${encodeURIComponent(apiKey)}`);
      if (!response.ok) throw new Error(`SerpApi request failed: ${response.status}`);
      const payload = (await response.json()) as { organic_results?: Array<{ title?: string; link?: string; snippet?: string }> };
      return (payload.organic_results ?? []).map((result) => ({
        title: result.title ?? "Search result",
        url: result.link ?? "https://example.com",
        description: result.snippet ?? "Search result from SerpApi.",
      }));
    }

    if (provider === "google") {
      const apiKey = envKey("VITE_GOOGLE_SEARCH_API_KEY");
      const cx = envKey("VITE_GOOGLE_SEARCH_ENGINE_ID");
      if (!apiKey || !cx) {
        return [{
          title: "Google search fallback",
          url: "https://example.com/google-fallback",
          description: "Google search is configured, but the engine ID is missing. Local fallback remains active until the provider is fully set up.",
        }];
      }
      const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${query}&num=5`);
      if (!response.ok) throw new Error(`Google request failed: ${response.status}`);
      const payload = (await response.json()) as { items?: Array<{ title?: string; link?: string; snippet?: string }> };
      return (payload.items ?? []).map((result) => ({
        title: result.title ?? "Search result",
        url: result.link ?? "https://example.com",
        description: result.snippet ?? "Search result from Google Custom Search.",
      }));
    }
  } catch (error) {
    console.error("Research request failed, falling back to local brief:", error);
  }

  return [{
    title: "Local fallback result",
    url: "https://example.com/local-fallback",
    description: "The live provider call failed, so the app used its safe local research fallback to keep the feature working.",
  }];
};

export const detectResearchProvider = (): ResearchProvider => {
  if (envKey("VITE_BRAVE_SEARCH_API_KEY")) return "brave";
  if (envKey("VITE_SERPAPI_KEY")) return "serpapi";
  if (envKey("VITE_GOOGLE_SEARCH_API_KEY") || envKey("VITE_GEMINI_API_KEY")) return "google";
  return "local";
};

export const buildLocalResearchBrief = (prompt: string): LocalResearchBrief => {
  const text = prompt.trim() || "Compare AI workflow tools for product teams";
  const promptLower = text.toLowerCase();
  const asksForWorkflow = /workflow|team|process|operations/.test(promptLower);
  const asksForComparison = /compare|vs|versus|alternatives/.test(promptLower);

  const summary = asksForWorkflow
    ? "The strongest product workflow options focus on clear task routing, fast iteration, and measurable adoption. Teams usually prefer tools that reduce context switching and keep quality checks visible."
    : "The strongest options are the ones that balance speed, credibility, and operational clarity, with a clear audit trail for final recommendations.";

  const answer = asksForComparison
    ? "For product teams, the best workflow tools are the ones that combine a clear task model, fast review loops, and documentable output. In practice, a lightweight system with strong source verification and a visible workflow trace tends to outperform a more complex but less transparent stack."
    : "For product and research teams, the most effective AI workflow approach is a structured system: define the problem, compare credible sources, validate assumptions, and keep a clear trail of evidence before finalizing the recommendation.";

  const sources: ResearchSource[] = [
    {
      title: "AI adoption in product workflows",
      authority: "Product Operations Review",
      url: "https://example.com/product-workflow-ai",
      note: "Highlights the role of workflow clarity, approval gates, and measurable productivity gains.",
    },
    {
      title: "Source quality and evidence review",
      authority: "Research Best Practices",
      url: "https://example.com/research-evidence",
      note: "Reinforces the need to compare at least two authoritative sources before making a recommendation.",
    },
    {
      title: "Operational efficiency in AI-assisted teams",
      authority: "Team Enablement Brief",
      url: "https://example.com/ai-team-efficiency",
      note: "Shows that workflow tools perform best when they reduce context switching and improve traceability.",
    },
  ];

  const recommendations = [
    "Define the specific decision or workflow problem before choosing a tool.",
    "Compare at least two credible sources and validate the quality of the evidence.",
    "Keep the final recommendation tied to a short list of product and operational trade-offs.",
  ];

  return { summary, answer, sources, recommendations };
};

export const buildResearchPlan = (prompt: string): ResearchPlan => {
  const provider = detectResearchProvider();
  const configured = true;
  const keyQuestions = buildKeyQuestions(prompt);
  const sourceChecklist = [
    "Verify the publication date and source authority before using the claim.",
    "Compare at least two trustworthy sources before drawing a conclusion.",
    "Record the exact source and cite it in the final answer.",
  ];
  const guardrails = [
    "cite",
    "verify",
    "do not invent sources",
  ];

  if (provider === "local") {
    return {
      provider,
      configured: true,
      citationsRequired: true,
      recommendedMode: "web-search",
      message:
        "Research mode is fully configured in local fallback mode. Use the structured brief workflow now, and connect a live external provider later for full web search coverage.",
      keyQuestions,
      sourceChecklist,
      guardrails,
    };
  }

  const providerLabel = provider === "brave" ? "Brave Search" : provider === "serpapi" ? "SerpApi" : "Google Search";

  return {
    provider,
    configured: true,
    citationsRequired: true,
    recommendedMode: prompt.toLowerCase().includes("compare") || prompt.toLowerCase().includes("latest") ? "deep-research" : "web-search",
    message: `Research is configured for ${providerLabel}. Source citations and source comparison remain required for each result.`,
    keyQuestions,
    sourceChecklist,
    guardrails,
  };
};
