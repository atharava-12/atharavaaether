import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AetherMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "image";
  mode: "chat" | "image" | "video";
  imageUrl?: string;
  isStreaming?: boolean;
  meta?: string;
  timestamp: number;
}

export function useAether() {
  const [messages, setMessages] = useState<AetherMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState<number | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (input: string, mode: "chat" | "image" | "video") => {
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
      // Image generation
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

        setLatency(Date.now() - startTime);

        if (error) throw error;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, imageUrl: data.imageUrl, isStreaming: false }
              : m
          )
        );
      } catch (e) {
        console.error("Image generation error:", e);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, type: "text" as const, content: "Image generation failed. Please try again.", isStreaming: false }
              : m
          )
        );
      }
    } else {
      // Chat Q&A with streaming
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
          meta: "MODEL: gemini-3-flash-preview",
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

        const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aether-chat`;

        abortRef.current = new AbortController();

        const resp = await fetch(CHAT_URL, {
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
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Stream failed");
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
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  )
                );
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Final flush
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
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  )
                );
              }
            } catch { /* ignore */ }
          }
        }

        setLatency(Date.now() - startTime);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
      } catch (e: unknown) {
        console.error("Chat error:", e);
        if (e instanceof Error && e.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "An error occurred. Please try again.", isStreaming: false }
              : m
          )
        );
      }
    }

    setIsLoading(false);
  }, [messages]);

  return { messages, isLoading, latency, sendMessage };
}
