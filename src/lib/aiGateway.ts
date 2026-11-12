import { DEFAULT_MODEL_ID, MODELS, getModel, type ModelConfig, type ModelId, type SpeedTier } from "./models";

export type TaskType = "general" | "coding" | "math" | "research" | "writing" | "vision";
export type ProviderId = "nvidia" | "hf" | "openai" | "anthropic" | "google" | "custom";

export interface ModelRouteDecision {
  taskType: TaskType;
  modelId: ModelId;
  fallbackModelId: ModelId;
  provider: ProviderId;
  fallbackProvider: ProviderId;
  reason: string;
  latencyHint: SpeedTier;
}

const TASK_MODEL_MAP: Record<TaskType, ModelId> = {
  general: "nemotron-nano",
  coding: "nemotron-super",
  math: "mistral-large",
  research: "nemotron-super",
  writing: "nemotron-super",
  vision: "mistral-small",
};

export const AI_PROVIDERS = {
  nvidia: {
    label: "NVIDIA",
    description: "Production-ready open-source model gateway for chat and reasoning.",
    status: "server-configured",
    supportsStreaming: true,
  },
  openai: {
    label: "OpenAI",
    description: "Requires a server-side API key and provider adapter.",
    status: "server-config-required",
    supportsStreaming: true,
  },
  anthropic: {
    label: "Anthropic",
    description: "Requires a server-side API key and provider adapter.",
    status: "server-config-required",
    supportsStreaming: true,
  },
  google: {
    label: "Google",
    description: "Requires a server-side Gemini API key and provider adapter.",
    status: "server-config-required",
    supportsStreaming: true,
  },
  custom: {
    label: "Custom",
    description: "Adapter-based integration for additional providers.",
    status: "adapter-ready",
    supportsStreaming: true,
  },
} as const;

const getPromptText = (prompt: string) => prompt.toLowerCase();

export const detectTaskType = (prompt: string): TaskType => {
  const text = getPromptText(prompt);

  if (/(generate|create|draw|render|image|picture|photo|illustration|logo|poster|graphic)/.test(text)) {
    return "vision";
  }

  if (/(solve|equation|integral|derivative|matrix|algebra|proof|statistics|calculate|math|formula)/.test(text)) {
    return "math";
  }

  if (/(research|compare|cite|sources|latest|benchmark|market|report|find out|investigate)/.test(text)) {
    return "research";
  }

  if (/(debug|fix|error|typescript|python|react|hook|function|class|refactor|code review|bug|unit test|api endpoint|implements?|build an app|optimize code)/.test(text)) {
    return "coding";
  }

  if (/(write|draft|email|article|essay|blog|landing page|copy|product description|letter|summary)/.test(text)) {
    return "writing";
  }

  return "general";
};

const getPreferredModel = (taskType: TaskType, requestedModelId?: string | null): ModelConfig => {
  const requested = MODELS.find((model) => model.id === requestedModelId);
  if (requested) {
    return requested;
  }

  return getModel(TASK_MODEL_MAP[taskType]);
};

export const routeModelForPrompt = (
  prompt: string,
  requestedModelId?: string | null,
): ModelRouteDecision => {
  const taskType = detectTaskType(prompt);
  const preferredModel = getPreferredModel(taskType, requestedModelId);
  const fallbackModel = getModel(TASK_MODEL_MAP[taskType]);
  const primaryProvider: ProviderId =
    preferredModel.id === "qwen-3.5" ? "hf" : taskType === "vision" ? "nvidia" : "nvidia";
  const fallbackProvider: ProviderId = preferredModel.id === "qwen-3.5" ? "nvidia" : "nvidia";

  const reasonMap: Record<TaskType, string> = {
    general: "General chat requests can be routed to a fast, low-latency model.",
    coding: "Coding tasks benefit from a model with stronger reasoning and context retention.",
    math: "Mathematical reasoning needs accurate multi-step work and careful token usage.",
    research: "Research tasks need a high-context model to compare information and cite sources.",
    writing: "Writing tasks usually favor a strong reasoning model for structure and tone.",
    vision: "Image tasks should be routed to a provider that supports visual generation flows.",
  };

  return {
    taskType,
    modelId: preferredModel.id,
    fallbackModelId: fallbackModel.id,
    provider: primaryProvider,
    fallbackProvider,
    reason: `${reasonMap[taskType]} Prompt detected as ${taskType}.`,
    latencyHint: preferredModel.tier,
  };
};

export const getRouterSummary = (
  prompt: string,
  requestedModelId?: string | null,
) => {
  const decision = routeModelForPrompt(prompt, requestedModelId);
  return {
    taskType: decision.taskType,
    modelId: decision.modelId,
    provider: decision.provider,
    fallbackProvider: decision.fallbackProvider,
    reason: decision.reason,
    fallbackModelId: decision.fallbackModelId,
    latencyHint: decision.latencyHint,
  };
};

export const getConfiguredProviderSummary = () => Object.entries(AI_PROVIDERS).map(([key, value]) => ({
  provider: key,
  ...value,
}));

export const canUseModelProvider = (provider: ProviderId): boolean => {
  if (provider === "nvidia" || provider === "hf") return true;
  return false;
};

export const ROUTER_DEFAULTS = {
  modelId: DEFAULT_MODEL_ID,
  taskType: "general" as TaskType,
};
