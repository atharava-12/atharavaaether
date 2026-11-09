import { motion } from "framer-motion";
import { Check, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface UserMessageProps {
  content: string;
  mode: "chat" | "image";
  disabled?: boolean;
  onSaveEdit: (content: string) => Promise<void>;
}

const UserMessage = ({ content, mode, disabled = false, onSaveEdit }: UserMessageProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(content), [content]);

  const saveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSaveEdit(trimmed);
      setEditing(false);
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full flex justify-end"
    >
      <div className="max-w-[80%] min-w-[min(80%,18rem)] bg-secondary border border-border rounded-lg px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="text-[10px] font-mono tracking-[0.1em] uppercase text-muted-foreground">
            {mode === "chat" ? "QUERY" : "IMAGE PROMPT"}
          </span>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={disabled}
              aria-label="Edit message"
              title="Edit message"
              className="text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
        {editing ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={saving}
              aria-label="Edit message text"
              className="min-h-20 w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => { setDraft(content); setEditing(false); }}>
                <X /> Cancel
              </Button>
              <Button type="button" size="sm" disabled={saving || !draft.trim()} onClick={() => void saveEdit()}>
                <Check /> {saving ? "Saving..." : "Save and resend"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </motion.div>
  );
};

export default UserMessage;
