import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseChatStreamLine } from "@/lib/chatStream";
import { addImageTextOverlay, parseImageTextRequest } from "@/lib/imageText";
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

export interface OnboardingPreferences {
  displayName: string | null;
  interests: string[];
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

  const sendMessage = useCallback(async (
    input: string,
    mode: "chat" | "image",
    modelId?: string,
    modelLabel?: string,
    personalization?: OnboardingPreferences,
    historyOverride?: AetherMessage[],
    userMessageId?: string,
    provider?: "nvidia" | "hf" | "openai" | "anthropic" | "google" | "custom",
    fallbackProvider?: "nvidia" | "hf" | "openai" | "anthropic" | "google" | "custom",
  ) => {
    const userMsg: AetherMessage = {
      id: userMessageId ?? crypto.randomUUID(),
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
          meta: "MODEL: NVIDIA Flux 2 Klein",
          timestamp: Date.now(),
        },
      ]);

      try {
        const safePrompt = input.trim();
        if (!safePrompt) {
          throw new Error("Please enter a description of the image you want to create.");
        }
        const textRequest = parseImageTextRequest(safePrompt);

        const { data, error } = await supabase.functions.invoke("aether-image", {
          body: {
            prompt: textRequest?.backgroundPrompt ?? safePrompt,
            provider: "nvidia",
            model: "black-forest-labs/flux.2-klein-4b",
          },
        });

        if (error) {
          throw new Error("Image generation is temporarily unavailable. Please try again.");
        }

        if (!data?.imageUrl) {
          throw new Error("Image generation failed. Please try again.");
        }

        const imageUrl = textRequest
          ? await addImageTextOverlay(data.imageUrl, textRequest.text)
          : data.imageUrl;

        setLatency(Date.now() - startTime);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, imageUrl, isStreaming: false }
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
        meta: `MODEL: ${modelLabel ?? modelId ?? "nemotron-super"}`,
        timestamp: Date.now(),
      },
    ]);

    try {
      const conversationHistory = (historyOverride ?? messages)
        .filter((m) => m.mode === "chat")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const aiApiBase = import.meta.env.VITE_AI_API_BASE_URL?.trim().replace(/\/+$/, "");
      let accessToken: string | undefined;
      if (aiApiBase) {
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token;
      }
      const useFastApi = Boolean(aiApiBase && accessToken);
      const chatUrl = useFastApi
        ? `${aiApiBase}/v1/chat/completions`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aether-chat`;
      abortRef.current = new AbortController();

      const resp = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
Authorization: `Bearer ${useFastApi ? accessToken : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...conversationHistory, { role: "user", content: input }],
          modelId: modelId ?? "nemotron-super",
          provider: provider ?? "nvidia",
          fallbackProvider: fallbackProvider ?? "nvidia",
          personalization,
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => null);
        const message =
          errData?.error ||
          errData?.detail ||
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
      let streamError: string | undefined;

      const processStreamLine = (line: string) => {
        const event = parseChatStreamLine(line);
        streamError = event.error ?? streamError;
        if (event.content) {
          fullContent += event.content;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
          );
        }
        return event.done;
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.startsWith(":")) continue;
          streamDone = processStreamLine(line);
          if (streamDone) break;
        }
      }

      textBuffer += decoder.decode();

      if (textBuffer.trim()) {
        for (const line of textBuffer.split("\n")) processStreamLine(line);
      }

      if (!fullContent.trim()) {
        throw new Error(streamError ?? "ChitChat did not return a response. Please try again.");
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
