import { forwardRef } from "react";
import { cn } from "@/utils/cn";

/**
 * Checkbox — styled checkbox input matching the app design system.
 *
 * Props:
 *   label         {string}   — visible label text
 *   error         {string}   — error message shown below
 *   hint          {string}   — hint text shown below (when no error)
 *   disabled      {boolean}  — disabled state
 *   id            {string}   — element id (falls back to name)
 *   containerClassName {string} — class for the outer wrapper
 */
const Checkbox = forwardRef(function Checkbox(
  { label, error, hint, className, id, containerClassName, ...props },
  ref
) {
  const checkboxId = id || props.name;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <label
        htmlFor={checkboxId}
        className={cn(
          "flex items-center gap-3 cursor-pointer group",
          props.disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              "peer h-[18px] w-[18px] appearance-none rounded-md border border-gray-300 bg-white",
              "transition-all duration-150 cursor-pointer",
              "checked:bg-primary checked:border-primary",
              "hover:border-primary/60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              error && "border-danger/60",
              className
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
          {/* Custom checkmark rendered via SVG overlay */}
          <svg
            className="absolute h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-150"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2,6 5,9 10,3" />
          </svg>
        </div>
        {label && (
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
            {label}
          </span>
        )}
      </label>
      {hint && !error && <p className="text-xs text-gray-400 pl-[30px]">{hint}</p>}
      {error && (
        <p className="text-xs text-danger font-medium pl-[30px]">{error}</p>
      )}
    </div>
  );
});

export default Checkbox;
