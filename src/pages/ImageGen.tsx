import { useState } from "react";
import { Image as ImageIcon, Sparkles, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGuestMode } from "@/hooks/useGuestMode";
import GuestLockScreen from "@/components/GuestLockScreen";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

interface GeneratedImage { id: string; prompt: string; url: string }

const ImageGen = () => {
  const { isGuest } = useGuestMode();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  if (isGuest) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="noise-overlay" />
        <header className="h-14 border-b border-border flex items-center px-4">
          <h1 className="text-sm font-semibold tracking-[-0.02em]">Image Synthesis</h1>
        </header>
        <GuestLockScreen feature="Image generation" />
        <BottomNav />
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("aether-image", { body: { prompt } });
      const errMsg =
        (error && (error as { message?: string }).message) ||
        (data && (data as { error?: string }).error);
      if (errMsg) {
        if (/usage limit|402/i.test(errMsg)) {
          toast.error("AI usage limit reached.");
          return;
        }
        if (/rate limit|429/i.test(errMsg)) {
          toast.error("Rate limited. Please wait and try again.");
          return;
        }
        throw new Error(errMsg);
      }
      if (!data?.imageUrl) throw new Error("No image returned");
      setImages((prev) => [{ id: crypto.randomUUID(), prompt, url: data.imageUrl }, ...prev]);
      setPrompt("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="noise-overlay" />
      <header className="h-14 border-b border-border flex items-center px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
        <ImageIcon size={16} className="text-primary mr-2" />
        <h1 className="text-sm font-semibold tracking-[-0.02em]">Image Synthesis</h1>
      </header>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full pb-32">
        {images.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
              <Sparkles size={20} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-mono text-center">
              Describe an image and we'll create it.
            </p>
          </div>
        )}

        {loading && (
          <div className="aspect-square rounded-xl bg-card border border-border flex items-center justify-center mb-4">
            <Loader2 size={24} className="text-primary animate-spin" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {images.map((img) => (
            <div key={img.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
              <div className="p-3 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground font-mono truncate flex-1">{img.prompt}</p>
                <a href={img.url} download={`chitchat-${img.id}.png`} className="text-muted-foreground hover:text-primary">
                  <Download size={14} />
                </a>
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
            placeholder="A neon-lit cyberpunk cat..."
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

export default ImageGen;
