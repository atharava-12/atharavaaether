export type ActivityStatus = "stable" | "watching" | "at-risk";

export interface ActivityEvent {
  time: string;
  label: string;
  detail: string;
  severity: "info" | "warning" | "critical";
}

export interface ActivitySignal {
  label: string;
  value: string;
  note: string;
}

export interface ActivityStreamSnapshot {
  headline: string;
  status: ActivityStatus;
  events: ActivityEvent[];
  signals: ActivitySignal[];
  actions: string[];
}

interface ActivityStreamOptions {
  issueLoad?: number;
}

export const buildActivityStream = ({ issueLoad = 24 }: ActivityStreamOptions = {}): ActivityStreamSnapshot => {
  const safeIssueLoad = Math.min(100, Math.max(0, issueLoad));
  const status: ActivityStatus = safeIssueLoad >= 70 ? "at-risk" : safeIssueLoad >= 40 ? "watching" : "stable";

  return {
    headline: "Recent product activity shows healthy rollout momentum with moderate monitoring needs.",
    status,
    events: [
      { time: "12m ago", label: "Workspace generation", detail: "AI code assistant completed a new workspace prompt cycle with high completion rate.", severity: "info" },
      { time: "31m ago", label: "Research checks", detail: "Research quality remained stable during the latest prompt bundle validation pass.", severity: "info" },
      { time: "1h ago", label: "Release review", detail: "The launch gate closed without blocker escalation for the current release train.", severity: "warning" },
      { time: "2h ago", label: "Queue drift", detail: "A brief load spike appeared in the workload queue but was absorbed without customer impact.", severity: "warning" },
    ],
    signals: [
      { label: "Prompt throughput", value: "1.8k/hr", note: "steady adoption across chat and workspace flows" },
      { label: "Issue load", value: `${safeIssueLoad}%`, note: "monitoring remains inside the preferred operating band" },
      { label: "Workflow completion", value: "94%", note: "strong execution rate among active programs" },
    ],
    actions: [
      "Keep release checkpoints ahead of each AI rollout window.",
      "Monitor the queue slope before the next major customer growth event.",
      "Review a small backlog of edge cases before the next ops review.",
    ],
  };
};
