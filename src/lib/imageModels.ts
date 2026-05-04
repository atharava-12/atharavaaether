export type ImageModelId =
  | "flux-1-dev"
  | "flux-1-schnell"
  | "sdxl";

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
    id: "flux-1-dev",
    label: "FLUX.1 Dev",
    provider: "hf-fal",
    apiModel: "black-forest-labs/FLUX.1-dev",
    description: "High quality · text-to-image",
    supportsEdit: false,
  },
  {
    id: "flux-1-schnell",
    label: "FLUX.1 Schnell",
    provider: "hf-fal",
    apiModel: "black-forest-labs/FLUX.1-schnell",
    description: "Fastest generation",
    supportsEdit: false,
  },
  {
    id: "sdxl",
    label: "Stable Diffusion XL",
    provider: "hf-fal",
    apiModel: "stabilityai/stable-diffusion-xl-base-1.0",
    description: "Classic SDXL",
    supportsEdit: false,
  },
];

export const DEFAULT_IMAGE_MODEL_ID: ImageModelId = "flux-1-dev";

export const getImageModel = (id: string | null | undefined): ImageModelConfig =>
  IMAGE_MODELS.find((m) => m.id === id) ??
  IMAGE_MODELS.find((m) => m.id === DEFAULT_IMAGE_MODEL_ID)!;
