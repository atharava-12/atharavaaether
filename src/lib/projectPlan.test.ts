import { describe, expect, it } from "vitest";
import { buildProjectPlan } from "./projectPlan";

describe("project planning assistant", () => {
  it("creates milestones and a task breakdown for a feature request", () => {
    const plan = buildProjectPlan("Ship a premium AI chat dashboard with research and workspace tools");

    expect(plan.milestones.length).toBeGreaterThanOrEqual(2);
    expect(plan.tasks.length).toBeGreaterThanOrEqual(3);
    expect(plan.tasks[0].title).toMatch(/plan|build|design|research/i);
    expect(plan.riskSummary).toContain("risk");
  });

  it("adapts the plan for a bug-fix request", () => {
    const plan = buildProjectPlan("Debug the chat streaming issue and verify the app still builds");
    expect(plan.focus).toContain("fix");
    expect(plan.tasks.some((task) => task.title.toLowerCase().includes("verify"))).toBe(true);
  });
});
