import { describe, expect, it } from "vitest";
import { buildChatModelContent, parseChatAttachments, serializeChatAttachments, type ChatAttachment } from "./chatAttachments";

describe("chat attachments", () => {
  it("sends actual image data and extracted document text to the model", () => {
    const attachments: ChatAttachment[] = [
      { id: "photo", name: "photo.jpg", mimeType: "image/jpeg", size: 120, dataUrl: "data:image/jpeg;base64,abc" },
      { id: "notes", name: "notes.txt", mimeType: "text/plain", size: 30, extractedText: "The meeting starts at noon." },
    ];

    expect(buildChatModelContent("Summarize this", attachments)).toEqual([
      { type: "text", text: "Summarize this\n\nAttached document: notes.txt\nThe meeting starts at noon." },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,abc" } },
    ]);
  });

  it("omits transient image data when serializing attachment metadata", () => {
    const attachments: ChatAttachment[] = [
      { id: "photo", name: "photo.jpg", mimeType: "image/jpeg", size: 120, dataUrl: "data:image/jpeg;base64,abc", storagePath: "user/session/photo.jpg" },
    ];
    expect(serializeChatAttachments(attachments)).toEqual([
      { id: "photo", name: "photo.jpg", mimeType: "image/jpeg", size: 120, storagePath: "user/session/photo.jpg" },
    ]);
  });

  it("ignores malformed persisted attachment values", () => {
    expect(parseChatAttachments(null)).toEqual([]);
    expect(parseChatAttachments([{ name: "missing-id" }])).toEqual([]);
  });
});