import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AetherMessage } from "@/hooks/useAether";

export function useChatStorage(userId: string | undefined) {
  const [conversations, setConversations] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Create new conversation
  const createConversation = useCallback(async (title: string = "New Chat"): Promise<string | null> => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title })
      .select("id")
      .single();
    if (error || !data) return null;
    setActiveConversationId(data.id);
    await loadConversations();
    return data.id;
  }, [userId, loadConversations]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string): Promise<AetherMessage[]> => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setLoadingHistory(false);

    if (!data) return [];
    return data.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      type: m.image_url ? "image" as const : "text" as const,
      mode: m.mode as "chat" | "image",
      imageUrl: m.image_url || undefined,
      meta: m.meta || undefined,
      isStreaming: false,
      timestamp: new Date(m.created_at).getTime(),
    }));
  }, []);

  // Save a message
  const saveMessage = useCallback(async (conversationId: string, msg: AetherMessage) => {
    if (!userId) return;
    await supabase.from("messages").insert({
      id: msg.id,
      conversation_id: conversationId,
      user_id: userId,
      role: msg.role,
      content: msg.content,
      mode: msg.mode,
      image_url: msg.imageUrl || null,
      meta: msg.meta || null,
    });
    // Update conversation timestamp and title
    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (msg.role === "user") updates.title = msg.content.slice(0, 60);
    await supabase.from("conversations").update(updates).eq("id", conversationId);
  }, [userId]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    await supabase.from("conversations").delete().eq("id", conversationId);
    if (activeConversationId === conversationId) setActiveConversationId(null);
    await loadConversations();
  }, [activeConversationId, loadConversations]);

  // Clear all conversations
  const clearAllConversations = useCallback(async () => {
    if (!userId) return;
    await supabase.from("conversations").delete().eq("user_id", userId);
    setActiveConversationId(null);
    setConversations([]);
  }, [userId]);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    loadingHistory,
    createConversation,
    loadMessages,
    saveMessage,
    deleteConversation,
    clearAllConversations,
    loadConversations,
  };
}
