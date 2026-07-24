import { useEffect, useState } from "react";
import { Image as ImageIcon, Sparkles, Loader2, Download, ChevronDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChatStorage } from "@/hooks/useChatStorage";
import BottomNav from "@/components/BottomNav";
import SeoHead from "@/components/SeoHead";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IMAGE_MODELS,
  DEFAULT_IMAGE_MODEL_ID,
  getImageModel,
  type ImageModelId,
} from "@/lib/imageModels";

interface GeneratedImage { id: string; prompt: string; url: string }

const ImageGen = () => {
  const { user } = useAuth();
  const storage = useChatStorage(user?.id);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [modelId, setModelId] = useState<ImageModelId>(DEFAULT_IMAGE_MODEL_ID);
  const currentModel = getImageModel(modelId);

  // Load existing images from active chat conversation
  useEffect(() => {
    const id = storage.activeConversationId;
    if (!id) { setImages([]); return; }
    storage.loadMessages(id).then((msgs) => {
      const imgMsgs = msgs
        .filter((m) => m.type === "image" && m.imageUrl)
        .map((m) => ({ id: m.id, prompt: m.content, url: m.imageUrl as string }));
      setImages(imgMsgs.reverse());
    });
  }, [storage.activeConversationId]);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        prompt,
        provider: currentModel.provider,
        model: currentModel.apiModel,
      };

      const { data, error } = await supabase.functions.invoke("aether-image", { body });
      const errMsg =
        (data && (data as { error?: string }).error) ||
        (error && (error as { message?: string }).message);
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

      const didFallback = Boolean(data.fallback);
      const fbModel = data.fallbackModel as string | undefined;
      if (didFallback) {
        toast.info(
          data.fallbackMessage ||
            `Using ${fbModel ?? "NVIDIA Flux 2"} for image generation.`,
          {
            description: `Model switched: ${currentModel.label} → ${fbModel ?? "NVIDIA Flux 2 Klein"}`,
            duration: 6000,
          },
        );
      }

      const newImg = { id: crypto.randomUUID(), prompt, url: data.imageUrl };
      setImages((prev) => [newImg, ...prev]);

      // Persist to active conversation memory (create if needed)
      try {
        let convId = storage.activeConversationId;
        if (!convId) {
          convId = await storage.createConversation(prompt.slice(0, 60));
        }
        if (convId) {
          await storage.saveMessage(convId, {
            id: crypto.randomUUID(),
            role: "user",
            content: prompt,
            type: "text",
            mode: "image",
            timestamp: Date.now(),
          });
          await storage.saveMessage(convId, {
            id: newImg.id,
            role: "assistant",
            content: prompt,
            type: "image",
            mode: "image",
            imageUrl: data.imageUrl,
            meta: didFallback
              ? `MODEL: ${fbModel ?? "NVIDIA Flux 2 Klein"} (fallback from ${currentModel.label})`
              : `MODEL: ${currentModel.label}`,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.error("Failed to save image to memory:", err);
      }

      setPrompt("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="AI Image Generator – ChitChat AI"
        description="Generate images with NVIDIA Flux using simple text prompts."
        path="/image"
      />
      <div className="noise-overlay" />
      <header className="h-14 border-b border-border flex items-center px-4 sticky top-0 bg-background/95 backdrop-blur z-10 gap-2">
        <ImageIcon size={16} className="text-primary mr-1" />
        <h1 className="text-sm font-semibold tracking-[-0.02em] flex-1">Image Synthesis</h1>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-card hover:bg-secondary text-xs font-medium text-foreground transition-colors max-w-[200px]">
            <span className="truncate">{currentModel.label}</span>
            <ChevronDown size={11} className="text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-popover border-border">
            <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Select Image Model
            </div>
            {IMAGE_MODELS.map((m) => {
              const active = m.id === modelId;
              return (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => setModelId(m.id)}
                  className="flex items-start gap-2 cursor-pointer py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">{m.label}</span>
                      {active && <Check size={12} className="text-primary" />}
                      {m.supportsEdit && (
                        <span className="text-[9px] font-mono text-primary border border-primary/40 rounded px-1">
                          EDIT
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {m.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full pb-40">
        {images.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
              <Sparkles size={20} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-mono text-center">
              Describe an image to generate with NVIDIA Flux.
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
                <p className="text-xs text-muted-foreground font-mono truncate flex-1">
                  {img.prompt}
                </p>
                <a href={img.url} download={`chitchat-${img.id}.png`} aria-label="Download image" className="text-muted-foreground hover:text-primary">
                  <Download size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur p-3">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          <div className="flex gap-2">
            <label htmlFor="image-prompt" className="sr-only">Image prompt</label>
            <input
              id="image-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="A neon-lit cyberpunk cat..."
              disabled={loading}
              aria-label="Image prompt"
              className="flex-1 h-11 rounded-xl border border-border bg-card px-4 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              aria-label="Generate image"
              className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ImageGen;
