import { describe, expect, it } from "vitest";
import { buildAgentExecutionState } from "./agentExecution";

describe("agent execution tracking", () => {
  it("creates a staged execution lifecycle for a feature task", () => {
    const state = buildAgentExecutionState("Refine the chat assistant and verify the build");

    expect(state.status).toBe("queued");
    expect(state.steps.length).toBeGreaterThanOrEqual(4);
    expect(state.progress).toBeGreaterThan(0);
    expect(state.steps[0].status).toBe("active");
    expect(state.steps.some((step) => step.label.toLowerCase().includes("verify"))).toBe(true);
  });

  it("labels research tasks as deeper execution cycles", () => {
    const state = buildAgentExecutionState("Research the latest AI tools and compare sources");
    expect(state.mode).toBe("deep-research");
    expect(state.steps.some((step) => step.label.toLowerCase().includes("source"))).toBe(true);
  });
});
