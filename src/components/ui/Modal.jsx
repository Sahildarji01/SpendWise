import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/format";

export default function Modal({ open, onClose, title, children, className }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-charcoal-950/70 backdrop-blur-sm animate-fade"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-md bg-[var(--bg-elevated)] rounded-[var(--radius-card)]",
          "border border-[var(--border-strong)] shadow-strong",
          "animate-scale-in max-h-[85vh] overflow-y-auto",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
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
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
