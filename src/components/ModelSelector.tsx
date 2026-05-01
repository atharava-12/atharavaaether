import { useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MODELS, TIER_META, type ModelId, getModel } from "@/lib/models";

interface ModelSelectorProps {
  modelId: ModelId;
  onChange: (id: ModelId) => void;
}

const ModelSelector = ({ modelId, onChange }: ModelSelectorProps) => {
  const [switching, setSwitching] = useState(false);
  const current = getModel(modelId);
  const tier = TIER_META[current.tier];

  const handleSelect = (id: ModelId) => {
    if (id === modelId) return;
    setSwitching(true);
    onChange(id);
    setTimeout(() => setSwitching(false), 350);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-card hover:bg-secondary text-xs font-medium text-foreground transition-colors max-w-[180px]">
              {switching ? (
                <Loader2 size={11} className="animate-spin text-primary" />
              ) : (
                <span className="text-[11px]">{tier.icon}</span>
              )}
              <span className="truncate">{current.label}</span>
              <ChevronDown size={11} className="text-muted-foreground shrink-0" />
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[11px]">
            Switch models for speed or better answers
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-64 bg-popover border-border">
          <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Select Model
          </div>
          {MODELS.map((m) => {
            const t = TIER_META[m.tier];
            const active = m.id === modelId;
            return (
              <DropdownMenuItem
                key={m.id}
                onClick={() => handleSelect(m.id)}
                className="flex items-start gap-2 cursor-pointer py-2"
              >
                <span className="text-base leading-none mt-0.5">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{m.label}</span>
                    {active && <Check size={12} className="text-primary" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {t.label} · {m.description}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

export default ModelSelector;
