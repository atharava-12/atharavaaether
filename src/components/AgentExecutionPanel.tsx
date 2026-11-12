import { useMemo } from "react";
import { CheckCircle2, CircleDashed, PlayCircle } from "lucide-react";
import { buildAgentExecutionState } from "@/lib/agentExecution";

interface AgentExecutionPanelProps {
  task: string;
}

const AgentExecutionPanel = ({ task }: AgentExecutionPanelProps) => {
  const state = useMemo(() => buildAgentExecutionState(task || "Improve the app and verify the build"), [task]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <PlayCircle size={14} className="text-primary" />
          Agent execution
        </div>
        <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {state.mode}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs text-muted-foreground">
        {state.note}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <span>Status</span>
          <span className="text-foreground">{state.status}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${state.progress}%` }} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {state.steps.map((step) => (
          <div key={step.id} className="flex gap-3 rounded-xl border border-border bg-background/60 p-3">
            <div className="pt-0.5">
              {step.status === "active" ? (
                <CircleDashed size={14} className="text-primary" />
              ) : step.status === "done" ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <CircleDashed size={14} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{step.label}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentExecutionPanel;
