export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
  url?: string;
  storagePath?: string;
  extractedText?: string;
  file?: File;
}

export type ChatImageContentBlock = {
  type: "image_url";
  image_url: { url: string };
};

export type ChatTextContentBlock = {
  type: "text";
  text: string;
};

export type ChatModelContent = string | Array<ChatTextContentBlock | ChatImageContentBlock>;

export const buildChatModelContent = (prompt: string, attachments: ChatAttachment[] = []): ChatModelContent => {
  const documentText = attachments
    .filter((attachment) => attachment.extractedText?.trim())
    .map((attachment) => `Attached document: ${attachment.name}\n${attachment.extractedText!.slice(0, 30000)}`);
  const text = [prompt.trim(), ...documentText].filter(Boolean).join("\n\n");
  const images = attachments
    .filter((attachment) => attachment.mimeType.startsWith("image/"))
    .map((attachment) => attachment.dataUrl ?? attachment.url)
    .filter((url): url is string => Boolean(url && /^(data:image\/(?:png|jpeg|webp);base64,|https:\/\/)/i.test(url)))
    .map((url): ChatImageContentBlock => ({ type: "image_url", image_url: { url } }));

  if (images.length === 0) return text;
  return [{ type: "text", text: text || "Please describe the attached image." }, ...images];
};

export const serializeChatAttachments = (attachments: ChatAttachment[] = []) =>
  attachments.map(({ dataUrl: _dataUrl, file: _file, ...attachment }) => attachment);

export const parseChatAttachments = (value: unknown): ChatAttachment[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ChatAttachment =>
    Boolean(
      item &&
      typeof item === "object" &&
      typeof (item as ChatAttachment).id === "string" &&
      typeof (item as ChatAttachment).name === "string" &&
      typeof (item as ChatAttachment).mimeType === "string",
    )
  );
};