import { useEffect, useState, useLayoutEffect } from "react";
import { X, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";

interface Step {
  selector: string;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  { selector: '[data-tour="model"]', title: "Switch AI Models", desc: "Tap here to pick between fast, balanced, or powerful models." },
  { selector: '[data-tour="new-chat"]', title: "Start a New Chat", desc: "Begin a fresh conversation anytime." },
  { selector: '[data-tour="settings"]', title: "Settings", desc: "Manage your account, theme, and preferences." },
  { selector: '[data-tour="input"]', title: "Ask Anything", desc: "Type your question or use voice input to chat with AI." },
  { selector: '[data-tour="nav-image"]', title: "Image Generation", desc: "Create or edit images with AI. They'll be saved to your chat memory." },
  { selector: '[data-tour="nav-memory"]', title: "Memory", desc: "All your past chats and generated images live here." },
];

const TOUR_KEY = "chitchat:tourSeen";

export const startFeatureTour = () => {
  localStorage.removeItem(TOUR_KEY);
  window.dispatchEvent(new CustomEvent("chitchat:start-tour"));
};

const FeatureTour = () => {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const { user } = useAuth();
  const { isGuest } = useGuestMode();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const force = params.get("tour") === "1";
    // Only auto-show tour for signed-in users, not guests
    if (force || (user && !isGuest && !localStorage.getItem(TOUR_KEY))) {
      // Slight delay so target elements are mounted
      setTimeout(() => setActive(true), 400);
      if (force) {
        params.delete("tour");
        const q = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (q ? `?${q}` : ""));
      }
    }
    const handler = () => { setStep(0); setActive(true); };
    window.addEventListener("chitchat:start-tour", handler);
    return () => window.removeEventListener("chitchat:start-tour", handler);
  }, [user, isGuest]);

  useLayoutEffect(() => {
    if (!active) return;
    const updateRect = () => {
      const el = document.querySelector(STEPS[step].selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    updateRect();
    const t = setTimeout(updateRect, 250);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [active, step]);

  const finish = () => {
    localStorage.setItem(TOUR_KEY, "1");
    setActive(false);
  };
  const next = () => {
    if (step >= STEPS.length - 1) finish();
    else setStep(step + 1);
  };

  if (!active) return null;

  const padding = 8;
  const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  const r = rect ? Math.max(rect.width, rect.height) / 2 + padding : 0;

  // Tooltip position: below if target is in upper half, else above
  const placeBelow = cy < window.innerHeight / 2;
  const tooltipTop = rect
    ? placeBelow
      ? Math.min(cy + r + 16, window.innerHeight - 200)
      : Math.max(cy - r - 16 - 160, 16)
    : window.innerHeight / 2 - 80;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* SVG mask creating spotlight */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && <circle cx={cx} cy={cy} r={r} fill="black" />}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#tour-mask)"
        />
        {rect && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Click-catcher to advance */}
      <div className="absolute inset-0" onClick={next} />

      {/* Tooltip card */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[min(320px,90vw)] rounded-xl border border-primary/40 bg-card shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
        style={{ top: tooltipTop }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary">
            {step + 1} / {STEPS.length}
          </span>
          <button onClick={finish} aria-label="Close feature tour" className="text-muted-foreground hover:text-foreground -mt-1 -mr-1">
            <X size={14} />
          </button>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{current.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{current.desc}</p>
        <div className="flex justify-between items-center">
          <button onClick={finish} className="text-[11px] text-muted-foreground hover:text-foreground">
            Skip tour
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {step >= STEPS.length - 1 ? "Done" : "Next"}
            {step < STEPS.length - 1 && <ArrowRight size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureTour;
