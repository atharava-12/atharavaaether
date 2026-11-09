export type ImageModelId =
  | "nvidia-flux-2-klein"
  | "nvidia-flux-3-klein"
  | "nvidia-flux-1-kontext-dev"
  | "nvidia-flux-1-schnell"
  | "nvidia-flux-1-dev"
  | "awen-image"
  | "qwen-image";

export type ImageProvider = "nvidia" | "hf";
export type ImageCapability = "text-to-image" | "image-to-image";
export type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface ImageModelConfig {
  id: ImageModelId;
  label: string;
  provider: ImageProvider;
  apiModel: string;
  description: string;
  supportsEdit: boolean;
  capabilities: ImageCapability[];
  aspectRatios: ImageAspectRatio[];
  outputFormats: Array<"jpeg" | "png">;
  steps?: number;
  supportsSeed: boolean;
  availability: "available" | "license-review";
  licenseNote?: string;
  examplePrompt: string;
  exampleImage?: string;
}

const COMMON_RATIOS: ImageAspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export const IMAGE_MODELS: ImageModelConfig[] = [
  {
    id: "nvidia-flux-2-klein",
    label: "NVIDIA Flux 2 Klein",
    provider: "nvidia",
    apiModel: "black-forest-labs/flux.2-klein-4b",
    description: "Fast text-to-image generation and natural-language image editing.",
    supportsEdit: true,
    capabilities: ["text-to-image", "image-to-image"],
    aspectRatios: COMMON_RATIOS,
    outputFormats: ["jpeg"],
    steps: 4,
    supportsSeed: true,
    availability: "available",
    examplePrompt: "A macro wildlife photograph of a green frog in a rainforest pond",
    exampleImage: "https://assets.ngc.nvidia.com/products/api-catalog/flux_2-klein-4b/input0.jpg",
  },
  {
    id: "nvidia-flux-3-klein",
    label: "NVIDIA FLUX.3 Image Klein",
    provider: "nvidia",
    apiModel: "black-forest-labs/flux.3-image-klein",
    description: "Text-to-image generation and single-reference image editing.",
    supportsEdit: true,
    capabilities: ["text-to-image", "image-to-image"],
    aspectRatios: COMMON_RATIOS,
    outputFormats: ["jpeg"],
    steps: 50,
    supportsSeed: true,
    availability: "available",
    examplePrompt: "A stained glass owl in front of a full moon, jewel-toned glass",
    exampleImage: "https://assets.ngc.nvidia.com/products/api-catalog/flux_3-image-klein/input2.jpg",
  },
  {
    id: "nvidia-flux-1-kontext-dev",
    label: "FLUX.1 Kontext Dev",
    provider: "nvidia",
    apiModel: "black-forest-labs/flux.1-kontext-dev",
    description: "Image editing and style transfer. Non-commercial license; disabled pending review.",
    supportsEdit: true,
    capabilities: ["text-to-image", "image-to-image"],
    aspectRatios: COMMON_RATIOS,
    outputFormats: ["jpeg"],
    steps: 30,
    supportsSeed: true,
    availability: "license-review",
    licenseNote: "The published FLUX.1 Kontext Dev terms restrict commercial use.",
    examplePrompt: "Transform this scene into a clean Bauhaus poster",
    exampleImage: "https://assets.ngc.nvidia.com/products/api-catalog/flux_1-kontext-dev/input3.jpeg",
  },
  {
    id: "nvidia-flux-1-schnell",
    label: "NVIDIA Flux 1 Schnell",
    provider: "nvidia",
    apiModel: "black-forest-labs/flux.1-schnell",
    description: "A faster NVIDIA Flux variant for quick image generation.",
    supportsEdit: false,
    capabilities: ["text-to-image"],
    aspectRatios: ["1:1"],
    outputFormats: ["jpeg"],
    steps: 4,
    supportsSeed: true,
    availability: "available",
    examplePrompt: "A tiny glass greenhouse on a rainy city rooftop",
  },
  {
    id: "nvidia-flux-1-dev",
    label: "NVIDIA Flux 1 Dev",
    provider: "nvidia",
    apiModel: "black-forest-labs/flux.1-dev",
    description: "Detailed text-to-image generation. Non-commercial license; disabled pending review.",
    supportsEdit: false,
    capabilities: ["text-to-image"],
    aspectRatios: ["1:1"],
    outputFormats: ["jpeg"],
    steps: 5,
    supportsSeed: true,
    availability: "license-review",
    licenseNote: "The published FLUX.1 Dev terms restrict commercial use.",
    examplePrompt: "A cinematic still life of a ceramic teapot in morning light",
  },
  {
    id: "awen-image",
    label: "Awen Image",
    provider: "hf",
    apiModel: "awen/awen-image",
    description: "Text-to-image model (Awen) via Hugging Face inference.",
    supportsEdit: false,
    capabilities: ["text-to-image"],
    aspectRatios: ["1:1"],
    outputFormats: ["png"],
    supportsSeed: false,
    availability: "available",
    examplePrompt: "A small mountain observatory beneath a clear night sky",
  },
  {
    id: "qwen-image",
    label: "Qwen Image",
    provider: "hf",
    apiModel: "qwen/qwen-image",
    description: "Qwen-Image text-to-image foundation model.",
    supportsEdit: false,
    capabilities: ["text-to-image"],
    aspectRatios: ["1:1"],
    outputFormats: ["png"],
    supportsSeed: false,
    availability: "available",
    examplePrompt: "A modern illustrated recipe card for a citrus tart",
  },
];

export const DEFAULT_IMAGE_MODEL_ID: ImageModelId = "nvidia-flux-2-klein";

export const IMAGE_DIMENSIONS: Record<ImageAspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1568, height: 880 },
  "9:16": { width: 880, height: 1568 },
  "4:3": { width: 1184, height: 880 },
  "3:4": { width: 880, height: 1184 },
};

export const getImageDimensions = (ratio: ImageAspectRatio) => IMAGE_DIMENSIONS[ratio];

export const resolveImageModel = (provider: string | undefined, requestedModel?: string | null): string => {
  const candidate = IMAGE_MODELS.find((model) =>
    model.provider === provider && model.apiModel === requestedModel && model.availability === "available"
  );
  if (candidate) return candidate.apiModel;
  return getImageModel(DEFAULT_IMAGE_MODEL_ID).apiModel;
};

export const getImageModel = (id: string | null | undefined): ImageModelConfig =>
  IMAGE_MODELS.find((m) => m.id === id) ?? IMAGE_MODELS[0];
