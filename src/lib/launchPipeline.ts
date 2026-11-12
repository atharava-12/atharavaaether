export type LaunchStatus = "stable" | "watching" | "at-risk";

export interface PipelineMilestone {
  name: string;
  owner: string;
  completion: string;
  status: "done" | "in-progress" | "queued";
}

export interface LaunchGate {
  label: string;
  detail: string;
  status: "pass" | "monitor" | "hold";
}

export interface LaunchPipelineSnapshot {
  headline: string;
  status: LaunchStatus;
  readiness: number;
  milestones: PipelineMilestone[];
  gates: LaunchGate[];
  actions: string[];
}

interface LaunchPipelineOptions {
  readiness?: number;
}

export const buildLaunchPipelineSnapshot = ({ readiness = 92 }: LaunchPipelineOptions = {}): LaunchPipelineSnapshot => {
  const safeReadiness = Math.min(100, Math.max(0, readiness));
  const status: LaunchStatus = safeReadiness >= 85 ? "stable" : safeReadiness >= 70 ? "watching" : "at-risk";

  return {
    headline: "The product launch pipeline is aligned for a premium AI release cadence.",
    status,
    readiness: safeReadiness,
    milestones: [
      { name: "Experience polish", owner: "Product", completion: "100%", status: "done" },
      { name: "AI routing hardening", owner: "Platform", completion: "96%", status: "in-progress" },
      { name: "Research validation", owner: "Research", completion: "89%", status: "in-progress" },
      { name: "Billing and guardrails", owner: "Finance", completion: "92%", status: "done" },
      { name: "Ops review and launch signoff", owner: "Leadership", completion: "78%", status: "queued" },
    ],
    gates: [
      { label: "Provider restriction check", detail: "NVIDIA + HF remain the production-approved stack.", status: "pass" },
      { label: "Usage and revenue review", detail: "The usage model still sits inside the plan guardrails.", status: "monitor" },
      { label: "Release risk review", detail: "No major blocker remains; monitor queue volume before push.", status: "pass" },
    ],
    actions: [
      "Maintain a final release gate before pushing to broad availability.",
      "Review queue volume during the next high-traffic window.",
      "Lock the backend orchestration roadmap once the current launch passes validation.",
    ],
  };
};
