import { describe, expect, it } from "vitest";
import { detectTaskType, getRouterSummary, routeModelForPrompt } from "./aiGateway";

describe("AI gateway routing", () => {
  it("detects coding requests", () => {
    expect(detectTaskType("Write a React hook that debounces fetch calls")).toBe("coding");
    expect(detectTaskType("Debug this TypeScript error in my project")).toBe("coding");
  });

  it("detects math and research tasks", () => {
    expect(detectTaskType("Solve this linear algebra problem step by step")).toBe("math");
    expect(detectTaskType("Research the latest open-source LLM benchmarks")).toBe("research");
  });

  it("routes coding tasks to a reasoning-capable model", () => {
    const route = routeModelForPrompt("Refactor this async code and explain the tradeoffs");
    expect(route.taskType).toBe("coding");
    expect(route.modelId).toBe("nemotron-super");
    expect(route.reason).toContain("coding");
  });

  it("keeps a fast model for quick general Q&A", () => {
    const route = routeModelForPrompt("What is the capital of Japan?");
    expect(route.taskType).toBe("general");
    expect(["nemotron-nano", "gemma-3n", "mistral-small"]).toContain(route.modelId);
  });

  it("summarizes route metadata for the UI", () => {
    const summary = getRouterSummary("Write a product launch email with a friendly tone");
    expect(summary.taskType).toBe("writing");
    expect(summary.modelId).toBe("nemotron-super");
  });
});
