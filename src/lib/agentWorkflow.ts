export type AgentRiskLevel = "low" | "medium" | "high";
export type AgentRecommendedMode = "guided" | "verification" | "deep-research";

export interface AgentWorkflowStep {
  title: string;
  detail: string;
}

export interface AgentWorkflowPlan {
  summary: string;
  objective: string;
  steps: AgentWorkflowStep[];
  riskLevel: AgentRiskLevel;
  recommendedMode: AgentRecommendedMode;
}

const getTaskSignals = (task: string) => {
  const lowerTask = task.toLowerCase();
  return {
    isResearch: /(research|compare|benchmark|latest|source|market|report|investigate)/.test(lowerTask),
    isBugFix: /(debug|fix|error|broken|issue|bug|fail|crash)/.test(lowerTask),
    isBuild: /(build|verify|test|ship|deploy|launch)/.test(lowerTask),
    mentionsChat: /chat|assistant|message|stream/.test(lowerTask),
  };
};

export const buildAgentWorkflowPlan = (task: string): AgentWorkflowPlan => {
  const signals = getTaskSignals(task);

  if (signals.isResearch) {
    return {
      summary: "Research-first workflow for comparing evidence, validating sources, and summarizing actionable findings.",
      objective: "Gather and compare the latest evidence before making product decisions.",
      steps: [
        { title: "Inspect the evidence surface", detail: "Identify the exact question, time horizon, and source constraints before searching." },
        { title: "Compare relevant sources", detail: "Gather the most credible references and compare claims, versions, and trade-offs." },
        { title: "Validate assumptions", detail: "Check whether the recommendation can be supported by current product requirements and app constraints." },
        { title: "Summarize and recommend", detail: "Turn the comparison into a concise recommendation with source-aware caveats." },
      ],
      riskLevel: "medium",
      recommendedMode: "deep-research",
    };
  }

  if (signals.isBugFix) {
    return {
      summary: `Debugging workflow focused on the root cause, a targeted fix, and a clean verification pass for ${signals.mentionsChat ? "chat" : "the feature"}.`,
      objective: "Find the breakage, fix the root cause, and confirm the behavior with a focused check.",
      steps: [
        { title: "Diagnose the failure path", detail: "Trace the user flow and confirm whether the error is caused by state, config, or provider routing." },
        { title: "Patch the root cause", detail: "Apply the smallest fix that resolves the actual source of the issue without widening scope." },
        { title: "Verify the change", detail: "Run the relevant tests and confirm the fix does not regress adjacent behavior." },
        { title: "Document the outcome", detail: "Record the fix, risk, and follow-up considerations for the next iteration." },
      ],
      riskLevel: signals.isBuild ? "high" : "medium",
      recommendedMode: "verification",
    };
  }

  return {
    summary: "Product iteration workflow for turning a request into a shipped improvement with tight validation.",
    objective: "Scope the task, implement the minimal change, and confirm the app remains stable.",
    steps: [
      { title: "Clarify the user need", detail: "Turn the request into a concrete deliverable, constraints, and acceptance criteria." },
      { title: "Inspect the change surface", detail: "Find the least-coupled files and data flow that need to be updated." },
      { title: "Implement the feature", detail: "Add the feature while preserving existing patterns and the supported provider setup." },
      { title: "Verify and ship", detail: "Run the relevant checks and summarize what changed for the next handoff." },
    ],
    riskLevel: "low",
    recommendedMode: "guided",
  };
};
