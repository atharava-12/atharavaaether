import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AetherMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "image";
  mode: "chat" | "image";
  imageUrl?: string;
  isStreaming?: boolean;
  meta?: string;
  timestamp: number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export function useAether() {
  const [messages, setMessages] = useState<AetherMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState<number | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (input: string, mode: "chat" | "image") => {
    const userMsg: AetherMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      type: "text",
      mode,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    const startTime = Date.now();

    if (mode === "image") {
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: input,
          type: "image",
          mode: "image",
          isStreaming: true,
          meta: "MODEL: gemini-2.5-flash-image",
          timestamp: Date.now(),
        },
      ]);

      try {
        const { data, error } = await supabase.functions.invoke("aether-image", {
          body: { prompt: input },
        });

        if (error) {
          throw new Error(error.message || "Image generation failed. Please try again.");
        }

        setLatency(Date.now() - startTime);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, imageUrl: data.imageUrl, isStreaming: false }
              : m
          )
        );
      } catch (error) {
        const message = getErrorMessage(error, "Image generation failed. Please try again.");
        console.error("Image generation error:", error);
        toast.error(message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, type: "text" as const, content: message, isStreaming: false }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }

      return;
    }

    const assistantId = crypto.randomUUID();
    let fullContent = "";

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        type: "text",
        mode: "chat",
        isStreaming: true,
        meta: "MODEL: minimax-m2.7",
        timestamp: Date.now(),
      },
    ]);

    try {
      const conversationHistory = messages
        .filter((m) => m.mode === "chat")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const chatUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aether-chat`;
      abortRef.current = new AbortController();

      const resp = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...conversationHistory, { role: "user", content: input }],
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => null);
        const message =
          errData?.error ||
          (resp.status === 402
            ? "AI credits are exhausted. Add funds in Settings → Workspace → Usage."
            : resp.status === 429
              ? "Too many requests right now. Please try again in a moment."
              : "Chat request failed. Please try again.");
        throw new Error(message);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
              );
            }
          } catch {
            // Ignore partial leftovers after stream completion.
          }
        }
      }

      if (!fullContent.trim()) {
        throw new Error("ChitChat did not return a response. Please try again.");
      }

      setLatency(Date.now() - startTime);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
      );
    } catch (error: unknown) {
      console.error("Chat error:", error);

      if (error instanceof Error && error.name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }

      const message = getErrorMessage(error, "An error occurred. Please try again.");
      toast.error(message);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: message, isStreaming: false }
            : m
        )
      );
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLatency(undefined);
  }, []);

  return { messages, setMessages, isLoading, latency, sendMessage, clearMessages };
}
