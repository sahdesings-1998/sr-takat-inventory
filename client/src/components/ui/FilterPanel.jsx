import React, { useState } from "react";
import { Filter, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * FilterPanel Component
 * Wraps filter sections in a responsive, collapsible accordion on screens < 768px (md breakpoint).
 * Always expanded on desktop (>= 768px).
 *
 * @param {Object} props
 * @param {number} props.activeFilterCount - Number of active filters
 * @param {Function} props.onReset - Callback function to reset all filters
 * @param {React.ReactNode} props.children - Filter controls (SearchInput, Selects, etc.)
 * @param {React.ReactNode} [props.chips] - Rendered active filter chips bar
 * @param {string} [props.title="Filters"] - Title for the mobile collapsible header
 * @param {string} [props.className] - Optional container class overrides
 */
export default function FilterPanel({
  activeFilterCount = 0,
  onReset,
  children,
  chips,
  title = "Filters",
  className = "",
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={cn("bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4", className)}>
      {/* Mobile Collapsible Header (< 768px) */}
      <div className="flex items-center justify-between md:hidden border-b border-gray-100 pb-3">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-900 focus:outline-none select-none cursor-pointer"
        >
          <Filter className="h-4 w-4 text-primary shrink-0" />
          <span>{title}</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
              {activeFilterCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400 ml-1 transition-transform" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400 ml-1 transition-transform" />
          )}
        </button>

        {activeFilterCount > 0 && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-bold text-danger hover:underline cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Filter Fields Content (Collapsible on mobile < 768px, always visible on desktop >= 768px) */}
      <div className={cn("transition-all duration-200", !isExpanded && "hidden md:block")}>
        {children}
      </div>

      {/* Active Filter Chips Bar */}
      {chips && (
        <div className={cn(!isExpanded && "hidden md:block")}>
          {chips}
        </div>
      )}
    </div>
  );
}
