import { cn } from "@/utils/cn";
import { PackageSearch } from "lucide-react";
import Button from "./Button";

/**
 * EmptyState — consistent empty-list state component.
 *
 * Props:
 *   icon        {ReactNode} — custom icon (defaults to PackageSearch)
 *   title       {string}   — heading text
 *   message     {string}   — descriptive body text
 *   actionLabel {string}   — optional CTA button label
 *   onAction    {fn}       — called when CTA button is clicked
 *   className   {string}   — additional wrapper classes
 */
export function EmptyState({
  icon,
  title = "No records found",
  message = "There's nothing here yet. Get started by adding the first entry.",
  actionLabel,
  onAction,
  className,
}) {
  const Icon = icon || PackageSearch;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
        "bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)]",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
        {typeof Icon === "function" ? (
          <Icon className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
        ) : (
          Icon
        )}
      </div>
      <div className="flex flex-col gap-1.5 max-w-sm">
        <h3 className="heading-h3 text-gray-800">{title}</h3>
        <p className="text-subtitle">{message}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
