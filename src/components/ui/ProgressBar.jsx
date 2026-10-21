import { cn } from "../../lib/format";

const sizes = {
  sm: "h-2 rounded-full",
  md: "h-2.5 rounded-full",
  lg: "h-3 rounded-full",
};

export default function ProgressBar({
  value = 0,
  max = 100,
  size = "md",
  className,
  barClassName,
  showOverflow = true,
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isOverflow = value > max && showOverflow;

  return (
    <div
      className={cn(
        "w-full bg-charcoal-700/60 overflow-hidden",
        sizes[size],
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          isOverflow
            ? "bg-gradient-to-r from-error to-accent-500"
            : "bg-gradient-to-r from-forest-400 to-forest-500",
          barClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
