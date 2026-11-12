export type ReleasePriority = "low" | "medium" | "high";

export interface ReleaseGate {
  title: string;
  detail: string;
}

export interface ReleaseChecklist {
  priority: ReleasePriority;
  riskSummary: string;
  gates: ReleaseGate[];
}

export const buildReleaseChecklist = (task: string): ReleaseChecklist => {
  const lowerTask = task.toLowerCase();
  const isBugFix = /(bug|fix|error|issue|broken|crash|fail|streaming)/.test(lowerTask);

  const gates: ReleaseGate[] = [
    {
      title: isBugFix ? "Verify stability" : "Validate build health",
      detail: isBugFix
        ? "Confirm the repaired flow works under real usage and does not regress adjacent behavior."
        : "Ensure the app still compiles cleanly and core user flows remain intact for launch.",
    },
    {
      title: "Review security and config",
      detail: "Check required environment configuration, provider constraints, and whether secrets remain server-side only.",
    },
    {
      title: "Confirm UX quality",
      detail: "Review polish, empty states, navigation clarity, and user-facing copy before sign-off.",
    },
    {
      title: "Prepare rollout notes",
      detail: "Document what changed, what was verified, and any caveats for the next release or handoff.",
    },
  ];

  return {
    priority: isBugFix ? "high" : "medium",
    riskSummary: isBugFix
      ? "Primary risk is partial fix quality; keep the release narrow and verify the real behavior before broadening scope."
      : "Primary risk is launch polish and regression drift; verify health across key flows before release.",
    gates,
  };
};
