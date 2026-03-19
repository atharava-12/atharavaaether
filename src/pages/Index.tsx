import { useRef, useEffect, useCallback, useState } from "react";
import { Zap, Menu, X, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBar from "@/components/StatusBar";
import InputBar from "@/components/InputBar";
import ResultModule from "@/components/ResultModule";
import UserMessage from "@/components/UserMessage";
import ChatSidebar from "@/components/ChatSidebar";
import SuggestedPrompts from "@/components/SuggestedPrompts";
import { useAether } from "@/hooks/useAether";
import { useAuth } from "@/hooks/useAuth";
import { useChatStorage } from "@/hooks/useChatStorage";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const Index = () => {
  const { user } = useAuth();
  const { messages, setMessages, isLoading, latency, sendMessage, clearMessages } = useAether();
  const storage = useChatStorage(user?.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOnline = useOnlineStatus();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Load messages when active conversation changes
  useEffect(() => {
    if (storage.activeConversationId) {
      storage.loadMessages(storage.activeConversationId).then(setMessages);
    } else {
      clearMessages();
    }
  }, [storage.activeConversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = useCallback(async (input: string, mode: "chat" | "image") => {
    let convId = storage.activeConversationId;
    if (!convId) {
      convId = await storage.createConversation(input.slice(0, 60));
      if (!convId) return;
    }

    // Save user message
    const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: input, type: "text" as const, mode, timestamp: Date.now() };
    await storage.saveMessage(convId, userMsg);

    // Send and get response
    await sendMessage(input, mode);

    // Save assistant message (last message in the list)
    setTimeout(async () => {
      // The assistant message will be the last one
      const currentMessages = document.querySelectorAll('[data-msg-id]');
      // We save after streaming completes via the useAether hook
    }, 100);
  }, [storage, sendMessage]);

  // Save assistant messages after they finish streaming
  useEffect(() => {
    if (!storage.activeConversationId) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && !lastMsg.isStreaming) {
      storage.saveMessage(storage.activeConversationId, lastMsg);
    }
  }, [messages.length, messages[messages.length - 1]?.isStreaming]);

  const handleNewChat = useCallback(() => {
    storage.setActiveConversationId(null);
    clearMessages();
  }, [storage, clearMessages]);

  const handleSelectConversation = useCallback((id: string) => {
    storage.setActiveConversationId(id);
  }, [storage]);

  const handleClearChat = useCallback(() => {
    if (!window.confirm("Clear all messages?")) return;
    if (storage.activeConversationId) {
      storage.deleteConversation(storage.activeConversationId);
    }
    clearMessages();
  }, [clearMessages, storage]);

  const handleSuggestedPrompt = useCallback((prompt: string) => {
    setInputValue(prompt);
  }, []);

  const playTTS = useCallback(async (text: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );
      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
    } catch (e) {
      console.error("TTS error:", e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background relative flex">
      <div className="noise-overlay" />

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-72 h-full relative z-10">
            <ChatSidebar
              conversations={storage.conversations}
              activeId={storage.activeConversationId}
              onSelect={handleSelectConversation}
              onNew={handleNewChat}
              onDelete={(id) => storage.deleteConversation(id)}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <StatusBar
          isConnected={isOnline}
          latency={latency}
          onClearChat={handleClearChat}
          hasMessages={messages.length > 0}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div
          ref={scrollRef}
          className="flex-1 pt-16 pb-40 px-[5vw] md:px-[10vw] max-w-4xl mx-auto w-full overflow-y-auto"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
                <Zap size={20} className="text-primary" />
              </div>
              <h1 className="text-lg font-medium tracking-[-0.03em] text-foreground">
                What can I help you with?
              </h1>
              <p className="text-sm text-muted-foreground text-center max-w-md font-mono">
                Multilingual Q&A · Image synthesis · Voice
              </p>
              <SuggestedPrompts onSelect={handleSuggestedPrompt} />
            </div>
          )}

          <div className="flex flex-col gap-4">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserMessage key={msg.id} content={msg.content} mode={msg.mode} />
              ) : (
                <div key={msg.id} className="relative group">
                  <ResultModule
                    type={msg.type}
                    label={msg.mode === "image" ? "IMAGE SYNTHESIS" : "RESPONSE"}
                    meta={msg.meta}
                    content={msg.content}
                    imageUrl={msg.imageUrl}
                    isStreaming={msg.isStreaming}
                  />
                  {!msg.isStreaming && msg.type === "text" && msg.content && (
                    <div className="flex gap-1 mt-1 ml-1">
                      <button
                        onClick={() => playTTS(msg.content)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-secondary"
                        title="Listen"
                      >
                        <Volume2 size={10} />
                        Listen
                      </button>
                      <button
                        onClick={() => {
                          // Regenerate: resend the last user message
                          const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
                          if (lastUserMsg) handleSend(lastUserMsg.content, lastUserMsg.mode);
                        }}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-secondary"
                      >
                        Regenerate
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        <InputBar
          onSubmit={handleSend}
          isLoading={isLoading}
          isOffline={!isOnline}
          externalValue={inputValue}
          onExternalValueConsumed={() => setInputValue("")}
        />
      </div>
    </div>
  );
};

export default Index;
