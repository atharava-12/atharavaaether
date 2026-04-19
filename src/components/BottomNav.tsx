import { NavLink } from "react-router-dom";
import { MessageSquare, Image as ImageIcon, Video, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Chat", icon: MessageSquare },
  { to: "/image", label: "Image", icon: ImageIcon },
  { to: "/video", label: "Video", icon: Video },
  { to: "/memory", label: "Memory", icon: Brain },
];

const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border">
    <div className="flex items-center justify-around max-w-2xl mx-auto px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-colors min-w-[60px]",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Icon size={20} strokeWidth={2} />
          <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;
