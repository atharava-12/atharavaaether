interface ChatStreamEvent {
  done: boolean;
  content: string;
  error?: string;
}

const getContentText = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((part) =>
      part && typeof part === "object" && "text" in part && typeof part.text === "string"
        ? part.text
        : ""
    )
    .join("");
};

export function parseChatStreamLine(rawLine: string): ChatStreamEvent {
  const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
  if (!line.startsWith("data:")) return { done: false, content: "" };

  const data = line.slice(5).trim();
  if (data === "[DONE]") return { done: true, content: "" };

  try {
    const parsed = JSON.parse(data);
    const choice = parsed?.choices?.[0];
    const content = getContentText(
      choice?.delta?.content ?? choice?.message?.content ?? parsed?.content
    );
    const error = parsed?.error;
    const errorMessage =
      typeof error === "string"
        ? error
        : typeof error?.message === "string"
          ? error.message
          : undefined;

    return { done: false, content, error: errorMessage };
  } catch {
    return { done: false, content: "" };
  }
}