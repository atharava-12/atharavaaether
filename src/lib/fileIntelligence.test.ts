import { describe, expect, it } from "vitest";
import { analyzeDocumentFile, getSupportedDocumentTypes } from "./fileIntelligence";

describe("document intelligence", () => {
  it("supports text and csv uploads without a server-side parser", async () => {
    const file = new File(["Name,Score\nAlice,99\nBob,77\n"], "scores.csv", { type: "text/csv" });
    const result = await analyzeDocumentFile(file);
    expect(result.supported).toBe(true);
    expect(result.preview).toContain("Name");
    expect(result.requiresServerSide).toBe(false);
  });

  it("reports unreadable PDF content without claiming extraction succeeded", async () => {
    const file = new File(["%PDF-1.4 binary"], "report.pdf", { type: "application/pdf" });
    const result = await analyzeDocumentFile(file);
    expect(result.supported).toBe(false);
    expect(result.requiresServerSide).toBe(false);
    expect(result.message).toContain("OCR");
  });

  it("lists the supported upload types", () => {
    expect(getSupportedDocumentTypes()).toContain("text/plain");
    expect(getSupportedDocumentTypes()).toContain("text/csv");
    expect(getSupportedDocumentTypes()).toContain("application/pdf");
    expect(getSupportedDocumentTypes()).toContain("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });
});
