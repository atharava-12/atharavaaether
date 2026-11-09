import { useState, useRef, useEffect, useCallback } from "react";
import { CornerDownLeft, FileText, ImagePlus, Mic, MicOff, Paperclip, Search, MessageSquare, X } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "sonner";
import { analyzeDocumentFile, getSupportedDocumentTypes } from "@/lib/fileIntelligence";
import type { ChatAttachment } from "@/lib/chatAttachments";

interface InputBarProps {
  onSubmit: (message: string, mode: "chat" | "image", attachments: ChatAttachment[]) => void;
  isLoading: boolean;
  isOffline: boolean;
  externalValue?: string;
  onExternalValueConsumed?: () => void;
  onResearchClick?: () => void;
}

const InputBar = ({ onSubmit, isLoading, isOffline, externalValue, onExternalValueConsumed, onResearchClick }: InputBarProps) => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"chat" | "image">("chat");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const readAsDataUrl = (file: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read this file."));
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });

  const convertWebpToJpeg = async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot prepare the image.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) throw new Error("This image could not be converted.");
    return new File([blob], file.name.replace(/\.webp$/i, ".jpg"), { type: "image/jpeg" });
  };

  const handleAddFiles = async (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);
    if (selectedFiles.length + attachments.length > 4) {
      toast.error("Attach up to four files per message.");
      return;
    }

    const acceptedDocuments = new Set<string>(getSupportedDocumentTypes());
    const added: ChatAttachment[] = [];
    for (const originalFile of selectedFiles) {
      if (originalFile.size > 8 * 1024 * 1024) {
        toast.error(`${originalFile.name} is larger than 8 MB.`);
        continue;
      }

      try {
        if (originalFile.type.startsWith("image/")) {
          if (!/\.(?:png|jpe?g|webp)$/i.test(originalFile.name) && !["image/png", "image/jpeg", "image/webp"].includes(originalFile.type)) {
            toast.error(`${originalFile.name} is not a supported image format.`);
            continue;
          }
          const uploadFile = originalFile.type === "image/webp" ? await convertWebpToJpeg(originalFile) : originalFile;
          added.push({
            id: crypto.randomUUID(),
            name: originalFile.name,
            mimeType: uploadFile.type,
            size: originalFile.size,
            dataUrl: await readAsDataUrl(uploadFile),
            file: uploadFile,
          });
          continue;
        }

        const isDocx = originalFile.name.toLowerCase().endsWith(".docx");
        if (!acceptedDocuments.has(originalFile.type) && !isDocx) {
          toast.error(`${originalFile.name} is not a supported file type.`);
          continue;
        }
        const analysis = await analyzeDocumentFile(originalFile);
        if (!analysis.supported) {
          toast.error(analysis.message);
          continue;
        }
        added.push({
          id: crypto.randomUUID(),
          name: originalFile.name,
          mimeType: originalFile.type || "application/octet-stream",
          size: originalFile.size,
          extractedText: analysis.text ?? analysis.preview,
          file: originalFile,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Could not read ${originalFile.name}.`);
      }
    }
    if (added.length) setAttachments((current) => [...current, ...added]);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || isOffline) return;
    onSubmit(input.trim() || "Please review the attached files.", mode, attachments);
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={`relative z-40 mx-auto w-full max-w-3xl px-4 ${isDragging ? "rounded-3xl ring-2 ring-cyan-400" : ""}`}
      onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => { event.preventDefault(); setIsDragging(false); void handleAddFiles(event.dataTransfer.files); }}
    >
      {isOffline && (
        <div className="mb-2 text-center text-xs text-destructive font-mono bg-destructive/10 rounded-lg py-1.5">
          You're offline. Please check your connection.
        </div>
      )}
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0a1220]/85 shadow-[0_30px_80px_rgba(6,11,20,0.7)] backdrop-blur-xl ring-1 ring-white/5">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,.txt,.md,.csv,.json,.html,.pdf,.docx"
          className="hidden"
          aria-label="Choose files to attach"
          onChange={(event) => {
            if (event.target.files) void handleAddFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={() => setMode("chat")}
            aria-pressed={mode === "chat"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] transition ${
              mode === "chat" ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-200" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
            }`}
          >
            <MessageSquare size={11} />
            Chat
          </button>

          <button
            type="button"
            onClick={() => setMode("image")}
            aria-pressed={mode === "image"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] transition ${
              mode === "image" ? "border-violet-400/30 bg-violet-500/10 text-violet-200" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
            }`}
          >
            <ImagePlus size={11} />
            Image
          </button>

          <button
            type="button"
            onClick={onResearchClick}
            aria-label="Open research mode"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-200"
          >
            <Search size={11} />
            Research
          </button>
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-white/10 px-3 py-2 sm:px-4" aria-label="Attached files">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                {attachment.dataUrl ? <ImagePlus size={13} className="shrink-0 text-cyan-300" /> : <FileText size={13} className="shrink-0 text-slate-400" />}
                <span className="max-w-40 truncate text-[11px] text-slate-200">{attachment.name}</span>
                <span className="text-[10px] text-slate-500">{(attachment.size / 1024).toFixed(0)} KB</span>
                <button
                  type="button"
                  onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}
                  aria-label={`Remove ${attachment.name}`}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-white/10 hover:text-white"
                ><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 px-3 pb-3 pt-2 sm:px-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={mode !== "chat" || isLoading || attachments.length >= 4}
            aria-label="Attach files"
            title="Attach files"
            className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
          ><Paperclip size={14} /></button>
          <label htmlFor="chat-input" className="sr-only">Chat message</label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isOffline
                ? "You're offline..."
                : mode === "chat" ? "Ask anything in any language..." : "Describe the image you want to generate..."
            }
            rows={1}
            disabled={isLoading || isOffline}
            aria-label="Chat message"
            className="flex-1 resize-none bg-transparent px-1 py-2 text-sm text-slate-50 placeholder:text-slate-400 outline-none min-h-[40px] max-h-[120px] font-sans"
          />

          {voiceSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              className={`mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                isListening ? "bg-rose-500/15 text-rose-300 animate-pulse ring-1 ring-rose-400/30" : "border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/30 hover:text-cyan-200"
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
            className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CornerDownLeft size={16} />
          </button>
        </div>

        <div className="border-t border-white/10 px-4 py-2">
          <p className="text-center text-[10px] uppercase tracking-[0.14em] text-slate-400">
            AI responses may be inaccurate. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InputBar;
