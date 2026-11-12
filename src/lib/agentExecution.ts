export type AgentExecutionStatus = "queued" | "running" | "review" | "done";
export type AgentExecutionMode = "guided" | "verification" | "deep-research";

export interface AgentExecutionStep {
  id: string;
  label: string;
  detail: string;
  status: "active" | "done" | "pending";
}

export interface AgentExecutionState {
  id: string;
  task: string;
  mode: AgentExecutionMode;
  status: AgentExecutionStatus;
  progress: number;
  note: string;
  steps: AgentExecutionStep[];
}

const createExecutionSteps = (task: string) => {
  const lowerTask = task.toLowerCase();
  const isResearch = /(research|compare|source|latest|benchmark|market|report)/.test(lowerTask);
  const isVerification = /(verify|test|build|ship|deploy|launch)/.test(lowerTask);

  if (isResearch) {
    return [
      { id: "scope", label: "Scope the research question", detail: "Define the decision, audience, and constraints before gathering evidence.", status: "active" as const },
      { id: "sources", label: "Source review", detail: "Compare the most credible and recent references before drawing a conclusion.", status: "pending" as const },
      { id: "synthesis", label: "Synthesis and comparison", detail: "Map the evidence into clear trade-offs, risks, and recommendations.", status: "pending" as const },
      { id: "verify", label: "Verify conclusions", detail: "Check evidence quality, sources, and any missing assumptions before finalizing.", status: "pending" as const },
    ];
  }

  if (isVerification) {
    return [
      { id: "inspect", label: "Inspect the failing or risky path", detail: "Review the current code path and identify the exact risk or failure condition.", status: "active" as const },
      { id: "fix", label: "Implement the fix", detail: "Apply the smallest root-cause change that preserves adjacent behavior.", status: "pending" as const },
      { id: "verify", label: "Verify with checks", detail: "Run the relevant tests and build validation for the changed behavior.", status: "pending" as const },
      { id: "review", label: "Review release readiness", detail: "Check that the change is stable, documented, and ready for the next task.", status: "pending" as const },
    ];
  }

  return [
    { id: "clarify", label: "Clarify the goal", detail: "Turn the request into a measurable objective and acceptance criteria.", status: "active" as const },
    { id: "inspect", label: "Inspect the app surface", detail: "Find the exact files, routes, and state that need to be updated.", status: "pending" as const },
    { id: "implement", label: "Implement the change", detail: "Patch the behavior in a narrow, reversible way that fits the current architecture.", status: "pending" as const },
    { id: "verify", label: "Verify the result", detail: "Run the relevant checks and confirm the user-facing behavior is stable.", status: "pending" as const },
  ];
};

export const buildAgentExecutionState = (task: string): AgentExecutionState => {
  const lowerTask = task.toLowerCase();
  const isResearch = /(research|compare|source|latest|benchmark|market|report)/.test(lowerTask);
  const isVerification = /(verify|test|build|ship|deploy|launch)/.test(lowerTask);
  const mode: AgentExecutionMode = isResearch ? "deep-research" : isVerification ? "verification" : "guided";
  const steps = createExecutionSteps(task);

  return {
    id: `exec-${task.slice(0, 12).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "task"}`,
    task,
    mode,
    status: "queued",
    progress: isResearch ? 32 : isVerification ? 28 : 24,
    note: isResearch
      ? "Research mode moves through evidence gathering, source review, and synthesis before recommendations are finalized."
      : "The task is queued for a focused iteration loop: inspect, patch, verify, and review.",
    steps,
  };
};
