export type ImageModelId =
  | "gemini-flash-image"
  | "gemini-flash-image-pro"
  | "gemini-pro-image";

export type ImageProvider = "lovable" | "nvidia" | "hf-fal" | "hf-nscale";

export interface ImageModelConfig {
  id: ImageModelId;
  label: string;
  provider: ImageProvider;
  apiModel: string;
  description: string;
  supportsEdit: boolean;
}

export const IMAGE_MODELS: ImageModelConfig[] = [
  {
    id: "gemini-flash-image",
    label: "Nano Banana",
    provider: "lovable",
    apiModel: "google/gemini-2.5-flash-image",
    description: "Fast image generation and editing",
    supportsEdit: true,
  },
  {
    id: "gemini-flash-image-pro",
    label: "Nano Banana 2",
    provider: "lovable",
    apiModel: "google/gemini-3.1-flash-image-preview",
    description: "Fast pro-quality generation",
    supportsEdit: true,
  },
  {
    id: "gemini-pro-image",
    label: "Nano Banana Pro",
    provider: "lovable",
    apiModel: "google/gemini-3-pro-image-preview",
    description: "Highest quality generation",
    supportsEdit: true,
  },
];

export const DEFAULT_IMAGE_MODEL_ID: ImageModelId = "gemini-flash-image";

export const getImageModel = (id: string | null | undefined): ImageModelConfig =>
  IMAGE_MODELS.find((m) => m.id === id) ??
  IMAGE_MODELS.find((m) => m.id === DEFAULT_IMAGE_MODEL_ID)!;
