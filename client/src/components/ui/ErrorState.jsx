import { cn } from "@/utils/cn";
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button";

/**
 * ErrorState — consistent error/failed-fetch state component.
 *
 * Props:
 *   title       {string}   — heading text
 *   message     {string}   — error description
 *   onRetry     {fn}       — optional retry callback (shows a Retry button)
 *   className   {string}   — additional wrapper classes
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load the data. Please try again.",
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
        "bg-white rounded-2xl border border-red-50 shadow-[0_4px_20px_rgba(0,0,0,0.015)]",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <AlertCircle className="h-8 w-8 text-danger/70" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-1.5 max-w-sm">
        <h3 className="text-sm font-bold text-gray-800 tracking-[-0.01em]">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-1 gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
