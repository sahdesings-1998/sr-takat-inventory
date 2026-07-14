import { forwardRef } from "react";
import { cn } from "@/utils/cn";

export const Textarea = forwardRef(function Textarea(
  { label, error, className, id, containerClassName, ...props },
  ref
) {
  const textareaId = id || props.name;

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <label htmlFor={textareaId} className="text-[13px] font-semibold text-gray-700 tracking-[-0.01em]">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          "min-h-[96px] w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400",
          "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
          "hover:border-gray-400 resize-y",
          "disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed",
          error
            ? "border-danger/60 focus:ring-danger/20 focus:border-danger/60"
            : "border-gray-200",
          className
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <p className="text-xs text-danger font-medium">{error}</p>}
    </div>
  );
});

export default Textarea;
