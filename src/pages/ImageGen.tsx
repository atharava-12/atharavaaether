import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Download, Grid2X2, Image as ImageIcon, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChatStorage } from "@/hooks/useChatStorage";
import BottomNav from "@/components/BottomNav";
import SeoHead from "@/components/SeoHead";
import { toast } from "sonner";
import { addImageTextOverlay, parseImageTextRequest } from "@/lib/imageText";
import { loadImageGenerations, saveImageGeneration, toImageStorageReference } from "@/lib/imageLibrary";
import {
  IMAGE_MODELS,
  DEFAULT_IMAGE_MODEL_ID,
  getImageModel,
  getImageDimensions,
  resolveImageModel,
  type ImageAspectRatio,
  type ImageModelId,
} from "@/lib/imageModels";

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  model: string;
  storagePath?: string;
  originalPath?: string | null;
  originalUrl?: string | null;
  generationType?: "text-to-image" | "image-to-image" | "chat";
  sessionId?: string;
  createdAt?: string;
}

const ImageGen = () => {
  const { user } = useAuth();
  const storage = useChatStorage(user?.id);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "gallery">("create");
  const [modelId, setModelId] = useState<ImageModelId>(DEFAULT_IMAGE_MODEL_ID);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("1:1");
  const [seed, setSeed] = useState(0);
  const [referenceImage, setReferenceImage] = useState<{ name: string; size: number; dataUrl: string } | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalImagePath, setOriginalImagePath] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const imageInputRef = useRef<HTMLInputElement>(null);
  const currentModel = getImageModel(modelId);

  useEffect(() => {
    let active = true;
    const loadImages = async () => {
      let libraryImages: GeneratedImage[] = [];
      if (user?.id) {
        try {
          const generations = await loadImageGenerations(user.id);
          libraryImages = generations
            .filter((generation) => generation.imageUrl)
            .map((generation) => ({
              id: generation.id,
              prompt: generation.prompt,
              url: generation.imageUrl,
              model: IMAGE_MODELS.find((model) => model.id === generation.model_id)?.label ?? generation.model_id,
              storagePath: generation.image_path,
              originalPath: generation.original_image_path,
              originalUrl: generation.originalImageUrl,
              generationType: generation.generation_type,
              sessionId: generation.session_id,
              createdAt: generation.created_at,
            }));
        } catch (error) {
          console.error("Unable to load image library:", error);
        }
      }

      let legacyImages: GeneratedImage[] = [];
      if (storage.activeConversationId) {
        const messages = await storage.loadMessages(storage.activeConversationId);
        legacyImages = messages
          .filter((message) => message.type === "image" && message.imageUrl)
          .map((message) => ({
            id: message.id,
            prompt: message.content,
            url: message.imageUrl as string,
            model: message.meta?.replace(/^MODEL:\s*/i, "") ?? "Saved image",
          }));
      }

      if (active) {
        const savedIds = new Set(libraryImages.map((image) => image.id));
        setImages([...libraryImages, ...legacyImages.filter((image) => !savedIds.has(image.id))]);
      }
    };

    void loadImages();
    return () => { active = false; };
  }, [user?.id, storage.activeConversationId]);

  const selectModel = (nextModelId: ImageModelId) => {
    const nextModel = getImageModel(nextModelId);
    if (referenceImage && !nextModel.supportsEdit) {
      toast.error("Keep an editing-capable model selected while an image is attached.");
      return;
    }
    setModelId(nextModelId);
    if (!nextModel.aspectRatios.includes(aspectRatio)) {
      setAspectRatio(nextModel.aspectRatios[0]);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!currentModel.supportsEdit) {
      toast.error("Choose Flux.2 Klein or Flux.3 Image Klein to edit an image.");
      event.target.value = "";
      return;
    }
    if (!(file.type === "image/png" || file.type === "image/jpeg")) {
      toast.error("Choose a PNG or JPEG image.");
      event.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Choose an image smaller than 8 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("This image could not be opened.");
        return;
      }
      setOriginalImageUrl(reader.result);
      setOriginalImagePath(null);
      setReferenceImage({ name: file.name, size: file.size, dataUrl: reader.result });
    };
    reader.onerror = () => toast.error("This image could not be opened.");
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const continueEditing = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      if (!response.ok) throw new Error("This saved image could not be opened.");
      const blob = await response.blob();
      if (!(blob.type === "image/png" || blob.type === "image/jpeg") || blob.size > 8 * 1024 * 1024) {
        throw new Error("Choose a PNG or JPEG image smaller than 8 MB to continue editing.");
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          toast.error("This saved image could not be opened.");
          return;
        }
        if (!currentModel.supportsEdit) selectModel("nvidia-flux-2-klein");
        setReferenceImage({ name: image.prompt.slice(0, 48) || "Saved image", size: blob.size, dataUrl: reader.result as string });
        setOriginalImageUrl(image.originalUrl ?? image.url);
        setOriginalImagePath(image.originalPath ?? image.storagePath ?? null);
        setSessionId(image.sessionId ?? crypto.randomUUID());
        setPrompt("");
        setActiveTab("create");
      };
      reader.onerror = () => toast.error("This saved image could not be opened.");
      reader.readAsDataURL(blob);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "This saved image could not be opened.");
    }
  };

  const handleGenerate = async () => {
    const cleanedPrompt = prompt.trim();
    if (!cleanedPrompt || loading) return;
    if (referenceImage && !currentModel.supportsEdit) {
      toast.error("Choose an image-editing model to continue.");
      return;
    }

    setLoading(true);
    try {
      const textRequest = parseImageTextRequest(cleanedPrompt);
      const dimensions = getImageDimensions(aspectRatio);
      const body: Record<string, unknown> = {
        prompt: textRequest?.backgroundPrompt ?? cleanedPrompt,
        provider: currentModel.provider,
        model: resolveImageModel(currentModel.provider, currentModel.apiModel),
        width: dimensions.width,
        height: dimensions.height,
        seed,
        ...(referenceImage ? { image: referenceImage.dataUrl } : {}),
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
        if (/prompt.*required|please enter a description|required/i.test(errMsg)) {
          toast.error("Please enter a description of the image you want to create.");
          return;
        }
        throw new Error(errMsg);
      }
      if (!data?.imageUrl) throw new Error("Image generation failed. Please try again.");

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

      const imageUrl = textRequest
        ? await addImageTextOverlay(data.imageUrl, textRequest.text)
        : data.imageUrl;
      const imageId = crypto.randomUUID();
      let convId = storage.activeConversationId;
      if (!convId) convId = await storage.createConversation(cleanedPrompt.slice(0, 60));

      let displayUrl = imageUrl;
      let imagePath: string | undefined;
      let savedOriginalPath = originalImagePath;
      let savedOriginalUrl = originalImageUrl;
      if (user?.id) {
        try {
          const savedImage = await saveImageGeneration({
            id: imageId,
            userId: user.id,
            conversationId: convId,
            sessionId,
            prompt: cleanedPrompt,
            modelId: currentModel.id,
            provider: currentModel.provider,
            generationType: referenceImage ? "image-to-image" : "text-to-image",
            imageDataUrl: imageUrl,
            originalImageDataUrl: referenceImage && !originalImagePath
              ? originalImageUrl ?? referenceImage.dataUrl
              : null,
            originalImagePath,
            width: dimensions.width,
            height: dimensions.height,
            seed,
          });
          displayUrl = savedImage.imageUrl;
          imagePath = savedImage.imagePath;
          savedOriginalPath = savedImage.originalImagePath;
          savedOriginalUrl = savedImage.originalImageUrl ?? savedOriginalUrl;
          setOriginalImagePath(savedOriginalPath);
          setOriginalImageUrl(savedOriginalUrl);
        } catch (saveError) {
          console.error("Unable to save image to private library:", saveError);
          toast.error("Image created, but it could not be saved to your private library.");
        }
      }

      const newImg: GeneratedImage = {
        id: imageId,
        prompt: cleanedPrompt,
        url: displayUrl,
        model: didFallback ? fbModel ?? currentModel.label : currentModel.label,
        storagePath: imagePath,
        originalUrl: savedOriginalUrl,
        originalPath: savedOriginalPath,
        generationType: referenceImage ? "image-to-image" : "text-to-image",
        sessionId,
        createdAt: new Date().toISOString(),
      };
      setImages((prev) => [newImg, ...prev.filter((image) => image.id !== imageId)]);
      if (referenceImage) {
        setReferenceImage({ name: `Edited version of ${referenceImage.name}`, size: referenceImage.size, dataUrl: imageUrl });
      }

      try {
        if (convId) {
          await storage.saveMessage(convId, {
            id: crypto.randomUUID(),
            role: "user",
            content: cleanedPrompt,
            type: "text",
            mode: "image",
            timestamp: Date.now(),
          });
          await storage.saveMessage(convId, {
            id: imageId,
            role: "assistant",
            content: cleanedPrompt,
            type: "image",
            mode: "image",
            imageUrl: imagePath ? toImageStorageReference(imagePath) : imageUrl,
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
      const friendlyMessage = e instanceof Error && e.message
        ? e.message
        : "Image generation failed. Please try again.";
      toast.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100">
      <SeoHead
        title="Image Studio – ChitChatGen"
        description="Create and explore AI-generated images in ChitChatGen Image Studio."
        path="/image"
      />
      <div className="noise-overlay" />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07101c]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="Back to chat" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300"><ImageIcon size={17} /></span>
            <span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">CHITCHATGEN</span>
              <span className="block text-sm font-semibold text-slate-100">Image Studio</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-200 sm:inline-flex">{currentModel.provider === "nvidia" ? "NVIDIA models" : "Hugging Face model"}</span>
            <Link to="/" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:text-white">Back to chat</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1800px] gap-6 px-4 py-6 pb-28 sm:px-6 lg:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200"><Sparkles size={12} /> Create</div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">Make an image</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Describe what you want to see. Choose a model, then create and save it to your chat history.</p>
          </div>

          <section aria-labelledby="image-model-heading">
            <div className="mb-2 flex items-center justify-between">
              <h2 id="image-model-heading" className="text-sm font-semibold text-slate-100">Choose a model</h2>
              <span className="text-[11px] text-slate-500">{IMAGE_MODELS.filter((model) => model.availability === "available").length} available</span>
            </div>
            <div className="space-y-2">
              {IMAGE_MODELS.map((model) => {
                const active = model.id === modelId;
                const unavailable = model.availability !== "available";
                return (
                  <button
                    key={model.id}
                    type="button"
                    disabled={unavailable || Boolean(referenceImage && !model.supportsEdit)}
                    onClick={() => selectModel(model.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-white">
                          {model.label}
                          {active && <Check size={13} className="text-cyan-300" />}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-400">{model.description}</span>
                      </span>
                      <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                        {unavailable ? "Review" : model.provider}
                      </span>
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {model.capabilities.map((capability) => (
                        <span key={capability} className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-400">
                          {capability === "text-to-image" ? "Text to image" : "Image editing"}
                        </span>
                      ))}
                      {unavailable && <span className="text-[10px] text-amber-300">{model.licenseNote}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="border-t border-white/10 pt-5" aria-labelledby="image-prompt-heading">
            <label id="image-prompt-heading" htmlFor="image-prompt" className="text-sm font-semibold text-slate-100">Describe your image</label>
            <textarea
              id="image-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void handleGenerate();
              }}
              rows={5}
              placeholder="A glass greenhouse on a rainy rooftop at blue hour, cinematic lighting..."
              disabled={loading}
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#0a1220] px-3 py-3 text-sm leading-relaxed text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-slate-500">Mention the subject, setting, style, lighting, and composition.</p>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              aria-label="Choose an image to edit"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={!currentModel.supportsEdit || loading}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-slate-200 transition hover:border-cyan-400/30 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ImageIcon size={14} />
              {referenceImage ? "Replace reference image" : "Upload image to edit"}
            </button>
            {referenceImage && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <img src={referenceImage.dataUrl} alt="Image selected for editing" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">{referenceImage.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{(referenceImage.size / (1024 * 1024)).toFixed(1)} MB · next edit uses the latest result</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setReferenceImage(null); setOriginalImageUrl(null); }}
                  aria-label="Remove reference image"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
                ><X size={14} /></button>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="image-aspect-ratio" className="text-xs font-medium text-slate-300">Aspect ratio</label>
                <select
                  id="image-aspect-ratio"
                  value={aspectRatio}
                  onChange={(event) => setAspectRatio(event.target.value as ImageAspectRatio)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#0a1220] px-2.5 text-xs text-slate-100"
                >
                  {currentModel.aspectRatios.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
                </select>
              </div>
              {currentModel.supportsSeed && (
                <div className="space-y-1.5">
                  <label htmlFor="image-seed" className="text-xs font-medium text-slate-300">Seed (0 = random)</label>
                  <input
                    id="image-seed"
                    type="number"
                    min={0}
                    max={4294967295}
                    value={seed}
                    onChange={(event) => setSeed(Math.min(4294967295, Math.max(0, Number(event.target.value) || 0)))}
                    className="h-10 w-full rounded-lg border border-white/10 bg-[#0a1220] px-2.5 text-xs text-slate-100"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {loading ? "Creating image..." : referenceImage ? "Apply edit" : "Generate image"}
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500">One image per request · Output: {currentModel.outputFormats.join(", ").toUpperCase()}</p>
          </section>
        </aside>

        <section className="min-w-0" aria-label="Image gallery and examples">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2" role="tablist" aria-label="Studio view">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "create"}
                onClick={() => setActiveTab("create")}
                className={`rounded-lg px-3 py-2 text-sm transition ${activeTab === "create" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
              >Create</button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "gallery"}
                onClick={() => setActiveTab("gallery")}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${activeTab === "gallery" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
              ><Grid2X2 size={14} /> My images <span className="text-xs text-slate-500">{images.length}</span></button>
            </div>
            <p className="text-xs text-slate-500">{activeTab === "gallery" ? "Images saved in your active chat" : "Examples from official model demos"}</p>
          </div>

          {activeTab === "gallery" ? (
            images.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {images.map((image) => (
                  <article key={image.id} className="group overflow-hidden rounded-xl border border-white/10 bg-[#0a1220]">
                    <img src={image.url} alt={image.prompt} className="aspect-square w-full object-cover" />
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-200">{image.prompt}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] text-slate-500">{image.model}</span>
                        <a href={image.url} download={`chitchat-${image.id}.jpg`} aria-label="Download image" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-200"><Download size={14} /></a>
                      </div>
                      <button onClick={() => void continueEditing(image)} className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200">
                        <Wand2 size={12} /> Continue editing
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                <Grid2X2 size={22} className="text-slate-500" />
                <h2 className="mt-3 text-sm font-medium text-white">No saved images in this chat</h2>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">Generate an image in this studio and it will appear here alongside your conversation history.</p>
                <button onClick={() => setActiveTab("create")} className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-cyan-400/30">Create an image</button>
              </div>
            )
          ) : (
            <>
              {originalImageUrl && images.length > 0 && (
                <section className="mt-5" aria-labelledby="image-comparison-heading">
                  <div className="mb-3">
                    <h2 id="image-comparison-heading" className="text-sm font-semibold text-white">Original and latest edit</h2>
                    <p className="mt-1 text-xs text-slate-400">Continue editing to create another version. The original stays unchanged.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <figure className="overflow-hidden rounded-xl border border-white/10 bg-[#0a1220]">
                      <img src={originalImageUrl} alt="Original uploaded image" className="aspect-square w-full object-contain" />
                      <figcaption className="border-t border-white/10 px-3 py-2 text-xs text-slate-400">Original</figcaption>
                    </figure>
                    <figure className="overflow-hidden rounded-xl border border-white/10 bg-[#0a1220]">
                      <img src={images[0].url} alt="Latest edited image" className="aspect-square w-full object-contain" />
                      <figcaption className="border-t border-white/10 px-3 py-2 text-xs text-slate-400">Latest edit</figcaption>
                    </figure>
                  </div>
                </section>
              )}

              {images.length > 0 && (
                <section className="mt-5" aria-labelledby="recent-creations-heading">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 id="recent-creations-heading" className="text-sm font-semibold text-white">Recent creations</h2>
                      <p className="mt-1 text-xs text-slate-500">Saved from your active conversation</p>
                    </div>
                    <button onClick={() => setActiveTab("gallery")} className="text-xs text-cyan-300 hover:text-cyan-200">View all</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {images.slice(0, 3).map((image) => (
                      <article key={image.id} className="group overflow-hidden rounded-xl border border-white/10 bg-[#0a1220]">
                        <img src={image.url} alt={image.prompt} className="aspect-square w-full object-cover" />
                        <div className="p-3">
                          <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">{image.prompt}</p>
                          <button onClick={() => void continueEditing(image)} className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-cyan-300 hover:text-cyan-200">
                            <Wand2 size={11} /> Continue editing
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-6" aria-labelledby="image-demos-heading">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h2 id="image-demos-heading" className="text-sm font-semibold text-white">Explore model examples</h2>
                    <p className="mt-1 text-xs text-slate-400">Official NVIDIA demo images. Select a prompt to try it.</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{IMAGE_MODELS.filter((model) => model.exampleImage && model.availability === "available").length} examples</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {IMAGE_MODELS.filter((model) => model.exampleImage && model.availability === "available").map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => { selectModel(model.id); setPrompt(model.examplePrompt); setActiveTab("create"); }}
                      className="group overflow-hidden rounded-xl border border-white/10 bg-[#0a1220] text-left transition hover:border-cyan-400/30"
                    >
                      <span className="relative block overflow-hidden">
                        <img src={model.exampleImage} alt={`Official ${model.label} model example`} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                        <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/80 px-2 py-1 text-[9px] uppercase tracking-wider text-slate-200">NVIDIA demo</span>
                      </span>
                      <span className="block p-3">
                        <span className="flex items-center justify-between gap-2 text-xs font-medium text-white">
                          {model.label}<ArrowUpRight size={13} className="text-slate-500 group-hover:text-cyan-300" />
                        </span>
                        <span className="mt-1 block line-clamp-2 text-[11px] leading-relaxed text-slate-400">{model.examplePrompt}</span>
                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-300">Try this model <ArrowUpRight size={11} /></span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default ImageGen;
