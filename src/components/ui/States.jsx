import { cn } from "../../lib/format";

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      <div className="h-16 w-16 rounded-2xl bg-charcoal-700/40 flex items-center justify-center mb-4">
        <Icon size={28} className="text-charcoal-400" />
      </div>
      <h3 className="text-base font-semibold text-ivory-100 mb-1.5">{title}</h3>
      <p className="text-sm text-charcoal-400 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      <div className="h-16 w-16 rounded-2xl bg-error/10 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-ivory-100 mb-1.5">{title}</h3>
      <p className="text-sm text-charcoal-400 max-w-xs mb-4">
        {description || "We couldn't load this right now. Please try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-charcoal-700 text-ivory-100 text-sm font-medium hover:bg-charcoal-600 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
