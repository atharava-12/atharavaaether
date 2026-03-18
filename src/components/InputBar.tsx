import { useState, useRef, useEffect, useCallback } from "react";
import { CornerDownLeft, Image as ImageIcon, MessageSquare, Video, Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface InputBarProps {
  onSubmit: (message: string, mode: "chat" | "image" | "video") => void;
  isLoading: boolean;
  isOffline: boolean;
}

const InputBar = ({ onSubmit, isLoading, isOffline }: InputBarProps) => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"chat" | "image">("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVoiceResult = useCallback((text: string) => {
    setInput((prev) => (prev ? prev + " " + text : text));
  }, []);

  const { isListening, isSupported: voiceSupported, startListening, stopListening } = useVoiceInput(handleVoiceResult);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading || isOffline) return;
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
      {isOffline && (
        <div className="mb-2 text-center text-xs text-destructive font-mono bg-destructive/10 rounded-lg py-1.5">
          You're offline. Please check your connection.
        </div>
      )}
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 px-4 pt-3">
          <button
            onClick={() => setMode("chat")}
            className={`flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium tracking-wide transition-colors ${
              mode === "chat"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <ImageIcon size={12} />
            IMAGE
          </button>
          <button
            onClick={() => setMode("video")}
            className={`flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium tracking-wide transition-colors ${
              mode === "video"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Video size={12} />
            VIDEO
          </button>
        </div>

        {/* Input area */}
        <div className="flex items-end gap-2 px-4 pb-3 pt-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isOffline
                ? "You're offline..."
                : mode === "chat"
                ? "Ask anything in any language..."
                : mode === "image"
                ? "Describe the image you want to generate..."
                : "Describe the video you want to generate..."
            }
            rows={1}
            disabled={isLoading || isOffline}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none outline-none min-h-[36px] max-h-[120px] py-2 font-sans"
          />
          {voiceSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={`flex items-center justify-center h-8 w-8 rounded transition-colors shrink-0 mb-1 ${
                isListening
                  ? "bg-destructive/20 text-destructive animate-pulse"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              title={isListening ? "Stop recording" : "Voice input"}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || isOffline}
            className="flex items-center justify-center h-8 w-8 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-1"
          >
            <CornerDownLeft size={14} />
          </button>
        </div>

        {/* AI Disclaimer */}
        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground/50 text-center font-mono">
            AI responses may be inaccurate. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InputBar;
