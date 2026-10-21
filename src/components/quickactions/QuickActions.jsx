import { Mic, ScanLine, ClipboardPaste, Plus } from "lucide-react";
import { cn } from "../../lib/format";

const actions = [
  {
    id: "speak",
    label: "Speak",
    icon: Mic,
    color: "#4f8f6c",
    bg: "rgba(79, 143, 108, 0.12)",
  },
  {
    id: "scan",
    label: "Scan",
    icon: ScanLine,
    color: "#3a6b9c",
    bg: "rgba(58, 107, 156, 0.12)",
  },
  {
    id: "paste",
    label: "Paste",
    icon: ClipboardPaste,
    color: "#d9983a",
    bg: "rgba(217, 152, 58, 0.12)",
  },
  {
    id: "add",
    label: "Add",
    icon: Plus,
    color: "#c0483d",
    bg: "rgba(192, 72, 61, 0.12)",
  },
];

export default function QuickActions({ onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => onSelect(action.id)}
            className={cn(
              "flex flex-col items-center gap-2 py-3 rounded-2xl",
              "bg-charcoal-800/60 border border-[var(--border)]",
              "hover:border-[var(--border-strong)] hover:bg-charcoal-800",
              "active:scale-95 transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-400/40"
            )}
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: action.bg, color: action.color }}
            >
              <Icon size={20} strokeWidth={2} />
            </div>
            <span className="text-xs font-medium text-ivory-200">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
