import { cn } from "../../lib/format";

const variants = {
  default: "bg-charcoal-700/60 text-ivory-200 border-[var(--border)]",
  forest: "bg-forest-500/15 text-forest-300 border-forest-500/20",
  accent: "bg-accent-500/15 text-accent-400 border-accent-500/20",
  error: "bg-error/15 text-error border-error/20",
  sage: "bg-sage-200/15 text-sage-300 border-sage-200/20",
};

const sizes = {
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3 py-1.5",
};

export default function Badge({ children, variant = "default", size = "md", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
