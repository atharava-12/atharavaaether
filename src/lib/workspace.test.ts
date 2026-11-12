import { describe, expect, it } from "vitest";
import { buildCodeSuggestion, getVoiceSupportStatus, summarizeCode } from "./workspace";

describe("workspace helper", () => {
  it("creates a starter snippet for a coding task", () => {
    const snippet = buildCodeSuggestion("typescript", "Create a debounced fetch helper");
    expect(snippet).toContain("debounce");
    expect(snippet).toContain("fetch");
  });

  it("detects voice API support in browser runtime", () => {
    expect(getVoiceSupportStatus()).toBe("unsupported");
  });

  it("creates a readable summary for code", () => {
    const summary = summarizeCode("const value = 42;", "typescript");
    expect(summary).toContain("TypeScript");
    expect(summary).toContain("value");
  });
});
