import { describe, expect, it } from "vitest";
import { buildPlatformOpsSnapshot } from "./platformOps";

describe("platform operations overview", () => {
  it("creates a premium operations snapshot with clear readiness and workflow details", () => {
    const snapshot = buildPlatformOpsSnapshot();

    expect(snapshot.headline).toContain("stability");
    expect(snapshot.readiness).toBeGreaterThan(70);
    expect(snapshot.metrics.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.workflow.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.actions.length).toBeGreaterThanOrEqual(3);
  });

  it("flags risk when readiness dips below the healthy operating band", () => {
    const snapshot = buildPlatformOpsSnapshot({ readiness: 64 });
    expect(snapshot.health).toMatch(/watching|at-risk/i);
  });
});
