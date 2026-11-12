import { useMemo } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { buildReleaseChecklist } from "@/lib/releaseChecklist";

interface ReleaseChecklistPanelProps {
  task: string;
}

const ReleaseChecklistPanel = ({ task }: ReleaseChecklistPanelProps) => {
  const checklist = useMemo(() => buildReleaseChecklist(task || "Ship a premium AI platform launch"), [task]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ShieldCheck size={14} className="text-primary" />
          Release checklist
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
          checklist.priority === "high" ? "bg-rose-500/10 text-rose-500" : checklist.priority === "medium" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
        }`}>
          {checklist.priority}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs text-muted-foreground">
        {checklist.riskSummary}
      </div>

      <div className="mt-4 space-y-3">
        {checklist.gates.map((gate) => (
          <div key={gate.title} className="flex gap-3 rounded-xl border border-border bg-background/60 p-3">
            <CheckCircle2 size={14} className="mt-0.5 text-primary" />
            <div>
              <div className="text-sm font-medium text-foreground">{gate.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{gate.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReleaseChecklistPanel;
