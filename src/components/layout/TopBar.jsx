import { ChevronLeft } from "lucide-react";
import { cn } from "../../lib/format";

export default function TopBar({ title, subtitle, onBack, right, className }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 bg-charcoal-900/80 backdrop-blur-xl safe-top",
        "border-b border-[var(--border)]",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="h-9 w-9 -ml-1.5 rounded-lg flex items-center justify-center text-ivory-200 hover:bg-charcoal-700/60 transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <div className="min-w-0">
            {title && (
              <h1 className="text-base font-semibold text-ivory-50 truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-charcoal-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  );
}
