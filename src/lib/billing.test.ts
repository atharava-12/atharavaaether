import { describe, expect, it } from "vitest";
import { buildUsageSnapshot } from "./billing";

describe("usage and billing summary", () => {
  it("creates a premium plan snapshot and feature summary", () => {
    const snapshot = buildUsageSnapshot({ used: 18, limit: 30, plan: "Pro" });

    expect(snapshot.plan).toBe("Pro");
    expect(snapshot.usedPercent).toBeGreaterThan(0);
    expect(snapshot.summary).toContain("usage");
    expect(snapshot.features.length).toBeGreaterThanOrEqual(3);
  });

  it("flags overage for usage beyond the active quota", () => {
    const snapshot = buildUsageSnapshot({ used: 42, limit: 30, plan: "Pro" });
    expect(snapshot.status).toMatch(/warning|over|limit/i);
  });
});
