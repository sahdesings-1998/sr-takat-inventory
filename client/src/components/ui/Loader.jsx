import { cn } from "@/utils/cn";
import Spinner from "./Spinner";

/**
 * Loader — full-page or section loading state component.
 *
 * Variants:
 *   "page"     — fills the viewport (use for route-level loading)
 *   "section"  — fills its parent container (use for card/section loading)
 *   "inline"   — small inline spinner with optional label
 *
 * Props:
 *   variant  {"page" | "section" | "inline"}  — layout mode (default: "section")
 *   label    {string}                          — optional loading message
 *   size     {number}                          — spinner size in px (default: 32)
 *   className {string}                         — additional wrapper classes
 */
export function Loader({ variant = "section", label, size = 32, className }) {
  if (variant === "page") {
    return (
      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm",
          className
        )}
        role="status"
        aria-label={label || "Loading"}
      >
        <Spinner size={size} />
        {label && (
          <p className="text-sm font-medium text-gray-500 animate-pulse">{label}</p>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span
        className={cn("inline-flex items-center gap-2 text-sm text-gray-500", className)}
        role="status"
      >
        <Spinner size={size ?? 16} />
        {label && <span>{label}</span>}
      </span>
    );
  }

  // Default: "section"
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16",
        className
      )}
      role="status"
      aria-label={label || "Loading"}
    >
      <Spinner size={size} />
      {label && (
        <p className="text-sm font-medium text-gray-400">{label}</p>
      )}
    </div>
  );
}

export default Loader;
