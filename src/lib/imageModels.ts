export type ImageModelId = "nvidia-flux-2-klein";

export type ImageProvider = "nvidia" | "hf-fal" | "hf-nscale";

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
    id: "nvidia-flux-2-klein",
    label: "NVIDIA Flux 2 Klein",
    provider: "nvidia",
    apiModel: "black-forest-labs/flux.2-klein-4b",
    description: "Fast image generation with NVIDIA Flux.",
    supportsEdit: false,
  },
];

export const DEFAULT_IMAGE_MODEL_ID: ImageModelId = "nvidia-flux-2-klein";

export const getImageModel = (id: string | null | undefined): ImageModelConfig =>
  IMAGE_MODELS.find((m) => m.id === id) ??
  IMAGE_MODELS[0];
