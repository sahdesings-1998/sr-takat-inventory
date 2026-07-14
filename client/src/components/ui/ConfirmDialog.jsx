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

/**
 * ConfirmDialog — reusable themed confirmation modal.
 *
 * Props:
 *   isOpen        {boolean}  — whether the dialog is visible
 *   onClose       {fn}       — called when user cancels or clicks backdrop
 *   onConfirm     {fn}       — called when user clicks the confirm button
 *   title         {string}   — dialog title
 *   message       {string}   — descriptive message body
 *   confirmLabel  {string}   — text for the confirm button (default: "Confirm")
 *   cancelLabel   {string}   — text for the cancel button (default: "Cancel")
 *   variant       {string}   — "danger" | "warning" | "default"
 *   isLoading     {boolean}  — disables buttons and shows spinner on confirm btn
 */
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
  if (!isOpen) return null;

  const { icon: Icon, iconBg, iconColor, confirmVariant } = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.danger;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-[6px] transition-opacity" />

      {/* Dialog Card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-sm overflow-hidden rounded-[24px] bg-white",
          "shadow-[0_32px_64px_rgba(0,0,0,0.14)] border border-gray-100/60",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all duration-150 disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-4 px-7 pb-7 pt-8 text-center">
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
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant}
              className="flex-1"
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
