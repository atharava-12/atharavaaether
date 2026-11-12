import { useMemo } from "react";
import { ArrowRight, BrainCircuit, ShieldCheck } from "lucide-react";
import { buildAgentWorkflowPlan } from "@/lib/agentWorkflow";

interface AgentWorkflowPanelProps {
  task: string;
}

const AgentWorkflowPanel = ({ task }: AgentWorkflowPanelProps) => {
  const plan = useMemo(() => buildAgentWorkflowPlan(task || "Improve the app and verify the build"), [task]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <BrainCircuit size={14} className="text-primary" />
          AI agent workflow
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
          plan.riskLevel === "low" ? "bg-emerald-500/10 text-emerald-500" : plan.riskLevel === "medium" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
        }`}>
          {plan.riskLevel}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.summary}</p>

      <div className="mt-4 rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <ShieldCheck size={12} className="text-primary" />
          Objective
        </div>
        <p className="mt-2 leading-relaxed">{plan.objective}</p>
      </div>

      <div className="mt-4 space-y-3">
        {plan.steps.map((step, index) => (
          <div key={step.title} className="flex gap-3 rounded-xl border border-border bg-background/60 p-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{step.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-background/50 p-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <span>Recommended mode</span>
        <span className="inline-flex items-center gap-1 text-foreground">
          {plan.recommendedMode}
          <ArrowRight size={12} className="text-primary" />
        </span>
      </div>
    </div>
  );
};

export default AgentWorkflowPanel;
