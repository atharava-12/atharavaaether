import { describe, expect, it } from "vitest";
import { parseChatStreamLine } from "./chatStream";

describe("parseChatStreamLine", () => {
  it("reads streamed content with and without a space after data:", () => {
    expect(parseChatStreamLine('data: {"choices":[{"delta":{"content":"Hello"}}]}').content)
      .toBe("Hello");
    expect(parseChatStreamLine('data:{"choices":[{"delta":{"content":" there"}}]}').content)
      .toBe(" there");
  });

  it("ignores malformed events without marking the stream done", () => {
    expect(parseChatStreamLine("data: not-json")).toEqual({ done: false, content: "" });
  });

  it("recognizes the stream terminator", () => {
    expect(parseChatStreamLine("data: [DONE]")).toEqual({ done: true, content: "" });
  });

  it("returns provider errors and text-array content", () => {
    expect(parseChatStreamLine('data: {"error":{"message":"Try again"}}').error).toBe("Try again");
    expect(parseChatStreamLine('data: {"choices":[{"message":{"content":[{"type":"text","text":"Hi"}]}}]}').content)
      .toBe("Hi");
  });
});