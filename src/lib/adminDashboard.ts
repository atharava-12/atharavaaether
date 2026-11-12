export type AdminStatus = "stable" | "watching" | "at-risk";

export interface AdminMetric {
  label: string;
  value: string;
  delta: string;
}

export interface AdminAlert {
  title: string;
  severity: "info" | "warning" | "critical";
  detail: string;
}

export interface AdminDashboardSnapshot {
  headline: string;
  status: AdminStatus;
  teamHealth: number;
  metrics: AdminMetric[];
  alerts: AdminAlert[];
  actions: string[];
}

interface AdminDashboardOptions {
  teamHealth?: number;
}

export const buildAdminDashboardSnapshot = ({ teamHealth = 88 }: AdminDashboardOptions = {}): AdminDashboardSnapshot => {
  const safeHealth = Math.min(100, Math.max(0, teamHealth));
  const status: AdminStatus = safeHealth >= 85 ? "stable" : safeHealth >= 70 ? "watching" : "at-risk";

  return {
    headline: "AI operations are healthy across the product, release, and support lifecycle.",
    status,
    teamHealth: safeHealth,
    metrics: [
      { label: "Active projects", value: "14", delta: "+2 this week" },
      { label: "User retention", value: "87%", delta: "+4 pts" },
      { label: "Launch confidence", value: "94%", delta: "+6 pts" },
      { label: "Response quality", value: "91%", delta: "+3 pts" },
      { label: "Issue backlog", value: "7", delta: "-3 from last cycle" },
    ],
    alerts: [
      {
        title: "Provider policy remains locked to NVIDIA + HF",
        severity: "info",
        detail: "This keeps production routing aligned with the approved environment and reduces runtime drift.",
      },
      {
        title: "Usage is rising in the workspace and research surfaces",
        severity: "warning",
        detail: "Support should monitor prompt volume and release readiness before the next growth burst.",
      },
    ],
    actions: [
      "Keep release review gates in front of all AI feature rollouts.",
      "Monitor prompt depth and cost spikes before the next major launch window.",
      "Expand backend orchestration only after analytics confirm clear demand.",
    ],
  };
};
