import { NavLink } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Chat", icon: MessageSquare, tour: "nav-chat" },
];

const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#07101c]/95 backdrop-blur-xl md:hidden">
    <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {tabs.map(({ to, label, icon: Icon, tour }) => (
        <NavLink
          key={to}
          to={to}
          end
          data-tour={tour}
          className={({ isActive }) =>
            cn(
              "flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-4 py-1.5 transition-colors",
              isActive ? "text-cyan-300" : "text-slate-400 hover:text-slate-100"
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
