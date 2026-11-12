import { describe, expect, it } from "vitest";
import { buildActivityStream } from "./activityStream";

describe("activity stream summary", () => {
  it("builds a product activity timeline with key signals and actions", () => {
    const stream = buildActivityStream();

    expect(stream.headline).toContain("activity");
    expect(stream.events.length).toBeGreaterThanOrEqual(4);
    expect(stream.signals.length).toBeGreaterThanOrEqual(3);
    expect(stream.actions.length).toBeGreaterThanOrEqual(2);
  });

  it("marks system risk when the issue load is elevated", () => {
    const stream = buildActivityStream({ issueLoad: 83 });
    expect(stream.status).toMatch(/watching|at-risk/i);
  });
});
