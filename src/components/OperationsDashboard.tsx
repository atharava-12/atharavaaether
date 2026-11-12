import { useMemo } from "react";
import { Activity, ArrowUpRight, ShieldCheck } from "lucide-react";
import { buildPlatformOpsSnapshot } from "@/lib/platformOps";

const OperationsDashboard = () => {
  const snapshot = useMemo(() => buildPlatformOpsSnapshot(), []);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Activity size={14} className="text-primary" />
          Platform operations
        </div>
        <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {snapshot.health}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Readiness</span>
          <span>{snapshot.readiness}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${snapshot.readiness}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{snapshot.headline}</p>

      <div className="mt-4 space-y-3">
        {snapshot.metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-2.5 py-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{metric.value}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
              <ArrowUpRight size={11} />
              {metric.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Workflow queue</p>
        <div className="mt-2 space-y-2">
          {snapshot.workflow.map((item) => (
            <div key={item.title} className="flex items-start justify-between gap-3 rounded-lg border border-border p-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{item.title}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{item.owner}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ShieldCheck size={11} className={item.status === "blocked" ? "text-amber-500" : "text-emerald-500"} />
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Next actions</p>
        <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
          {snapshot.actions.map((action) => (
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

export default OperationsDashboard;
