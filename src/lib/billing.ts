export type BillingPlan = "Free" | "Pro" | "Business";
export type BillingStatus = "healthy" | "warning" | "over-limit";

export interface UsageSnapshot {
  plan: BillingPlan;
  used: number;
  limit: number;
  usedPercent: number;
  status: BillingStatus;
  summary: string;
  features: string[];
}

export const buildUsageSnapshot = ({ used, limit, plan }: { used: number; limit: number; plan: BillingPlan }): UsageSnapshot => {
  const usedPercent = Math.min(Math.max((used / limit) * 100, 0), 100);
  const status: BillingStatus = used >= limit ? "over-limit" : usedPercent >= 75 ? "warning" : "healthy";

  const summary =
    status === "over-limit"
      ? "usage is at or beyond the active plan limit and should be reviewed before the next billing cycle."
      : status === "warning"
        ? "usage is trending high; plan limits are nearing their threshold."
        : "usage is within an acceptable range for the active plan.";

  return {
    plan,
    used,
    limit,
    usedPercent,
    status,
    summary,
    features: [
      "Unlimited chat history",
      "Priority response routing",
      "Workspace and research tools",
    ],
  };
};
