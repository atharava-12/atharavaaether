import { useMemo } from "react";
import { Activity, Radio } from "lucide-react";
import { buildActivityStream } from "@/lib/activityStream";

const ActivityStreamPanel = () => {
  const stream = useMemo(() => buildActivityStream(), []);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Activity size={14} className="text-primary" />
          Activity stream
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
            stream.status === "stable"
              ? "bg-emerald-500/10 text-emerald-500"
              : stream.status === "watching"
                ? "bg-amber-500/10 text-amber-500"
                : "bg-rose-500/10 text-rose-500"
          }`}
        >
          {stream.status}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs text-muted-foreground">
        {stream.headline}
      </div>

      <div className="mt-4 space-y-3">
        {stream.events.map((event) => (
          <div key={`${event.time}-${event.label}`} className="flex gap-3 rounded-xl border border-border bg-background/60 p-3">
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{event.time}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Radio size={11} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{event.label}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{event.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {stream.signals.map((signal) => (
          <div key={signal.label} className="rounded-xl border border-border bg-background/60 p-3">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{signal.label}</div>
            <div className="mt-2 text-lg font-semibold text-foreground">{signal.value}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{signal.note}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Recommended actions</div>
        <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
          {stream.actions.map((action) => (
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

export default ActivityStreamPanel;
