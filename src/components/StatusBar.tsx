import { Cloud, Zap, Trash2 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface StatusBarProps {
  isConnected: boolean;
  latency?: number;
  onClearChat?: () => void;
  hasMessages?: boolean;
}

const StatusBar = ({ isConnected, latency, onClearChat, hasMessages }: StatusBarProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-primary" />
        <span className="text-sm font-semibold tracking-[-0.03em]">CHITCHAT</span>
      </div>

      <div className="flex items-center gap-3">
        {latency !== undefined && latency > 0 && (
          <span className="text-[11px] font-mono text-muted-foreground">
            {latency}ms
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <Cloud
            size={13}
            className={`${isConnected ? "text-primary animate-breathe" : "text-muted-foreground"}`}
          />
          <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
            {isConnected ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
        {hasMessages && onClearChat && (
          <button
            onClick={onClearChat}
            className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
            title="Clear chat"
          >
            <Trash2 size={14} />
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
};

export default StatusBar;
