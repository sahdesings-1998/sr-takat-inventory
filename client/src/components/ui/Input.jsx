import { forwardRef, useRef, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * Premium Input component — uniform h-11, rounded-xl, smooth focus ring.
 * Supports:
 *  - password show/hide toggle
 *  - clearable: shows an X button inside the input when it has a value
 */
const Input = forwardRef(function Input(
  { label, hint, error, type = "text", className, id, containerClassName, clearable, onClear, onChange, value, ...props },
  forwardedRef
) {
  const [showPassword, setShowPassword] = useState(false);
  const internalRef = useRef(null);
  const ref = forwardedRef || internalRef;

  const inputId = id || props.name;
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  const hasValue = clearable && Boolean(value ?? props.defaultValue ?? "");

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: "" } });
    }
    setTimeout(() => ref?.current?.focus?.(), 0);
  };

  // Compute right padding based on icons present
  const rightIcons = (isPassword ? 1 : 0) + (clearable && hasValue ? 1 : 0);
  const prClass = rightIcons === 2 ? "pr-20" : rightIcons === 1 ? "pr-10" : "";

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          value={value}
          onChange={onChange}
          className={cn(
            "h-11 w-full rounded-xl border bg-white px-4 text-xs sm:text-sm text-gray-900 placeholder:text-xs sm:placeholder:text-sm placeholder:text-gray-400 placeholder:font-normal",
            "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
            "hover:border-gray-400",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed",
            error
              ? "border-danger/60 focus:ring-danger/20 focus:border-danger/60"
              : "border-gray-200",
            prClass,
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />

        {/* Right-side icon cluster */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {/* Clear button (only when clearable and has value) */}
          {clearable && hasValue && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              aria-label="Clear input"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-primary/15 hover:text-primary transition-all duration-150"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger font-medium">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
