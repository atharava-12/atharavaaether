import { useMemo } from "react";
import { BarChart3, ShieldAlert, TriangleAlert } from "lucide-react";
import { buildAdminDashboardSnapshot } from "@/lib/adminDashboard";

const AdminDashboardPanel = () => {
  const snapshot = useMemo(() => buildAdminDashboardSnapshot(), []);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <BarChart3 size={14} className="text-primary" />
          Admin overview
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
            snapshot.status === "stable"
              ? "bg-emerald-500/10 text-emerald-500"
              : snapshot.status === "watching"
                ? "bg-amber-500/10 text-amber-500"
                : "bg-rose-500/10 text-rose-500"
          }`}
        >
          {snapshot.status}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs text-muted-foreground">
        {snapshot.headline}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-background/60 p-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Team health</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{snapshot.teamHealth}%</div>
        </div>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${snapshot.teamHealth}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {snapshot.metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-border bg-background/60 p-3">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{metric.label}</div>
            <div className="mt-2 text-lg font-semibold text-foreground">{metric.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{metric.delta}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {snapshot.alerts.map((alert) => (
          <div key={alert.title} className="flex gap-3 rounded-xl border border-border bg-background/60 p-3">
            {alert.severity === "critical" ? (
              <TriangleAlert size={14} className="mt-0.5 text-rose-500" />
            ) : (
              <ShieldAlert size={14} className="mt-0.5 text-primary" />
            )}
            <div>
              <div className="text-sm font-medium text-foreground">{alert.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{alert.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Action plan</div>
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

export default AdminDashboardPanel;
