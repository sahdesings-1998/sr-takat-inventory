import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/utils/cn";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function normalizeDateValue(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return toIsoDate(value);
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return "";
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  const cells = [];
  for (let index = 0; index < totalCells; index += 1) {
    const dayOffset = index - leadingDays + 1;
    const cellDate = new Date(year, month, dayOffset);
    cells.push(cellDate);
  }

  return cells;
}

const DatePicker = forwardRef(function DatePicker(
  {
    label,
    hint,
    error,
    className,
    containerClassName,
    value,
    onChange,
    onBlur,
    name,
    id,
    placeholder = "Select date",
    disabled = false,
    required = false,
    min,
    max,
    disabledDates = [],
    ...props
  },
  forwardedRef
) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => normalizeDateValue(value));
  const wrapperRef = useRef(null);
  const internalRef = useRef(null);
  const ref = forwardedRef || internalRef;
  const inputId = id || useId();
  const calendarId = `${inputId}-calendar`;

  useEffect(() => {
    const normalizedValue = normalizeDateValue(value);
    setSelectedDate(normalizedValue);

    if (normalizedValue) {
      const parsed = new Date(`${normalizedValue}T12:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        setViewDate(parsed);
      }
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

  const commitValue = (nextValue) => {
    const normalizedValue = normalizeDateValue(nextValue);
    setSelectedDate(normalizedValue);
    setViewDate(normalizedValue ? new Date(`${normalizedValue}T12:00:00`) : new Date());

    if (onChange) {
      onChange({ target: { value: normalizedValue, name } });
    }
  };

  const handleSelect = (date) => {
    const iso = toIsoDate(date);
    commitValue(iso);
    setIsOpen(false);
  };

  const handleClear = (event) => {
    event.stopPropagation();
    commitValue("");
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const isDateDisabled = (date) => {
    const iso = toIsoDate(date);
    const isBeforeMin = min ? iso < min : false;
    const isAfterMax = max ? iso > max : false;
    const isExplicitlyDisabled = disabledDates.includes(iso);
    return isBeforeMin || isAfterMax || isExplicitlyDisabled;
  };

  const isSameDay = (firstDate, secondDate) => {
    if (!firstDate || !secondDate) return false;
    return (
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    );
  };

  const isToday = (date) => isSameDay(date, new Date());

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)} ref={wrapperRef}>
      {label && (
        <label htmlFor={inputId} className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight select-none">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="relative">
          <button
            ref={ref}
            id={inputId}
            type="button"
            name={name}
            onClick={() => !disabled && setIsOpen((value) => !value)}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            disabled={disabled}
            className={cn(
              "flex h-11 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-xs sm:text-sm transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
              "hover:border-gray-400",
              disabled
                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                : "border-gray-200 text-gray-900",
              error && "border-danger/60 focus:border-danger/60 focus:ring-danger/20",
              className
            )}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={calendarId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
          >
            <span className={cn("truncate", selectedDate ? "text-gray-900" : "text-gray-400")}>
              {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
            </span>

            <span className="ml-3 flex shrink-0 items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
            </span>
          </button>

          {selectedDate && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="absolute right-10 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear date"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isOpen && (
          <div
            id={calendarId}
            role="dialog"
            aria-label="Choose date"
            className="absolute inset-x-0 z-50 mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_48px_rgba(15,23,42,0.16)] sm:w-80"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <select
                    value={viewDate.getMonth()}
                    onChange={(event) => setViewDate(new Date(viewDate.getFullYear(), Number(event.target.value), 1))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    aria-label="Select month"
                  >
                    {MONTH_NAMES.map((monthName, index) => (
                      <option key={monthName} value={index}>
                        {monthName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={viewDate.getFullYear()}
                    onChange={(event) => setViewDate(new Date(Number(event.target.value), viewDate.getMonth(), 1))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    aria-label="Select year"
                  >
                    {Array.from({ length: 21 }, (_, index) => viewDate.getFullYear() - 10 + index).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const iso = date.toISOString().slice(0, 10);
                const isCurrentMonth = date.getMonth() === viewDate.getMonth();
                const isSelected = selectedDate ? isSameDay(date, new Date(`${selectedDate}T12:00:00`)) : false;
                const isDisabled = isDateDisabled(date);

                return (
                  <button
                    key={`${iso}-${index}`}
                    type="button"
                    onClick={() => !isDisabled && handleSelect(date)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl text-sm transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20",
                      !isCurrentMonth && "text-slate-300",
                      isCurrentMonth && "text-slate-700",
                      isDisabled && "cursor-not-allowed bg-slate-100 text-slate-400",
                      !isDisabled && !isSelected && "hover:bg-slate-100 hover:text-slate-900",
                      isSelected && "bg-primary text-white shadow-sm",
                      isToday(date) && !isSelected && "font-semibold ring-1 ring-primary/20"
                    )}
                    disabled={isDisabled}
                    aria-label={date.toDateString()}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

export default DatePicker;
