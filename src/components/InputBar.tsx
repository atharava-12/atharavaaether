import { useState, useRef, useEffect } from "react";
import { CornerDownLeft, Image as ImageIcon, MessageSquare, Video } from "lucide-react";

interface InputBarProps {
  onSubmit: (message: string, mode: "chat" | "image" | "video") => void;
  isLoading: boolean;
}

const InputBar = ({ onSubmit, isLoading }: InputBarProps) => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"chat" | "image">("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim(), mode);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 px-4 pt-3">
          <button
            onClick={() => setMode("chat")}
            className={`flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium tracking-wide transition-colors ${
              mode === "chat"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <MessageSquare size={12} />
            Q&A
          </button>
          <button
            onClick={() => setMode("image")}
            className={`flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium tracking-wide transition-colors ${
              mode === "image"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <ImageIcon size={12} />
            IMAGE
          </button>
        </div>

        {/* Input area */}
        <div className="flex items-end gap-3 px-4 pb-3 pt-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "chat"
                ? "Ask anything in any language..."
                : "Describe the image you want to generate..."
            }
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none outline-none min-h-[36px] max-h-[120px] py-2 font-sans"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="flex items-center justify-center h-8 w-8 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-1"
          >
            <CornerDownLeft size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputBar;
