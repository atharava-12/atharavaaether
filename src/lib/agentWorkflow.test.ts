import { describe, expect, it } from "vitest";
import { buildAgentWorkflowPlan } from "./agentWorkflow";

describe("agent workflow planner", () => {
  it("creates a structured plan for product iteration tasks", () => {
    const plan = buildAgentWorkflowPlan("Debug the chat streaming bug and verify the app still builds");

    expect(plan.summary).toContain("chat");
    expect(plan.steps.length).toBeGreaterThanOrEqual(3);
    expect(plan.steps[0].title).toMatch(/inspect|diagnose|analyze/i);
    expect(plan.riskLevel).toMatch(/medium|high/i);
  });

  it("marks research-heavy tasks as deeper workflows", () => {
    const plan = buildAgentWorkflowPlan("Research the latest AI model benchmarks and compare sources");
    expect(plan.recommendedMode).toBe("deep-research");
    expect(plan.steps.some((step) => step.title.toLowerCase().includes("source"))).toBe(true);
  });
});
