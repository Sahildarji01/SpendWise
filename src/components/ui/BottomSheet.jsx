import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/format";

// Bottom sheet for mobile — slides up from the bottom
export default function BottomSheet({ open, onClose, title, children, className }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-charcoal-950/70 backdrop-blur-sm animate-fade"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-md bg-[var(--bg-elevated)] rounded-t-[1.75rem]",
          "border border-[var(--border-strong)] shadow-strong",
          "animate-sheet-up max-h-[88vh] overflow-y-auto safe-bottom",
          className
        )}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-charcoal-600" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pt-2 pb-3">
            <h2 className="text-lg font-display font-semibold text-ivory-50">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-charcoal-400 hover:text-ivory-100 hover:bg-charcoal-700/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className={cn("px-5 pb-6", !title && "pt-2")}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
