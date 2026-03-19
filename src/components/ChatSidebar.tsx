import { Plus, Trash2, Settings, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ChatSidebar = ({ conversations, activeId, onSelect, onNew, onDelete, onClose }: ChatSidebarProps) => {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Chats</span>
        <button
          onClick={() => { onNew(); onClose(); }}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="New chat"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-8 font-mono">No conversations yet</p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center gap-2 mx-2 my-0.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              c.id === activeId ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
            }`}
            onClick={() => { onSelect(c.id); onClose(); }}
          >
            <MessageSquare size={14} className="shrink-0" />
            <span className="text-sm truncate flex-1">{c.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <Link
          to="/settings"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Settings size={14} />
          Settings
        </Link>
      </div>
    </div>
  );
};

export default ChatSidebar;
