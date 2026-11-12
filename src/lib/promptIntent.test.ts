import { describe, expect, it } from "vitest";
import { isImagePrompt } from "./promptIntent";

describe("image prompt intent", () => {
  it("detects direct image requests", () => {
    expect(isImagePrompt("Create an image of a sunset over Mumbai")).toBe(true);
    expect(isImagePrompt("Draw a cyberpunk cat")).toBe(true);
    expect(isImagePrompt("I want an image of a quiet forest")).toBe(true);
  });

  it("keeps normal questions in chat", () => {
    expect(isImagePrompt("What is an image histogram?")).toBe(false);
    expect(isImagePrompt("Explain how photosynthesis works")).toBe(false);
  });
});