import { useNavigate } from "react-router-dom";
import { Brain, Trash2, MessageSquare, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChatStorage } from "@/hooks/useChatStorage";
import BottomNav from "@/components/BottomNav";
import SeoHead from "@/components/SeoHead";

const Memory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const storage = useChatStorage(user?.id);

  const openChat = (id: string) => {
    storage.setActiveConversationId(id);
    navigate("/");
  };

  const newChat = () => {
    storage.setActiveConversationId(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Chat Memory – ChitChat AI"
        description="Browse your saved AI conversations and generated images. Resume any chat or start a new one in ChitChat AI."
        path="/memory"
      />
      <div className="noise-overlay" />
      <header className="h-14 border-b border-border flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-primary" />
          <h1 className="text-sm font-semibold tracking-[-0.02em]">Memory</h1>
        </div>
        <button
          onClick={newChat}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={12} /> New
        </button>
      </header>

      <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full pb-24">
        {storage.conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
              <MessageSquare size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-mono">No saved chats yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {storage.conversations.map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-secondary cursor-pointer transition-colors"
                onClick={() => openChat(c.id)}
              >
                <MessageSquare size={14} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {new Date(c.updated_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this chat permanently?")) storage.deleteConversation(c.id);
                  }}
                  aria-label={`Delete chat ${c.title}`}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Memory;
