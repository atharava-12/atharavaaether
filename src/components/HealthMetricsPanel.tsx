import { useMemo } from "react";
import { Activity, ShieldCheck } from "lucide-react";
import { buildHealthMetrics } from "@/lib/healthMetrics";

const HealthMetricsPanel = () => {
  const metrics = useMemo(() => buildHealthMetrics(), []);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Activity size={14} className="text-primary" />
          Health overview
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
          metrics.riskLevel === "low" ? "bg-emerald-500/10 text-emerald-500" : metrics.riskLevel === "medium" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
        }`}>
          {metrics.riskLevel}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs text-muted-foreground">
        {metrics.summary}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {metrics.cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-background/60 p-3">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{card.label}</div>
            <div className="mt-2 text-xl font-semibold text-foreground">{card.value}</div>
            <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{card.detail}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-background/50 p-3 text-xs text-muted-foreground">
        <ShieldCheck size={14} className="mt-0.5 text-primary" />
        <div>{metrics.providerStatus}</div>
      </div>
    </div>
  );
};

export default HealthMetricsPanel;
