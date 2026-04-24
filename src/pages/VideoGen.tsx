import { useState } from "react";
import { Video, Sparkles, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useVideoEncoder } from "@/hooks/useVideoEncoder";
import GuestLockScreen from "@/components/GuestLockScreen";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

interface GeneratedVideo {
  id: string;
  prompt: string;
  videoUrl: string;
}

const VideoGen = () => {
  const { isGuest } = useGuestMode();
  const [prompt, setPrompt] = useState("");
  const [stage, setStage] = useState<"idle" | "frames" | "encoding">("idle");
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const { encodeFramesToMp4, loading: ffmpegLoading, progress } = useVideoEncoder();

  if (isGuest) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="noise-overlay" />
        <header className="h-14 border-b border-border flex items-center px-4">
          <h1 className="text-sm font-semibold tracking-[-0.02em]">Video Synthesis</h1>
        </header>
        <GuestLockScreen feature="Video generation" />
        <BottomNav />
      </div>
    );
  }

  const loading = stage !== "idle";

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    try {
      setStage("frames");
      const { data, error } = await supabase.functions.invoke("aether-video", {
        body: { prompt, frameCount: 12 },
      });
      if (error) throw error;
      if (!data?.frames?.length) throw new Error(data?.error || "No frames returned");

      setStage("encoding");
      const videoUrl = await encodeFramesToMp4(data.frames, { sourceFps: 6, outputFps: 24 });

      setVideos((prev) => [{ id: crypto.randomUUID(), prompt, videoUrl }, ...prev]);
      setPrompt("");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Video generation failed");
    } finally {
      setStage("idle");
    }
  };

  const handleDownload = (videoUrl: string, p: string) => {
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `chitchat-${p.slice(0, 30).replace(/\s+/g, "-")}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const stageLabel =
    stage === "frames"
      ? "Generating keyframes... (~30s)"
      : ffmpegLoading
      ? "Loading video encoder..."
      : stage === "encoding"
      ? `Encoding MP4... ${Math.round(progress * 100)}%`
      : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="noise-overlay" />
      <header className="h-14 border-b border-border flex items-center px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
        <Video size={16} className="text-primary mr-2" />
        <h1 className="text-sm font-semibold tracking-[-0.02em]">Video Synthesis</h1>
      </header>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full pb-32">
        {videos.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
              <Video size={20} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-mono text-center max-w-xs">
              Describe a scene. We'll synthesize a real MP4 video with motion interpolation.
            </p>
          </div>
        )}

        {loading && (
          <div className="aspect-square rounded-xl bg-card border border-border flex flex-col items-center justify-center mb-4 gap-3 px-6">
            <Loader2 size={24} className="text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-mono text-center">{stageLabel}</p>
            {stage === "encoding" && (
              <div className="w-full max-w-xs h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {videos.map((vid) => (
            <div key={vid.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <video
                src={vid.videoUrl}
                controls
                loop
                playsInline
                className="w-full aspect-square object-cover bg-black"
              />
              <div className="p-3 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground font-mono truncate flex-1">{vid.prompt}</p>
                <button
                  onClick={() => handleDownload(vid.videoUrl, vid.prompt)}
                  className="shrink-0 h-8 px-3 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 flex items-center gap-1.5"
                >
                  <Download size={12} />
                  MP4
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur p-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Astronaut floating through nebula..."
            disabled={loading}
            className="flex-1 h-11 rounded-xl border border-border bg-card px-4 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default VideoGen;
