import { afterEach, describe, expect, it, vi } from "vitest";
import { buildLocalResearchBrief, buildResearchPlan, detectResearchProvider, fetchResearchResults, streamResearchAnswer } from "./research";

describe("research routing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses a local fallback when no external provider key is present", () => {
    expect(detectResearchProvider()).toBe("local");
    const plan = buildResearchPlan("Research the latest open-source LLM benchmarks");
    expect(plan.configured).toBe(true);
    expect(plan.provider).toBe("local");
    expect(plan.message).toContain("local");
  });

  it("prefers Brave when configured", () => {
    vi.stubEnv("VITE_BRAVE_SEARCH_API_KEY", "test-key");
    expect(detectResearchProvider()).toBe("brave");
    const plan = buildResearchPlan("Compare AI coding assistants");
    expect(plan.configured).toBe(true);
    expect(plan.provider).toBe("brave");
    expect(plan.keyQuestions.length).toBeGreaterThan(0);
    expect(plan.sourceChecklist.some((item) => item.toLowerCase().includes("source"))).toBe(true);
  });

  it("produces a research brief with validation guardrails", () => {
    const plan = buildResearchPlan("Research the best AI workflow tools for product teams");
    expect(plan.guardrails).toContain("cite");
    expect(plan.keyQuestions[0]).toMatch(/workflow|team|tool|model/i);
  });

  it("creates a usable local research brief for the current prompt", () => {
    const brief = buildLocalResearchBrief("What are the best AI workflow tools for product teams?");
    expect(brief.summary).toMatch(/workflow|product|team/i);
    expect(brief.sources.length).toBeGreaterThan(0);
    expect(brief.answer).toContain("product");
  });

  it("fetches live search results when a provider is configured", async () => {
    vi.stubEnv("VITE_BRAVE_SEARCH_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        web: {
          results: [{ title: "AI workflow guide", url: "https://example.com/guide", description: "A guide for product teams using AI workflows." }],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await fetchResearchResults("AI workflow tools for product teams");
    expect(results.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalled();
    expect(results[0].title).toMatch(/AI|workflow/i);
  });

  it("streams an AI research answer without inventing web citations", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://project.example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"## Direct answer\\nA useful answer."}}]}\n\n' +
            "data: [DONE]\n\n",
          ));
          controller.close();
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const chunks: string[] = [];

    const answer = await streamResearchAnswer("How should I compare these tools?", [], (chunk) => chunks.push(chunk), "nemotron-nano");

    expect(answer).toContain("A useful answer");
    expect(chunks.join("")).toBe(answer);
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.modelId).toBe("nemotron-nano");
    expect(requestBody.provider).toBe("nvidia");
    expect(requestBody.messages[1].content).toContain("Do not claim to have searched the web");
  });
});
