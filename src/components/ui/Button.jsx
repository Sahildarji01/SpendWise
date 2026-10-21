import { cn } from "../../lib/format";

const variants = {
  primary:
    "bg-forest-500 text-ivory-50 hover:bg-forest-600 active:bg-forest-700 shadow-soft",
  secondary:
    "bg-charcoal-700 text-ivory-100 hover:bg-charcoal-600 active:bg-charcoal-800 border border-[var(--border)]",
  ghost:
    "bg-transparent text-ivory-200 hover:bg-charcoal-700/60 active:bg-charcoal-700",
  danger:
    "bg-error/15 text-error hover:bg-error/25 active:bg-error/30 border border-error/20",
  accent:
    "bg-accent-500 text-charcoal-900 hover:bg-accent-400 active:bg-accent-600 shadow-soft",
  outline:
    "bg-transparent text-ivory-100 border border-[var(--border-strong)] hover:bg-charcoal-700/40 active:bg-charcoal-700/60",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-13 px-6 text-base rounded-2xl gap-2.5",
  icon: "h-10 w-10 rounded-xl justify-center",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  fullWidth,
  disabled,
  loading,
  type = "button",
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal-900",
        "disabled:opacity-40 disabled:pointer-events-none",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
