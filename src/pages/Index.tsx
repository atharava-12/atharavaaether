import { useRef, useEffect, useCallback, useState } from "react";
import { Zap, Volume2, Plus, Settings as SettingsIcon, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import InputBar from "@/components/InputBar";
import ResultModule from "@/components/ResultModule";
import UserMessage from "@/components/UserMessage";
import SuggestedPrompts from "@/components/SuggestedPrompts";
import BottomNav from "@/components/BottomNav";
import ModelSelector from "@/components/ModelSelector";
import { useAether } from "@/hooks/useAether";
import { useAuth } from "@/hooks/useAuth";
import { useChatStorage } from "@/hooks/useChatStorage";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useGuestMode } from "@/hooks/useGuestMode";
import { DEFAULT_MODEL_ID, getModel, type ModelId } from "@/lib/models";

const MODEL_STORAGE_KEY = "chitchat:selectedModel";

const Index = () => {
  const { user } = useAuth();
  const { isGuest } = useGuestMode();
  const { messages, setMessages, isLoading, sendMessage, clearMessages } = useAether();
  const storage = useChatStorage(user?.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOnline = useOnlineStatus();
  const [inputValue, setInputValue] = useState("");
  const [modelId, setModelId] = useState<ModelId>(() => {
    if (typeof window === "undefined") return DEFAULT_MODEL_ID;
    const saved = window.localStorage.getItem(MODEL_STORAGE_KEY) as ModelId | null;
    return saved ?? DEFAULT_MODEL_ID;
  });

  useEffect(() => {
    window.localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  }, [modelId]);

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
    const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: input, type: "text" as const, mode, timestamp: Date.now() };
    await storage.saveMessage(convId, userMsg);
    const m = getModel(modelId);
    await sendMessage(input, mode, m.id, m.label);
  }, [storage, sendMessage, modelId]);

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

  const handleSuggestedPrompt = useCallback((prompt: string) => setInputValue(prompt), []);

  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const playTTS = useCallback(async (text: string) => {
    if (ttsPlaying) { ttsAudioRef.current?.pause(); setTtsPlaying(false); return; }
    setTtsPlaying(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, voiceId: "EXAVITQu4vr4xnSDxMaL" }),
      });
      if (!response.ok) throw new Error(`TTS failed: ${response.status}`);
      const audioBlob = await response.blob();
      const audio = new Audio(URL.createObjectURL(audioBlob));
      ttsAudioRef.current = audio;
      audio.onended = () => setTtsPlaying(false);
      await audio.play();
    } catch (e) { console.error("TTS error:", e); setTtsPlaying(false); }
  }, [ttsPlaying]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="noise-overlay" />

      <header className="h-14 border-b border-border flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-30">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          <h1 className="text-sm font-semibold tracking-[-0.02em]">ChitChat</h1>
          {isGuest && <span className="text-[9px] font-mono uppercase text-muted-foreground border border-border rounded px-1.5 py-0.5 ml-1">Guest</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleNewChat} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
            <Plus size={12} /> New
          </button>
          <Link to="/settings" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
            <SettingsIcon size={14} />
          </Link>
        </div>
      </header>

      {isGuest && (
        <div className="px-4 py-2 bg-card border-b border-border text-[11px] text-muted-foreground font-mono flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5"><UserCircle2 size={12} /> Guest mode — chats save on this device only.</span>
          <Link to="/auth" className="text-primary hover:underline">Sign in</Link>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 pb-32 px-4 max-w-3xl mx-auto w-full overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
              <Zap size={20} className="text-primary" />
            </div>
            <h1 className="text-lg font-medium tracking-[-0.03em] text-foreground">What can I help you with?</h1>
            <p className="text-sm text-muted-foreground text-center max-w-md font-mono">
              Multilingual Q&A · Smart conversations
            </p>
            <SuggestedPrompts onSelect={handleSuggestedPrompt} />
          </div>
        )}

        <div className="flex flex-col gap-4 pt-4">
          {messages.map((msg) =>
            msg.role === "user" ? (
              <UserMessage key={msg.id} content={msg.content} mode={msg.mode} />
            ) : (
              <div key={msg.id} className="relative group">
                <ResultModule type={msg.type} label="RESPONSE" meta={msg.meta} content={msg.content} imageUrl={msg.imageUrl} isStreaming={msg.isStreaming} />
                {!msg.isStreaming && msg.type === "text" && msg.content && (
                  <div className="flex gap-1 mt-1 ml-1">
                    <button onClick={() => playTTS(msg.content)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary px-2 py-1 rounded hover:bg-secondary">
                      <Volume2 size={10} /> Listen
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30">
        <InputBar
          onSubmit={(input) => handleSend(input, "chat")}
          isLoading={isLoading}
          isOffline={!isOnline}
          externalValue={inputValue}
          onExternalValueConsumed={() => setInputValue("")}
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
