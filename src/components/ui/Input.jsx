import { forwardRef } from "react";
import { cn } from "../../lib/format";

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    className,
    type = "text",
    ...props
  },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ivory-200 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full h-12 rounded-xl bg-charcoal-800 border text-ivory-50 text-base",
            "placeholder:text-charcoal-400",
            "focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20",
            "transition-all duration-200",
            "border-[var(--border-strong)]",
            leftIcon ? "pl-11 pr-4" : "px-4",
            rightIcon ? "pr-11" : "",
            error && "border-error/50 focus:border-error/60 focus:ring-error/20",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-charcoal-400">{hint}</p>}
    </div>
  );
});

export default Input;
