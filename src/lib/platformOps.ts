export type PlatformHealth = "stable" | "watching" | "at-risk";

export interface PlatformMetric {
  label: string;
  value: string;
  delta: string;
}

export interface PlatformWorkflowItem {
  title: string;
  owner: string;
  status: "ready" | "in-progress" | "blocked";
  priority: "low" | "medium" | "high";
}

export interface PlatformOpsSnapshot {
  headline: string;
  readiness: number;
  health: PlatformHealth;
  metrics: PlatformMetric[];
  workflow: PlatformWorkflowItem[];
  actions: string[];
}

interface PlatformOpsOptions {
  readiness?: number;
}

export const buildPlatformOpsSnapshot = ({ readiness = 92 }: PlatformOpsOptions = {}): PlatformOpsSnapshot => {
  const safeReadiness = Math.min(100, Math.max(0, readiness));

  const health: PlatformHealth = safeReadiness >= 90 ? "stable" : safeReadiness >= 75 ? "watching" : "at-risk";

  return {
    headline: "Platform stability is strong across chat, research, and workspaces.",
    readiness: safeReadiness,
    health,
    metrics: [
      { label: "Chat reliability", value: "99.9%", delta: "+0.2%" },
      { label: "Routing health", value: "94%", delta: "+3 pts" },
      { label: "Research quality", value: "88%", delta: "+5 pts" },
      { label: "Workspace automation", value: "91%", delta: "+4 pts" },
      { label: "Release confidence", value: "96%", delta: "+2 pts" },
    ],
    workflow: [
      { title: "Production model routing", owner: "AI ops", status: "ready", priority: "high" },
      { title: "Research validation flow", owner: "Research", status: "in-progress", priority: "medium" },
      { title: "Workspace memory polish", owner: "Product", status: "ready", priority: "medium" },
      { title: "Billing guardrails", owner: "Finance", status: "ready", priority: "low" },
    ],
    actions: [
      "Keep provider restrictions on NVIDIA + HF for production safety.",
      "Review workflow queue before the next release candiate.",
      "Monitor usage spikes and prompt quality in the launch dashboard.",
      "Expand the backend automation layer once analytics confirm demand.",
    ],
  };
};
