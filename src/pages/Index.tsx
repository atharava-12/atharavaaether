import { useRef, useEffect } from "react";
import { Zap } from "lucide-react";
import StatusBar from "@/components/StatusBar";
import InputBar from "@/components/InputBar";
import ResultModule from "@/components/ResultModule";
import UserMessage from "@/components/UserMessage";
import { useAether } from "@/hooks/useAether";

const Index = () => {
  const { messages, isLoading, latency, sendMessage } = useAether();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="noise-overlay" />
      <StatusBar isConnected={true} latency={latency} />

      {/* Main ledger */}
      <div
        ref={scrollRef}
        className="pt-16 pb-32 px-[5vw] md:px-[10vw] max-w-4xl mx-auto overflow-y-auto h-screen"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
              <Zap size={20} className="text-primary" />
            </div>
            <h1 className="text-lg font-medium tracking-[-0.03em] text-foreground">
              Awaiting instruction...
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-md font-mono">
              Multilingual Q&A · Image synthesis · Video generation · Cloud-connected
            </p>
            <div className="flex items-center gap-4 mt-6">
              <span className="text-[11px] font-mono text-muted-foreground/50 tracking-wider">
                REGION: AUTO · MODELS: GEMINI · SYNC: ACTIVE
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
                label={msg.mode === "image" ? "IMAGE SYNTHESIS" : "RESPONSE"}
                meta={msg.meta}
                content={msg.content}
                imageUrl={msg.imageUrl}
                isStreaming={msg.isStreaming}
              />
            )
          )}
        </div>
      </div>

      <InputBar onSubmit={sendMessage} isLoading={isLoading} />
    </div>
  );
};

export default Index;
