export interface ProjectPlanTask {
  title: string;
  owner: string;
  duration: string;
}

export interface ProjectMilestone {
  name: string;
  outcome: string;
}

export interface ProjectPlan {
  focus: string;
  milestones: ProjectMilestone[];
  tasks: ProjectPlanTask[];
  riskSummary: string;
}

const buildBasePlan = (task: string): ProjectPlan => {
  const lowerTask = task.toLowerCase();
  const isBugFix = /(debug|fix|error|issue|broken|bug|crash|fail)/.test(lowerTask);

  if (isBugFix) {
    return {
      focus: "fix the root cause and verify stability before expanding scope",
      milestones: [
        { name: "Diagnosis", outcome: "Confirm the failure path and isolate the root cause." },
        { name: "Repair", outcome: "Apply the minimal fix and validate the targeted behavior." },
        { name: "Hardening", outcome: "Confirm the app still builds and retains adjacent functionality." },
      ],
      tasks: [
        { title: "Diagnose the failure path", owner: "AI product engineer", duration: "1 checkpoint" },
        { title: "Patch the root cause", owner: "AI product engineer", duration: "1 checkpoint" },
        { title: "Verify with tests and build", owner: "QA + engineering", duration: "1 checkpoint" },
      ],
      riskSummary: "Primary risk is regression in adjacent flows; mitigate by verifying precise behavior and keeping scope tight.",
    };
  }

  return {
    focus: "deliver a polished product experience and ship the key user workflows",
    milestones: [
      { name: "Discovery", outcome: "Clarify the product experience, scope, and user value drivers." },
      { name: "Core build", outcome: "Ship the major UX improvements and functional workflows in the app." },
      { name: "Quality pass", outcome: "Verify the build, reduce regressions, and polish the final experience." },
    ],
    tasks: [
      { title: "Define the product brief and requirements", owner: "Product + engineering", duration: "1 phase" },
      { title: "Build the core experience", owner: "Design + engineering", duration: "2 phases" },
      { title: "Validate quality and deployment readiness", owner: "Engineering + QA", duration: "1 phase" },
    ],
    riskSummary: "Key risk is scope creep; limit the route to core user value and maintain a disciplined verification pass.",
  };
};

export const buildProjectPlan = (task: string): ProjectPlan => {
  const plan = buildBasePlan(task);
  const lowerTask = task.toLowerCase();

  if (/(research|compare|benchmark|source|latest)/.test(lowerTask)) {
    plan.focus = "collect evidence, compare alternatives, and package the conclusion with source-aware guardrails";
    plan.milestones = [
      { name: "Research brief", outcome: "Set the decision criteria, sources, and areas of uncertainty." },
      { name: "Evidence review", outcome: "Compare reliable references and weigh trade-offs or gaps." },
      { name: "Recommendation", outcome: "Turn the findings into a concise decision brief with confidence notes." },
    ];
    plan.tasks = [
      { title: "Define the research brief", owner: "AI product engineer", duration: "1 phase" },
      { title: "Gather and compare sources", owner: "Research workflow", duration: "1-2 phases" },
      { title: "Summarize recommendations", owner: "AI product engineer", duration: "1 phase" },
    ];
  }

  return plan;
};
