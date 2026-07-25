import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/utils/cn";
import { useLookups, useCreateLookup } from "@/hooks/useLookups";
import { Search, Plus, Check, ChevronDown, Loader2, X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export const CreatableSelect = forwardRef(function CreatableSelect(
  {
    label,
    value,
    onChange,
    onBlur,
    options: passedOptions,
    onCreateOption,
    type, // lookup type e.g., 'category', 'brand', 'location', 'color', 'metalType'
    placeholder = "Select or search...",
    error,
    disabled = false,
    isLoading: passedIsLoading = false,
    className,
    containerClassName,
    id,
    name,
    isClearable = true,
    required = false,
    ...props
  },
  ref
) {
  const toastContext = useToast ? useToast() : null;
  const showSuccess = toastContext?.showSuccess || (() => {});
  const showError = toastContext?.showError || (() => {});

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  useImperativeHandle(ref, () => inputRef.current);

  const selectId = id || name;

  // Auto-lookup hook if type is provided
  const { options: lookupOptions, isLoading: isLookupLoading } = useLookups(type ? type : null);
  const { createLookup, isCreating: isLookupCreating } = useCreateLookup();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCustomCreating, setIsCustomCreating] = useState(false);

  const isLoading = passedIsLoading || (type ? isLookupLoading : false);
  const isCreating = isCustomCreating || isLookupCreating;

  // Normalize options into { value, label } objects
  const baseOptions = useMemo(() => {
    const rawOptions = type ? lookupOptions : passedOptions || [];
    return rawOptions.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return { value: opt.value ?? opt.label, label: opt.label ?? opt.value };
    });
  }, [type, lookupOptions, passedOptions]);

  // Ensure current value (if any and not in options) is displayed
  const mergedOptions = useMemo(() => {
    const opts = [...baseOptions];
    if (value && typeof value === "string" && value.trim()) {
      const trimmedVal = value.trim();
      const exists = opts.some(
        (o) => String(o.value).trim().toLowerCase() === trimmedVal.toLowerCase()
      );
      if (!exists) {
        opts.unshift({ value: trimmedVal, label: trimmedVal });
      }
    }
    return opts;
  }, [baseOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return mergedOptions;
    const query = searchQuery.trim().toLowerCase();
    return mergedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
    );
  }, [mergedOptions, searchQuery]);

  // Case-insensitive check if typed search query already exists in options
  const exactMatchExists = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    return mergedOptions.some(
      (opt) =>
        opt.value.trim().toLowerCase() === query ||
        opt.label.trim().toLowerCase() === query
    );
  }, [mergedOptions, searchQuery]);

  const canCreate = Boolean(searchQuery.trim()) && !exactMatchExists;

  // Selected Option Object
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return (
      mergedOptions.find(
        (o) => String(o.value).trim().toLowerCase() === String(value).trim().toLowerCase()
      ) || { value, label: value }
    );
  }, [mergedOptions, value]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery("");
        if (onBlur) onBlur(e);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onBlur]);

  // Reset active index when filtered options or canCreate changes
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredOptions.length, canCreate]);

  // Trigger change helper
  const selectValue = (newVal) => {
    if (onChange) {
      // Support both react-hook-form change and standard callback
      const synthEvent = {
        target: { name, value: newVal, id: selectId },
      };
      onChange(newVal, synthEvent);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  // Create new option logic
  const handleCreateNew = async () => {
    const rawVal = searchQuery.trim();
    if (!rawVal || isCreating) return;

    // Check duplicate case-insensitively again
    const alreadyExists = mergedOptions.some(
      (o) => o.value.trim().toLowerCase() === rawVal.toLowerCase()
    );
    if (alreadyExists) {
      selectValue(rawVal);
      return;
    }

    try {
      if (onCreateOption) {
        setIsCustomCreating(true);
        const created = await onCreateOption(rawVal);
        setIsCustomCreating(false);
        const finalVal = typeof created === "string" ? created : created?.value || rawVal;
        showSuccess("Option Created", `"${rawVal}" has been added.`);
        selectValue(finalVal);
      } else if (type) {
        const created = await createLookup({ type, value: rawVal });
        const finalVal = created?.value || rawVal;
        showSuccess("Option Created", `"${rawVal}" added to ${type}.`);
        selectValue(finalVal);
      } else {
        // Fallback local create if no endpoint/handler provided
        selectValue(rawVal);
      }
    } catch (err) {
      setIsCustomCreating(false);
      const msg = err?.response?.data?.message || err?.message || "Failed to create option.";
      showError("Create Failed", msg);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalSelectable = filteredOptions.length + (canCreate ? 1 : 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(totalSelectable, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + totalSelectable) % Math.max(totalSelectable, 1));
        break;
      case "Enter":
        e.preventDefault();
        if (canCreate && activeIndex === filteredOptions.length) {
          handleCreateNew();
        } else if (filteredOptions[activeIndex]) {
          selectValue(filteredOptions[activeIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        break;
      case "Tab":
        setIsOpen(false);
        setSearchQuery("");
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5 relative", containerClassName)} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="text-xs sm:text-sm font-semibold text-gray-700 select-none flex items-center justify-between">
          <span>
            {label} {required && <span className="text-danger">*</span>}
          </span>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </label>
      )}

      {/* Input Box Trigger */}
      <div className="relative">
        <div
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className={cn(
            "min-h-[44px] w-full rounded-xl border bg-white px-3.5 py-2 text-xs sm:text-sm text-gray-900 cursor-pointer flex items-center justify-between gap-2",
            "transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
            "hover:border-gray-400",
            disabled && "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed",
            error ? "border-danger/60 focus-within:ring-danger/20 focus-within:border-danger/60" : "border-gray-200",
            isOpen && "ring-2 ring-primary/20 border-primary/50",
            className
          )}
        >
          <div className="flex-1 flex items-center gap-2 overflow-hidden">
            {isOpen ? (
              <div className="flex items-center gap-2 w-full">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  id={selectId}
                  name={name}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedOption ? selectedOption.label : placeholder}
                  className="w-full bg-transparent outline-none text-xs sm:text-sm text-gray-900 placeholder:text-gray-400"
                  disabled={disabled}
                  autoComplete="off"
                  {...props}
                />
              </div>
            ) : (
              <span className={cn("truncate block", !selectedOption && "text-gray-400")}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isClearable && value && !disabled && !isOpen && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  selectValue("");
                }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
            )}
          </div>
        </div>

        {/* Dropdown Menu Popover */}
        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected =
                  value && String(value).trim().toLowerCase() === String(opt.value).trim().toLowerCase();
                const isActive = activeIndex === idx;
                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    onClick={() => selectValue(opt.value)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm rounded-lg cursor-pointer transition-colors font-medium",
                      isSelected && "bg-primary/10 text-primary font-semibold",
                      isActive && !isSelected && "bg-gray-100/80 text-gray-900",
                      !isActive && !isSelected && "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                );
              })
            ) : !canCreate ? (
              <div className="px-3 py-3 text-xs sm:text-sm text-gray-400 text-center">No matching options found</div>
            ) : null}

            {/* Create New Option Prompt */}
            {canCreate && (
              <div
                onClick={handleCreateNew}
                onMouseEnter={() => setActiveIndex(filteredOptions.length)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm rounded-lg cursor-pointer transition-all border-t border-gray-100 mt-1 font-semibold text-primary",
                  activeIndex === filteredOptions.length ? "bg-primary/10 text-primary-dark" : "hover:bg-primary/5"
                )}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">
                  Create <span className="underline font-bold text-gray-900">&quot;{searchQuery.trim()}&quot;</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-danger font-medium mt-0.5">{error}</p>}
    </div>
  );
});

export default CreatableSelect;
