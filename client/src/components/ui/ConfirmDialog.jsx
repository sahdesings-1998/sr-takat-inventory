import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, CheckCircle, X } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "./Button";

const VARIANT_CONFIG = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-50",
    iconColor: "text-danger",
    confirmVariant: "danger",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    confirmVariant: "secondary",
  },
  default: {
    icon: CheckCircle,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    confirmVariant: "primary",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => {
        setAnimate(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const { icon: Icon, iconBg, iconColor, confirmVariant } = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.danger;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-gray-900/40 backdrop-blur-[4px] transition-opacity duration-300 ease-out",
          animate ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div
        className={cn(
          // Mobile Bottom Sheet styles
          "relative z-10 w-full bg-white rounded-t-[28px] border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex flex-col transition-all duration-300 ease-out pb-safe",
          // Desktop centered dialog override
          "md:bottom-auto md:rounded-[24px] md:border md:shadow-[0_32px_64px_rgba(0,0,0,0.14)] md:max-w-sm",
          // State transition classes
          animate
            ? "translate-y-0 opacity-100 md:scale-100"
            : "translate-y-full opacity-0 md:translate-y-0 md:scale-95 md:opacity-0"
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        {/* Drag handle for mobile bottom sheet */}
        <div 
          onClick={onClose}
          className="md:hidden w-12 h-1.5 bg-gray-200/80 rounded-full mx-auto my-3 cursor-pointer shrink-0 hover:bg-gray-300 transition-colors" 
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150 disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-5 md:px-7 md:pb-7 md:pt-8 text-center">
          {/* Icon */}
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", iconBg)}>
            <Icon className={cn("h-7 w-7", iconColor)} strokeWidth={1.75} />
          </div>

          {/* Title */}
          <h3
            id="confirm-dialog-title"
            className="text-base font-bold text-gray-900 tracking-[-0.02em]"
          >
            {title}
          </h3>

          {/* Message */}
          <p
            id="confirm-dialog-message"
            className="text-sm text-gray-500 leading-relaxed -mt-1"
          >
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex w-full gap-3 mt-1">
            <Button
              variant="outline"
              className="flex-1 text-sm py-2.5 h-11"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant}
              className="flex-1 text-sm py-2.5 h-11"
              onClick={onConfirm}
              isLoading={isLoading}
              disabled={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDialog;
