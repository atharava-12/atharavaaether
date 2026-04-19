import { useState, useRef, useEffect } from "react";
import { Video, Sparkles, Loader2, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGuestMode } from "@/hooks/useGuestMode";
import GuestLockScreen from "@/components/GuestLockScreen";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

interface GeneratedVideo { id: string; prompt: string; frames: string[] }

const FrameAnimator = ({ frames, fps = 4 }: { frames: string[]; fps?: number }) => {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const interval = setInterval(() => setIdx((i) => (i + 1) % frames.length), 1000 / fps);
    return () => clearInterval(interval);
  }, [playing, frames.length, fps]);

  return (
    <div className="relative">
      <img src={frames[idx]} alt="" className="w-full aspect-square object-cover" />
      <button
        onClick={() => setPlaying(!playing)}
        className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80"
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur text-[10px] text-white font-mono">
        {frames.length} FRAMES
      </div>
    </div>
  );
};

const VideoGen = () => {
  const { isGuest } = useGuestMode();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);

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

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setProgress(0);
    try {
      const { data, error } = await supabase.functions.invoke("aether-video", {
        body: { prompt, frameCount: 6 },
      });
      if (error) throw error;
      if (!data?.frames?.length) throw new Error(data?.error || "No frames returned");
      setVideos((prev) => [{ id: crypto.randomUUID(), prompt, frames: data.frames }, ...prev]);
      setPrompt("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Video generation failed");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

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
              Describe a scene. We'll generate animated frames at 4fps.
            </p>
          </div>
        )}

        {loading && (
          <div className="aspect-square rounded-xl bg-card border border-border flex flex-col items-center justify-center mb-4 gap-3">
            <Loader2 size={24} className="text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-mono">Generating frames... (~30s)</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {videos.map((vid) => (
            <div key={vid.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <FrameAnimator frames={vid.frames} />
              <div className="p-3">
                <p className="text-xs text-muted-foreground font-mono truncate">{vid.prompt}</p>
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
