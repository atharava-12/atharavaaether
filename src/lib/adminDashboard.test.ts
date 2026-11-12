import { describe, expect, it } from "vitest";
import { buildAdminDashboardSnapshot } from "./adminDashboard";

describe("admin dashboard summary", () => {
  it("builds a team operations snapshot for release and product monitoring", () => {
    const snapshot = buildAdminDashboardSnapshot();

    expect(snapshot.headline).toContain("operations");
    expect(snapshot.metrics.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.alerts.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.actions.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.teamHealth).toBeGreaterThan(70);
  });

  it("flags a risky team health score below the safe operating threshold", () => {
    const snapshot = buildAdminDashboardSnapshot({ teamHealth: 62 });
    expect(snapshot.status).toMatch(/watching|at-risk/i);
  });
});
