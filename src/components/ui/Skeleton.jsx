// Skeleton loading placeholder
import { cn } from "../../lib/format";

export function Skeleton({ className }) {
  return (
    <div
      className={cn("rounded-lg bg-charcoal-700/40 shimmer", className)}
    />
  );
}

export function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-10 w-10 rounded-xl bg-charcoal-700/40 shimmer" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-32 w-full rounded-[var(--radius-card)]" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}
