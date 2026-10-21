import { cn } from "../../lib/format";

export default function Card({ children, className, onClick, padded = true, ...props }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-card)]",
        "transition-all duration-200",
        onClick && "cursor-pointer hover:border-[var(--border-strong)] hover:shadow-medium active:scale-[0.99]",
        padded && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
