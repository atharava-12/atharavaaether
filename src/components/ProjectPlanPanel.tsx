import { useMemo } from "react";
import { CheckCheck, ListTodo, ShieldAlert } from "lucide-react";
import { buildProjectPlan } from "@/lib/projectPlan";

interface ProjectPlanPanelProps {
  task: string;
}

const ProjectPlanPanel = ({ task }: ProjectPlanPanelProps) => {
  const plan = useMemo(() => buildProjectPlan(task || "Ship a premium AI chat dashboard with research and workspace tools"), [task]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ListTodo size={14} className="text-primary" />
          Project plan
        </div>
        <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          focus
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs text-muted-foreground">
        {plan.focus}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <CheckCheck size={12} className="text-primary" />
          Milestones
        </div>
        <div className="space-y-2">
          {plan.milestones.map((milestone) => (
            <div key={milestone.name} className="rounded-xl border border-border bg-background/60 p-3">
              <div className="text-sm font-medium text-foreground">{milestone.name}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{milestone.outcome}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <ShieldAlert size={12} className="text-primary" />
          Task breakdown
        </div>
        <div className="space-y-2">
          {plan.tasks.map((taskItem) => (
            <div key={taskItem.title} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3">
              <div>
                <div className="text-sm font-medium text-foreground">{taskItem.title}</div>
                <div className="text-[11px] text-muted-foreground">{taskItem.owner}</div>
              </div>
              <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {taskItem.duration}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground">
        {plan.riskSummary}
      </div>
    </div>
  );
};

export default ProjectPlanPanel;
