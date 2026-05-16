import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Copy, Download, Check } from "lucide-react";
import { useState } from "react";

interface ResultModuleProps {
  type: "text" | "image";
  label: string;
  meta?: string;
  content: string;
  imageUrl?: string;
  isStreaming?: boolean;
}

const moduleVariant = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, duration: 0.4, bounce: 0 },
  },
};

const ResultModule = ({ type, label, meta, content, imageUrl, isStreaming }: ResultModuleProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "chitchat-generated.png";
    a.click();
  };

  return (
    <motion.section
      variants={moduleVariant}
      initial="initial"
      animate="animate"
      className="w-full bg-card border border-border rounded-lg overflow-hidden"
    >
      {/* Progress bar for streaming */}
      {isStreaming && (
        <div className="h-0.5 bg-secondary overflow-hidden">
          <div className="h-full w-1/3 bg-primary animate-progress" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground">
            {label}
          </span>
          {meta && (
            <span className="text-[11px] font-mono text-muted-foreground/60">
              {meta}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {type === "text" && (
            <button
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy response"}
              className="h-7 px-2 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          )}
          {type === "image" && imageUrl && (
            <button
              onClick={handleDownload}
              aria-label="Download generated image"
              className="h-7 px-2 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <Download size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {type === "text" && (
          <div className="prose-aether text-sm font-mono leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        {type === "image" && imageUrl && (
          <div className="aspect-video w-full overflow-hidden outline outline-1 outline-border">
            <img
              src={imageUrl}
              alt={content}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {type === "image" && !imageUrl && isStreaming && (
          <div className="aspect-video w-full bg-secondary/30 flex items-center justify-center">
            <span className="text-xs text-muted-foreground font-mono tracking-wider uppercase">
              Generating...
            </span>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default ResultModule;
