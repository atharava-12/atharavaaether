import { describe, expect, it } from "vitest";
import { buildReleaseChecklist } from "./releaseChecklist";

describe("release checklist assistant", () => {
  it("creates a launch checklist for a premium product update", () => {
    const checklist = buildReleaseChecklist("Ship a premium AI chat and workspace launch");

    expect(checklist.gates.length).toBeGreaterThanOrEqual(3);
    expect(checklist.gates.some((gate) => gate.title.toLowerCase().includes("build"))).toBe(true);
    expect(checklist.riskSummary).toContain("risk");
  });

  it("prioritizes verification for bug-fix launches", () => {
    const checklist = buildReleaseChecklist("Fix the chat streaming bug and confirm production readiness");
    expect(checklist.priority).toBe("high");
    expect(checklist.gates[0].title.toLowerCase()).toMatch(/verify|review|stability/i);
  });
});
