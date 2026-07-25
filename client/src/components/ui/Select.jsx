import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import { CreatableSelect } from "./CreatableSelect";

export const Select = forwardRef(function Select(
  {
    label,
    error,
    options = [],
    className,
    id,
    containerClassName,
    placeholder = "Select an option",
    isCreatable = false,
    isSearchable = false,
    type,
    onCreateOption,
    ...props
  },
  ref
) {
  if (isCreatable || isSearchable || type || onCreateOption) {
    return (
      <CreatableSelect
        ref={ref}
        id={id}
        label={label}
        error={error}
        options={options}
        className={className}
        containerClassName={containerClassName}
        placeholder={placeholder}
        type={type}
        onCreateOption={onCreateOption}
        {...props}
      />
    );
  }

  const selectId = id || props.name;

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-11 w-full rounded-xl border bg-white pl-4 pr-10 text-xs sm:text-sm text-gray-900 appearance-none",
            "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
            "hover:border-gray-400 cursor-pointer",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed",
            error
              ? "border-danger/60 focus:ring-danger/20 focus:border-danger/60"
              : "border-gray-200",
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {placeholder && !options.some((opt) => opt.value === "") && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-danger font-medium">{error}</p>}
    </div>
  );
});

export { CreatableSelect };
export default Select;
