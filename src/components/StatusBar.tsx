import { Cloud, Zap } from "lucide-react";

interface StatusBarProps {
  isConnected: boolean;
  latency?: number;
}

const StatusBar = ({ isConnected, latency }: StatusBarProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-primary" />
        <span className="text-sm font-semibold tracking-[-0.03em]">CHITCHAT</span>
      </div>

      <div className="flex items-center gap-4">
        {latency && (
          <span className="text-[11px] font-mono text-muted-foreground">
            LATENCY: {latency}ms
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <Cloud
            size={13}
            className={`${isConnected ? "text-primary animate-breathe" : "text-muted-foreground"}`}
          />
          <span className="text-[11px] font-mono text-muted-foreground">
            {isConnected ? "SYNC: ACTIVE" : "SYNC: IDLE"}
          </span>
        </div>
      </div>
    </header>
  );
};

export default StatusBar;
