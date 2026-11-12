import { useMemo } from "react";
import { CreditCard, Sparkles } from "lucide-react";
import { buildUsageSnapshot } from "@/lib/billing";

const UsagePanel = () => {
  const snapshot = useMemo(() => buildUsageSnapshot({ used: 18, limit: 30, plan: "Pro" }), []);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CreditCard size={14} className="text-primary" />
          Usage and billing
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
          snapshot.status === "over-limit" ? "bg-rose-500/10 text-rose-500" : snapshot.status === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
        }`}>
          {snapshot.status}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs text-muted-foreground">
        {snapshot.summary}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-background/50 p-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <span>{snapshot.plan} plan</span>
          <span>{snapshot.used}/{snapshot.limit} credits</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${snapshot.usedPercent}%` }} />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{Math.round(snapshot.usedPercent)}% used</div>
      </div>

      <div className="mt-4 space-y-2">
        {snapshot.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
            <Sparkles size={12} className="text-primary" />
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsagePanel;
