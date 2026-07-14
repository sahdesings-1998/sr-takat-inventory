import { forwardRef } from "react";
import { cn } from "@/utils/cn";

/**
 * RadioGroup — container for a set of radio options.
 *
 * Usage:
 *   <RadioGroup label="Payment Method" error={errors.method?.message}>
 *     <Radio name="method" value="Cash" label="Cash" {...register("method")} />
 *     <Radio name="method" value="Card" label="Card" {...register("method")} />
 *   </RadioGroup>
 */
export function RadioGroup({ label, error, hint, children, className }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="text-[13px] font-semibold text-gray-700 tracking-[-0.01em]">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-3">{children}</div>
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-danger font-medium">{error}</p>}
    </div>
  );
}

/**
 * Radio — individual radio button matching the app design system.
 *
 * Props:
 *   label    {string}  — visible label text
 *   disabled {boolean} — disabled state
 *   id       {string}  — element id (falls back to name+value)
 */
const Radio = forwardRef(function Radio(
  { label, className, id, ...props },
  ref
) {
  const radioId = id || `${props.name}-${props.value}`;

  return (
    <label
      htmlFor={radioId}
      className={cn(
        "flex items-center gap-2.5 cursor-pointer group",
        props.disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="relative flex items-center justify-center">
        <input
          ref={ref}
          id={radioId}
          type="radio"
          className={cn(
            "peer h-[18px] w-[18px] appearance-none rounded-full border border-gray-300 bg-white",
            "transition-all duration-150 cursor-pointer",
            "checked:border-primary",
            "hover:border-primary/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {/* Filled dot overlay */}
        <div className="absolute h-2 w-2 rounded-full bg-primary pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-150" />
      </div>
      {label && (
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
          {label}
        </span>
      )}
    </label>
  );
});

export { Radio };
export default Radio;
