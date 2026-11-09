import { useRef, useEffect, useCallback, useState } from "react";
import {
  Zap,
  Volume2,
  Plus,
  Settings as SettingsIcon,
  Share2,
  MessageSquareText,
  Sparkles,
  Search,
  Wand2,
  PanelLeft,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import InputBar from "@/components/InputBar";
import ResultModule from "@/components/ResultModule";
import UserMessage from "@/components/UserMessage";
import SuggestedPrompts from "@/components/SuggestedPrompts";
import BottomNav from "@/components/BottomNav";
import ModelSelector from "@/components/ModelSelector";
import FeatureTour from "@/components/FeatureTour";
import ResearchPanel from "@/components/ResearchPanel";
import SeoHead from "@/components/SeoHead";
import { useAether } from "@/hooks/useAether";
import { useAuth } from "@/hooks/useAuth";
import { useChatStorage } from "@/hooks/useChatStorage";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_MODEL_ID, getModel, type ModelId } from "@/lib/models";
import { routeModelForPrompt } from "@/lib/aiGateway";
import { isImagePrompt } from "@/lib/promptIntent";

const MODEL_STORAGE_KEY = "chitchat:selectedModel";

interface OnboardingPreferences {
  displayName: string | null;
  interests: string[];
}

const Index = () => {
  const { user } = useAuth();
  const { messages, setMessages, isLoading, sendMessage, clearMessages } = useAether();
  const storage = useChatStorage(user?.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOnline = useOnlineStatus();
  const [inputValue, setInputValue] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [onboardingPreferences, setOnboardingPreferences] = useState<OnboardingPreferences | null>(null);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setOnboardingPreferences(null);
      return;
    }

    supabase
      .from("profiles")
      .select("display_name, interests")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Unable to load onboarding preferences:", error);
          setOnboardingPreferences(null);
          return;
        }
        setOnboardingPreferences({
          displayName: data?.display_name ?? null,
          interests: data?.interests ?? [],
        });
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

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
    const resolvedMode = mode === "image" || isImagePrompt(input) ? "image" : "chat";
    let convId = storage.activeConversationId;
    if (!convId) {
      convId = await storage.createConversation(input.slice(0, 60));
      if (!convId) {
        toast.error("Chat history is unavailable right now. Your message will still be sent.");
      }
    }
    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: input,
      type: "text" as const,
      mode: resolvedMode,
      timestamp: Date.now(),
    };
    if (convId) await storage.saveMessage(convId, userMsg);
    const route = routeModelForPrompt(input, modelId);
    const selectedModel = getModel(route.modelId);
    await sendMessage(
      input,
      resolvedMode,
      selectedModel.id,
      selectedModel.label,
      onboardingPreferences ?? undefined,
      undefined,
      userMsg.id,
      route.provider,
      route.fallbackProvider,
    );
  }, [storage, sendMessage, modelId, onboardingPreferences]);

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

  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    const messageIndex = messages.findIndex((message) => message.id === messageId);
    if (messageIndex < 0) return;
    const originalMessage = messages[messageIndex];
    if (originalMessage.role !== "user") return;

    try {
      const editedMessage = { ...originalMessage, content };
      const { historyBeforeMessage, messageId: persistedMessageId } = await storage.editMessage(
        storage.activeConversationId ?? "",
        editedMessage,
        messageIndex,
      );
      setMessages(historyBeforeMessage);
      const selectedModel = getModel(modelId);
      const route = routeModelForPrompt(content, selectedModel.id);
      await sendMessage(
        content,
        originalMessage.mode,
        selectedModel.id,
        selectedModel.label,
        onboardingPreferences ?? undefined,
        historyBeforeMessage,
        persistedMessageId,
        route.provider,
        route.fallbackProvider,
      );
    } catch (error) {
      console.error("Unable to edit chat message:", error);
      toast.error(error instanceof Error ? error.message : "Could not edit this message.");
    }
  }, [messages, storage, setMessages, sendMessage, modelId, onboardingPreferences]);

  const handleSuggestedPrompt = useCallback((prompt: string) => setInputValue(prompt), []);

  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const playTTS = useCallback(async (text: string) => {
    if (ttsPlaying) {
      ttsAudioRef.current?.pause();
      setTtsPlaying(false);
      return;
    }
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
    } catch (e) {
      console.error("TTS error:", e);
      setTtsPlaying(false);
    }
  }, [ttsPlaying]);

  const sidebarItems = [
    { icon: Search, label: "Research", action: "research" },
    { icon: Wand2, label: "Image Studio", to: "/image" },
    { icon: SettingsIcon, label: "Settings", to: "/settings" },
  ];

  const selectConversation = async (id: string) => {
    storage.setActiveConversationId(id);
    setMessages(await storage.loadMessages(id));
    setMobileSidebarOpen(false);
  };

  const handleSidebarAction = (action: "research") => {
    if (action === "research") setResearchOpen(true);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100">
      <SeoHead
        title="ChitChat AI – Free AI Chat & Image Generator"
        description="Chat with AI and generate images instantly. Multilingual, fast, and free — built for natural conversations and creative work."
        path="/"
      />
      <div className="noise-overlay" />

      <div className="mx-auto flex max-w-[1800px]">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-[#0a1220]/80 md:flex md:flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/30">
                <Zap size={17} className="text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-slate-100">CHITCHAT</div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">GEN</div>
              </div>
            </div>
            <button
              aria-label="Collapse sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <PanelLeft size={15} />
            </button>
          </div>

          <div className="px-3 py-4">
            <button
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2.5 text-sm font-medium text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-500/15"
            >
              <Plus size={15} />
              New Chat
            </button>
          </div>

          <nav className="space-y-1 px-3 pb-4">
            {sidebarItems.map(({ icon: Icon, label, to, action }) => {
              const className = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white";
              const content = <><Icon size={16} className="text-slate-400" /><span>{label}</span></>;
              return to ? (
                <Link key={label} to={to} className={className}>{content}</Link>
              ) : (
                <button key={label} onClick={() => handleSidebarAction(action)} className={className}>{content}</button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/10 px-2 py-3">
            <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Recent chats</div>
            {storage.conversations.length === 0 && (
              <p className="px-2 py-3 text-xs text-slate-500">Your conversations will appear here.</p>
            )}
            {storage.conversations.slice(0, 20).map((conversation) => (
              <div key={conversation.id} className={`group flex items-center gap-1 rounded-lg ${storage.activeConversationId === conversation.id ? "bg-white/5" : "hover:bg-white/5"}`}>
                <button
                  onClick={() => void selectConversation(conversation.id)}
                  className="min-w-0 flex-1 truncate px-2 py-2 text-left text-xs text-slate-300"
                >
                  {conversation.title}
                </button>
                <button
                  onClick={() => void storage.deleteConversation(conversation.id)}
                  aria-label={`Delete ${conversation.title}`}
                  className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

        </aside>

        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/80 md:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[#0a1220]/95 backdrop-blur-xl transition-transform duration-200 md:hidden ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/30">
                <Zap size={15} className="text-cyan-400" />
              </div>
              <div className="text-sm font-semibold tracking-[0.18em] text-slate-100">CHITCHAT</div>
            </div>
            <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-300">×</button>
          </div>

          <nav className="space-y-1 p-3">
            <button
              onClick={() => { handleNewChat(); setMobileSidebarOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-cyan-200 hover:bg-white/5"
            >
              <Plus size={16} /> New Chat
            </button>
            {sidebarItems.map(({ icon: Icon, label, to, action }) => {
              const className = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white";
              const content = <><Icon size={16} className="text-slate-400" /><span>{label}</span></>;
              return to ? (
                <Link key={label} to={to} onClick={() => setMobileSidebarOpen(false)} className={className}>{content}</Link>
              ) : (
                <button key={label} onClick={() => handleSidebarAction(action)} className={className}>{content}</button>
              );
            })}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/10 px-2 py-3">
            <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Recent chats</div>
            {storage.conversations.slice(0, 20).map((conversation) => (
              <div key={conversation.id} className="flex items-center gap-1 rounded-lg hover:bg-white/5">
                <button onClick={() => void selectConversation(conversation.id)} className="min-w-0 flex-1 truncate px-2 py-2 text-left text-xs text-slate-300">
                  {conversation.title}
                </button>
                <button
                  onClick={() => void storage.deleteConversation(conversation.id)}
                  aria-label={`Delete ${conversation.title}`}
                  className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050b14]/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-5">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 md:hidden"
                aria-label="Open sidebar"
              >
                <PanelLeft size={16} />
              </button>

              <div className="hidden items-center gap-3 md:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/30">
                  <Zap size={16} className="text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">ChitChatGen</div>
                  <div className="text-sm font-medium text-slate-100">AI assistant</div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <ModelSelector modelId={modelId} onChange={setModelId} />

                <button
                  onClick={handleNewChat}
                  aria-label="Start a new chat"
                  className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200 sm:inline-flex"
                >
                  <Plus size={14} />
                  New Chat
                </button>

                <Link
                  to="/settings"
                  aria-label="Open settings"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  <SettingsIcon size={16} />
                </Link>

                <button
                  aria-label="User profile"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-semibold text-slate-950"
                >
                  AV
                </button>
              </div>
            </div>
          </header>

          <main ref={scrollRef} className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-3 pb-40 pt-6 sm:px-4 md:px-6">
            {messages.length === 0 && (
              <div className="mx-auto flex max-w-4xl flex-col gap-6 pt-2">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">
                    <Sparkles size={12} />
                    ChitChatGen AI
                  </div>
                  <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                    What can I help you with?
                  </h1>
                  <p className="mt-2 text-sm text-slate-300 sm:text-base">
                    Ask questions, create, and explore with AI.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: "Research", icon: Search, action: "research" },
                    { label: "Writing", icon: MessageSquareText, action: "writing" },
                    { label: "Image Studio", icon: Wand2, to: "/image" },
                  ].map(({ label, icon: Icon, action, to }) => {
                    const content = <>
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/20">
                          <Icon size={16} />
                        </div>
                        <ArrowUpRight size={14} className="text-slate-500 transition group-hover:text-cyan-300" />
                      </div>
                      <div className="mt-4 text-sm font-medium text-white">{label}</div>
                      <div className="mt-1 text-xs text-slate-400">Open {label.toLowerCase()}</div>
                    </>;
                    const className = "group rounded-2xl border border-white/10 bg-[#0d1726] p-4 text-left transition hover:border-cyan-400/30 hover:bg-[#101d2d]";
                    return to ? (
                      <Link key={label} to={to} className={className}>{content}</Link>
                    ) : (
                      <button
                        key={label}
                        onClick={() => {
                          if (action === "research") setResearchOpen(true);
                          if (action === "writing") setInputValue("Help me write ");
                        }}
                        className={className}
                      >
                        {content}
                      </button>
                    );
                  })}
                </div>

                {researchOpen && (
                  <div className="max-w-3xl">
                    <div className="mb-2 flex justify-end">
                      <button onClick={() => setResearchOpen(false)} aria-label="Close research mode" className="text-xs text-slate-400 hover:text-white">Close</button>
                    </div>
                    <ResearchPanel modelId={modelId} />
                  </div>
                )}

                <SuggestedPrompts onSelect={handleSuggestedPrompt} />
              </div>
            )}

            {messages.length > 0 && researchOpen && (
              <div className="mb-6 max-w-3xl">
                <div className="mb-2 flex justify-end">
                  <button onClick={() => setResearchOpen(false)} aria-label="Close research mode" className="text-xs text-slate-400 hover:text-white">Close</button>
                </div>
                <ResearchPanel modelId={modelId} />
              </div>
            )}

            <div className="flex flex-col gap-4 pt-2">
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <UserMessage
                    key={msg.id}
                    content={msg.content}
                    mode={msg.mode}
                    disabled={isLoading}
                    onSaveEdit={(content) => handleEditMessage(msg.id, content)}
                  />
                ) : (
                  <div key={msg.id}>
                    <ResultModule
                      type={msg.type}
                      label="RESPONSE"
                      meta={msg.meta}
                      content={msg.content}
                      imageUrl={msg.imageUrl}
                      isStreaming={msg.isStreaming}
                    />

                    {!msg.isStreaming && msg.content && (
                      <div className="mt-2 flex items-center gap-3">
                        {msg.type === "text" && (
                          <button
                            onClick={() => playTTS(msg.content)}
                            className="text-xs text-slate-300 transition hover:text-cyan-300"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Volume2 size={12} /> Listen
                            </span>
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const shareText = `${msg.content}\n\n— via ChitChat AI`;
                            const shareUrl = window.location.origin;
                            const payload = { title: "ChitChat AI", text: shareText, url: shareUrl };
                            const fallbackCopy = async () => {
                              try {
                                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                                toast.success("Copied to clipboard");
                              } catch {
                                toast.error("Could not copy");
                              }
                            };
                            if (navigator.share && (!navigator.canShare || navigator.canShare(payload))) {
                              try {
                                await navigator.share(payload);
                                return;
                              } catch (e) {
                                if ((e as Error)?.name === "AbortError") return;
                              }
                            }
                            await fallbackCopy();
                          }}
                          className="text-xs text-slate-300 transition hover:text-cyan-300"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Share2 size={12} /> Share
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </main>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 md:bottom-4">
        <InputBar
          onSubmit={(input) => handleSend(input, "chat")}
          isLoading={isLoading}
          isOffline={!isOnline}
          externalValue={inputValue}
          onExternalValueConsumed={() => setInputValue("")}
          onResearchClick={() => setResearchOpen((open) => !open)}
        />
      </div>

      <BottomNav />
      <FeatureTour />
    </div>
  );
};

export default Index;
