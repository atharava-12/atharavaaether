export type ImageModelId =
  | "flux-2-klein"
  | "sd-3.5-large"
  | "flux-1-schnell"
  | "maisi";

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
    id: "flux-2-klein",
    label: "Flux 2 Klein",
    provider: "hf-fal",
    apiModel: "black-forest-labs/FLUX.2-klein-4B",
    description: "Edit + generate · best quality",
    supportsEdit: true,
  },
  {
    id: "sd-3.5-large",
    label: "Stable Diffusion 3.5 Large",
    provider: "hf-fal",
    apiModel: "stabilityai/stable-diffusion-3.5-large",
    description: "High-fidelity text-to-image",
    supportsEdit: false,
  },
  {
    id: "flux-1-schnell",
    label: "FLUX.1 Schnell",
    provider: "hf-nscale",
    apiModel: "black-forest-labs/FLUX.1-schnell",
    description: "Fastest generation",
    supportsEdit: false,
  },
  {
    id: "maisi",
    label: "MAISI",
    provider: "hf-fal",
    apiModel: "maisi7/lora-trained-xl",
    description: "Stylized SDXL LoRA",
    supportsEdit: false,
  },
];

export const DEFAULT_IMAGE_MODEL_ID: ImageModelId = "flux-2-klein";

export const getImageModel = (id: string | null | undefined): ImageModelConfig =>
  IMAGE_MODELS.find((m) => m.id === id) ??
  IMAGE_MODELS.find((m) => m.id === DEFAULT_IMAGE_MODEL_ID)!;
