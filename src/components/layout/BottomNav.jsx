import { Home, ArrowLeftRight, PiggyBank, Settings } from "lucide-react";
import { cn } from "../../lib/format";

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "transactions", label: "Activity", icon: ArrowLeftRight },
  { id: "budget", label: "Budget", icon: PiggyBank },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function BottomNav({ active, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 safe-bottom">
      <div className="mx-2 mb-2 rounded-2xl bg-charcoal-800/95 backdrop-blur-xl border border-[var(--border-strong)] shadow-strong">
        <div className="grid grid-cols-4 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-400/40",
                  isActive ? "text-forest-300" : "text-charcoal-400 hover:text-ivory-200"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200",
                    isActive && "bg-forest-500/15"
                  )}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn("transition-transform", isActive && "scale-105")}
                  />
                </div>
                <span className={cn("text-[10px] font-medium tracking-wide", isActive && "font-semibold")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
