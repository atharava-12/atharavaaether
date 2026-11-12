import { describe, expect, it } from "vitest";
import { buildHealthMetrics } from "./healthMetrics";

describe("health metrics assistant", () => {
  it("creates a product health snapshot for the app", () => {
    const metrics = buildHealthMetrics();

    expect(metrics.summary).toContain("health");
    expect(metrics.cards.length).toBeGreaterThanOrEqual(3);
    expect(metrics.cards[0].label).toMatch(/uptime|quality|stability|usage/i);
    expect(metrics.riskLevel).toMatch(/low|medium|high/i);
  });

  it("reports provider readiness based on the active stack", () => {
    const metrics = buildHealthMetrics();
    expect(metrics.providerStatus).toMatch(/nvidia|hugging face|hf|server/i);
  });
});
