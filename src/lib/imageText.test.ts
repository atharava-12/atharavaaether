import { describe, expect, it } from "vitest";
import { parseImageTextRequest } from "./imageText";

describe("parseImageTextRequest", () => {
  it("extracts the requested word from the reported prompt phrasing", () => {
    expect(parseImageTextRequest("make a image in which there should be written earth and the theme should be environment"))
      .toEqual({
        text: "earth",
        backgroundPrompt: "make a image in which without any visible text and the theme should be environment",
      });
  });

  it("extracts explicitly quoted text", () => {
    expect(parseImageTextRequest('A poster with text saying "SAVE THE PLANET" and a green Earth'))
      .toEqual({
        text: "SAVE THE PLANET",
        backgroundPrompt: "A poster with without any visible text and a green Earth",
      });
  });

  it("does not include the requested placement in the displayed text", () => {
    expect(parseImageTextRequest("create a image in which theme should be environment and there should be written earth in the middle"))
      .toEqual({
        text: "earth",
        backgroundPrompt: "create a image in which theme should be environment and without any visible text",
      });
  });

  it("does not guess a word when no text is requested", () => {
    expect(parseImageTextRequest("An Earth illustration about the environment")).toBeNull();
  });
});