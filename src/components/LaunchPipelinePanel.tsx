import { useMemo } from "react";
import { Rocket, ShieldCheck } from "lucide-react";
import { buildLaunchPipelineSnapshot } from "@/lib/launchPipeline";

const LaunchPipelinePanel = () => {
  const pipeline = useMemo(() => buildLaunchPipelineSnapshot(), []);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Rocket size={14} className="text-primary" />
          Launch pipeline
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
            pipeline.status === "stable"
              ? "bg-emerald-500/10 text-emerald-500"
              : pipeline.status === "watching"
                ? "bg-amber-500/10 text-amber-500"
                : "bg-rose-500/10 text-rose-500"
          }`}
        >
          {pipeline.status}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs text-muted-foreground">
        {pipeline.headline}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Readiness</span>
          <span>{pipeline.readiness}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-secondary">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${pipeline.readiness}%` }} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {pipeline.milestones.map((milestone) => (
          <div key={milestone.name} className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-foreground">{milestone.name}</div>
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{milestone.completion}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{milestone.owner}</span>
              <span>{milestone.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Safety gates</div>
        <div className="mt-2 space-y-2">
          {pipeline.gates.map((gate) => (
            <div key={gate.label} className="flex gap-3 rounded-xl border border-border bg-background/60 p-3">
              <ShieldCheck size={14} className="mt-0.5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">{gate.label}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{gate.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Actions</div>
        <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
          {pipeline.actions.map((action) => (
            <li key={action} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LaunchPipelinePanel;
