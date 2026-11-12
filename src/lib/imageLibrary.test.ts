import { describe, expect, it } from "vitest";
import { getImageStoragePath, toImageStorageReference } from "./imageLibrary";

describe("image library references", () => {
  it("round-trips private object paths through chat storage references", () => {
    const path = "user-id/session-id/image-id.jpg";
    expect(getImageStoragePath(toImageStorageReference(path))).toBe(path);
  });

  it("leaves non-library image URLs unchanged", () => {
    expect(getImageStoragePath("data:image/png;base64,abc")).toBeNull();
    expect(getImageStoragePath("https://images.example.test/image.jpg")).toBeNull();
    expect(getImageStoragePath(undefined)).toBeNull();
  });
});