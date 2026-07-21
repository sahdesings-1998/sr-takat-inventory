import { forwardRef, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

const VARIANT_STYLES = {
  ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200",
  danger: "text-danger hover:bg-danger/10 hover:text-danger active:bg-danger/20",
  primary: "text-primary hover:bg-primary/10 hover:text-primary active:bg-primary/20",
  secondary: "text-accent hover:bg-accent/10 hover:text-accent active:bg-accent/20",
  outline: "border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100",
  success: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100",
};

/**
 * Reusable Action Button for Data Tables — with per-row loading spinner and click protection.
 */
const TableActionButton = forwardRef(function TableActionButton(
  {
    icon: Icon,
    label,
    onClick,
    isLoading: controlledIsLoading = false,
    disabled = false,
    variant = "ghost",
    className,
    title,
    showLabel = false,
    type = "button",
    ...props
  },
  ref
) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isPendingRef = useRef(false);

  const isLoading = controlledIsLoading || internalLoading;

  const handleClick = async (e) => {
    e.stopPropagation();
    if (disabled || isLoading || isPendingRef.current) {
      e.preventDefault();
      return;
    }

    if (onClick) {
      isPendingRef.current = true;
      try {
        const result = onClick(e);
        if (result && typeof result.then === "function") {
          setInternalLoading(true);
          await result;
        }
      } catch (err) {
        throw err;
      } finally {
        setInternalLoading(false);
        setTimeout(() => {
          isPendingRef.current = false;
        }, 300);
      }
    }
  };

  const actionTitle = title || label;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      onClick={handleClick}
      title={actionTitle}
      aria-label={actionTitle}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 p-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_STYLES[variant] || VARIANT_STYLES.ghost,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      {(showLabel || !Icon) && (
        <span className="truncate">{isLoading ? "..." : label}</span>
      )}
    </button>
  );
});

export default TableActionButton;
