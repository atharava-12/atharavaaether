import { describe, expect, it } from "vitest";
import { buildLaunchPipelineSnapshot } from "./launchPipeline";

describe("launch pipeline readiness", () => {
  it("creates a launch-plan snapshot with milestones and safety gates", () => {
    const snapshot = buildLaunchPipelineSnapshot();

    expect(snapshot.headline).toContain("launch");
    expect(snapshot.milestones.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.gates.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.readiness).toBeGreaterThan(70);
    expect(snapshot.actions.length).toBeGreaterThanOrEqual(2);
  });

  it("marks the pipeline as risky when readiness drops below the safe band", () => {
    const snapshot = buildLaunchPipelineSnapshot({ readiness: 61 });
    expect(snapshot.status).toMatch(/watching|at-risk/i);
  });
});
