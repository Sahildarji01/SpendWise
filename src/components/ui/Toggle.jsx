import { cn } from "../../lib/format";

export default function Toggle({ checked, onChange, disabled, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 rounded-full transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-400/50",
        "disabled:opacity-40 disabled:pointer-events-none",
        checked ? "bg-forest-500" : "bg-charcoal-600",
        className
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full bg-ivory-50 shadow-soft transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
