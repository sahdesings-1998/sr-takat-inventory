import { useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * SearchInput — reusable search field with:
 * - Search icon on the left
 * - Theme-based Clear (X) button on the right, only visible when input has text
 * - Clicking clear instantly clears the value, refocuses, and fires onChange("")
 * - All standard input props forwarded through
 */
export function SearchInput({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  label,
  className,
  containerClassName,
  id,
  name,
  autoFocus,
  ...props
}) {
  const inputRef = useRef(null);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: "" } });
    }
    // Refocus after clearing
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const hasValue = Boolean(value);

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <label htmlFor={id || name} className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {/* Left search icon */}
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400 shrink-0" />

      <input
        ref={inputRef}
        id={id || name}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-xs sm:text-sm text-gray-900",
          "placeholder:text-xs sm:placeholder:text-sm placeholder:text-gray-400 placeholder:font-normal transition-all duration-200",
          "hover:border-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
          "disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />

      {/* Right clear (X) button — only shown when there is text */}
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-primary/15 hover:text-primary transition-all duration-150"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      </div>
    </div>
  );
}

export default SearchInput;
