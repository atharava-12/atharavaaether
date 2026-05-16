import { useState, useRef, useEffect, useCallback } from "react";
import { CornerDownLeft, Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface InputBarProps {
  onSubmit: (message: string, mode: "chat" | "image") => void;
  isLoading: boolean;
  isOffline: boolean;
  externalValue?: string;
  onExternalValueConsumed?: () => void;
}

const InputBar = ({ onSubmit, isLoading, isOffline, externalValue, onExternalValueConsumed }: InputBarProps) => {
  const [input, setInput] = useState("");
  const mode: "chat" | "image" = "chat";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle external value (e.g. from suggested prompts)
  useEffect(() => {
    if (externalValue) {
      setInput(externalValue);
      onExternalValueConsumed?.();
      textareaRef.current?.focus();
    }
  }, [externalValue, onExternalValueConsumed]);

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

        <div className="flex items-end gap-2 px-4 pb-3 pt-2">
          <label htmlFor="chat-input" className="sr-only">Chat message</label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isOffline ? "You're offline..." : mode === "chat" ? "Ask anything in any language..." : "Describe the image you want to generate..."}
            rows={1}
            disabled={isLoading || isOffline}
            aria-label="Chat message"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none outline-none min-h-[36px] max-h-[120px] py-2 font-sans"
          />
          {voiceSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              className={`flex items-center justify-center h-8 w-8 rounded transition-colors shrink-0 mb-1 ${
                isListening ? "bg-destructive/20 text-destructive animate-pulse" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              title={isListening ? "Stop recording" : "Voice input"}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || isOffline}
            aria-label="Send message"
            className="flex items-center justify-center h-8 w-8 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-1"
          >
            <CornerDownLeft size={14} />
          </button>
        </div>

        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground text-center font-mono">
            AI responses may be inaccurate. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InputBar;
