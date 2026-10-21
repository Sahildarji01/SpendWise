import { cn } from "../../lib/format";

export function Avatar({ initials, size = "md", className }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-20 w-20 text-2xl",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-forest-500 to-forest-700 text-ivory-50",
        "flex items-center justify-center font-semibold shrink-0",
        "border border-forest-400/20",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

export function CategoryIcon({ icon: Icon, color, bg, size = "md" }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 22,
  };

  return (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center shrink-0",
        sizes[size]
      )}
      style={{ backgroundColor: bg, color }}
    >
      <Icon size={iconSizes[size]} />
    </div>
  );
}
