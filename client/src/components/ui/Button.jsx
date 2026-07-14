import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

const VARIANT_CLASSES = {
  primary:
    "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] focus-visible:ring-primary/40 disabled:bg-primary/50 shadow-[0_4px_12px_rgba(10,73,88,0.2)]",
  secondary:
    "bg-accent text-white hover:bg-accent/90 active:scale-[0.98] focus-visible:ring-accent/40 disabled:bg-accent/50 shadow-[0_4px_12px_rgba(203,155,66,0.2)]",
  outline:
    "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] focus-visible:ring-primary/30",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98] focus-visible:ring-primary/30",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:scale-[0.98] focus-visible:ring-danger/40 disabled:bg-danger/50 shadow-[0_4px_12px_rgba(220,38,38,0.2)]",
};

const SIZE_CLASSES = {
  sm: "h-8 px-3.5 text-xs font-semibold rounded-xl",
  md: "h-11 px-5 text-sm font-semibold rounded-xl",
  lg: "h-12 px-7 text-sm font-semibold rounded-2xl",
};

/**
 * Premium Button component — unified sizing, border-radius, and interactive states.
 */
const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    disabled = false,
    className,
    children,
    type = "button",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export default Button;
