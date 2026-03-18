import { useRef, useEffect, useCallback } from "react";
import { Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBar from "@/components/StatusBar";
import InputBar from "@/components/InputBar";
import ResultModule from "@/components/ResultModule";
import UserMessage from "@/components/UserMessage";
import { useAether } from "@/hooks/useAether";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const Index = () => {
  const { messages, isLoading, latency, sendMessage, clearMessages } = useAether();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleClearChat = useCallback(() => {
    if (window.confirm("Clear all messages?")) {
      clearMessages();
    }
  }, [clearMessages]);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="noise-overlay" />
      <StatusBar
        isConnected={isOnline}
        latency={latency}
        onClearChat={handleClearChat}
        hasMessages={messages.length > 0}
      />

      <div
        ref={scrollRef}
        className="pt-16 pb-40 px-[5vw] md:px-[10vw] max-w-4xl mx-auto overflow-y-auto h-screen"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
              <Zap size={20} className="text-primary" />
            </div>
            <h1 className="text-lg font-medium tracking-[-0.03em] text-foreground">
              What can I help you with?
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-md font-mono">
              Multilingual Q&A · Image synthesis · Video generation
            </p>
            <div className="flex items-center gap-4 mt-6">
              <span className="text-[11px] font-mono text-muted-foreground/50 tracking-wider">
                POWERED BY AI · MULTI-MODEL · CLOUD-CONNECTED
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {messages.map((msg) =>
            msg.role === "user" ? (
              <UserMessage key={msg.id} content={msg.content} mode={msg.mode} />
            ) : (
              <ResultModule
                key={msg.id}
                type={msg.type}
                label={msg.mode === "image" ? "IMAGE SYNTHESIS" : msg.mode === "video" ? "VIDEO GENERATION" : "RESPONSE"}
                meta={msg.meta}
                content={msg.content}
                imageUrl={msg.imageUrl}
                isStreaming={msg.isStreaming}
              />
            )
          )}
        </div>
      </div>

      <InputBar onSubmit={sendMessage} isLoading={isLoading} isOffline={!isOnline} />

      {/* Footer link to privacy policy */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-30">
        <Link to="/privacy" className="flex items-center gap-1 text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors">
          <Shield size={10} />
          Privacy Policy
        </Link>
      </div>
    </div>
  );
};

export default Index;
