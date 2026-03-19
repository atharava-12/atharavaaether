import { Lightbulb, BookOpen, Languages } from "lucide-react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

const prompts = [
  { icon: Lightbulb, text: "Explain like I'm 5", prompt: "Explain like I'm 5: " },
  { icon: BookOpen, text: "Help me study", prompt: "Help me study " },
  { icon: Languages, text: "Translate text", prompt: "Translate the following text: " },
];

const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => (
  <div className="flex flex-wrap justify-center gap-2 mt-4">
    {prompts.map((p) => (
      <button
        key={p.text}
        onClick={() => onSelect(p.prompt)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <p.icon size={12} />
        {p.text}
      </button>
    ))}
  </div>
);

export default SuggestedPrompts;
