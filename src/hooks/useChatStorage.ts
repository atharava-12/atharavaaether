import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AetherMessage } from "@/hooks/useAether";

interface Conv { id: string; title: string; updated_at: string }

const GUEST_MESSAGES_KEY = "chitchat_guest_messages";
const GUEST_CONVERSATIONS_KEY = "chitchat_guest_conversations";

const readGuestConvs = (): Conv[] => {
  try { return JSON.parse(localStorage.getItem(GUEST_CONVERSATIONS_KEY) || "[]"); }
  catch { return []; }
};
const writeGuestConvs = (convs: Conv[]) => localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(convs));
const guestMsgKey = (id: string) => `${GUEST_MESSAGES_KEY}_${id}`;

const ACTIVE_KEY = "chitchat:activeConversationId";

export function useChatStorage(userId: string | undefined) {
  const localMode = !userId;
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACTIVE_KEY);
  });
  const [loadingHistory, setLoadingHistory] = useState(false);

  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdState(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(ACTIVE_KEY, id);
      else window.localStorage.removeItem(ACTIVE_KEY);
    }
    // Notify other hook instances in the same tab
    window.dispatchEvent(new CustomEvent("chitchat:active-conversation-changed", { detail: id }));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | null;
      setActiveConversationIdState(detail ?? null);
    };
    window.addEventListener("chitchat:active-conversation-changed", handler);
    return () => window.removeEventListener("chitchat:active-conversation-changed", handler);
  }, []);

  const loadConversations = useCallback(async () => {
    if (localMode) {
      setConversations(readGuestConvs().sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
      return;
    }
    if (!userId) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, [userId, localMode]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const createConversation = useCallback(async (title: string = "New Chat"): Promise<string | null> => {
    if (localMode) {
      const id = crypto.randomUUID();
      const conv = { id, title, updated_at: new Date().toISOString() };
      writeGuestConvs([conv, ...readGuestConvs()]);
      setActiveConversationId(id);
      await loadConversations();
      return id;
    }
    if (!userId) return null;
    const { data, error } = await supabase
      .from("conversations").insert({ user_id: userId, title }).select("id").single();
    if (error || !data) return null;
    setActiveConversationId(data.id);
    await loadConversations();
    return data.id;
  }, [userId, localMode, loadConversations]);

  const loadMessages = useCallback(async (conversationId: string): Promise<AetherMessage[]> => {
    setLoadingHistory(true);
    if (localMode) {
      setLoadingHistory(false);
      try { return JSON.parse(localStorage.getItem(guestMsgKey(conversationId)) || "[]"); }
      catch { return []; }
    }
    const { data } = await supabase
      .from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });
    setLoadingHistory(false);
    if (!data) return [];
    return data.map((m) => ({
      id: m.id, role: m.role as "user" | "assistant", content: m.content,
      type: m.image_url ? "image" as const : "text" as const,
      mode: m.mode as "chat" | "image", imageUrl: m.image_url || undefined,
      meta: m.meta || undefined, isStreaming: false,
      timestamp: new Date(m.created_at).getTime(),
    }));
  }, [localMode]);

  const saveMessage = useCallback(async (conversationId: string, msg: AetherMessage) => {
    if (localMode) {
      const key = guestMsgKey(conversationId);
      const existing: AetherMessage[] = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = existing.filter((m) => m.id !== msg.id);
      localStorage.setItem(key, JSON.stringify([...filtered, msg]));
      const convs = readGuestConvs().map((c) =>
        c.id === conversationId
          ? { ...c, updated_at: new Date().toISOString(), title: msg.role === "user" ? msg.content.slice(0, 60) : c.title }
          : c
      );
      writeGuestConvs(convs);
      await loadConversations();
      return;
    }
    if (!userId) return;
    await supabase.from("messages").insert({
      id: msg.id, conversation_id: conversationId, user_id: userId,
      role: msg.role, content: msg.content, mode: msg.mode,
      image_url: msg.imageUrl || null, meta: msg.meta || null,
    });
    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (msg.role === "user") updates.title = msg.content.slice(0, 60);
    await supabase.from("conversations").update(updates).eq("id", conversationId);
  }, [userId, localMode, loadConversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (localMode) {
      writeGuestConvs(readGuestConvs().filter((c) => c.id !== conversationId));
      localStorage.removeItem(guestMsgKey(conversationId));
    } else {
      await supabase.from("conversations").delete().eq("id", conversationId);
    }
    if (activeConversationId === conversationId) setActiveConversationId(null);
    await loadConversations();
  }, [activeConversationId, loadConversations, localMode]);

  const clearAllConversations = useCallback(async () => {
    if (localMode) {
      readGuestConvs().forEach((c) => localStorage.removeItem(guestMsgKey(c.id)));
      writeGuestConvs([]);
    } else if (userId) {
      await supabase.from("conversations").delete().eq("user_id", userId);
    }
    setActiveConversationId(null);
    setConversations([]);
  }, [userId, localMode]);

  return {
    conversations, activeConversationId, setActiveConversationId, loadingHistory,
    createConversation, loadMessages, saveMessage, deleteConversation,
    clearAllConversations, loadConversations,
  };
}
