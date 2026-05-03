export type ModelId =
  | "qwen-3.5"
  | "nemotron-super"
  | "nemotron-nano"
  | "mistral-large"
  | "mistral-small"
  | "gemma-3n";

export type SpeedTier = "fast" | "balanced" | "powerful";

export interface ModelConfig {
  id: ModelId;
  label: string;
  apiModel: string;
  tier: SpeedTier;
  description: string;
}

export const MODELS: ModelConfig[] = [
  {
    id: "nemotron-nano",
    label: "Nemotron Nano",
    apiModel: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    tier: "fast",
    description: "Fastest responses",
  },
  {
    id: "qwen-3.5",
    label: "Qwen 3.5",
    apiModel: "qwen/qwen3.5-397b-a17b",
    tier: "balanced",
    description: "Balanced reasoning",
  },
  {
    id: "nemotron-super",
    label: "Nemotron Super",
    apiModel: "nvidia/nemotron-3-super-120b-a12b",
    tier: "balanced",
    description: "Deep thinking mode",
  },
  {
    id: "mistral-large",
    label: "Mistral Large 3",
    apiModel: "mistralai/mistral-large-3-675b-instruct-2512",
    tier: "powerful",
    description: "Highest accuracy",
  },
  {
    id: "mistral-small",
    label: "Mistral Small",
    apiModel: "mistralai/mistral-small-4-119b-2603",
    tier: "fast",
    description: "Quick + high reasoning",
  },
  {
    id: "gemma-3n",
    label: "Gemma 3n",
    apiModel: "google/gemma-3n-e4b-it",
    tier: "fast",
    description: "Lightweight & efficient",
  },
];

export const TIER_META: Record<SpeedTier, { icon: string; label: string }> = {
  fast: { icon: "⚡", label: "Fast" },
  balanced: { icon: "⚖️", label: "Balanced" },
  powerful: { icon: "🧠", label: "Powerful" },
};

export const DEFAULT_MODEL_ID: ModelId = "nemotron-super";

export const getModel = (id: string | null | undefined): ModelConfig =>
  MODELS.find((m) => m.id === id) ?? MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!;
