import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/utils/cn";

const countryOptions = [
  { code: "US", label: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "CA", label: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "GB", label: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "AU", label: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "IN", label: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "AE", label: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "SA", label: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "PK", label: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
  { code: "DE", label: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", label: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "IT", label: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "ES", label: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "NL", label: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { code: "TR", label: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "ZA", label: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "JP", label: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "KR", label: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { code: "CN", label: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "SG", label: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "MY", label: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "HK", label: "Hong Kong", dialCode: "+852", flag: "🇭🇰" },
];

const defaultCountryDialCode = "+1";
const defaultCountry = countryOptions.find((country) => country.dialCode === defaultCountryDialCode) || countryOptions[0];

function parsePhoneValue(value) {
  const trimmed = (value || "").toString().trim();
  if (!trimmed) {
    return { dialCode: defaultCountryDialCode, number: "" };
  }

  const matchedCountry = countryOptions.find((option) => trimmed.startsWith(option.dialCode));
  if (matchedCountry) {
    return {
      dialCode: matchedCountry.dialCode,
      number: trimmed.replace(matchedCountry.dialCode, "").trim(),
    };
  }

  const dialCodeMatch = trimmed.match(/^\+(\d{1,4})/);
  if (dialCodeMatch) {
    const matchedDialCode = `+${dialCodeMatch[1]}`;
    const fallbackCountry = countryOptions.find((option) => option.dialCode === matchedDialCode);
    if (fallbackCountry) {
      return { dialCode: fallbackCountry.dialCode, number: trimmed.replace(matchedDialCode, "").trim() };
    }
  }

  return { dialCode: defaultCountryDialCode, number: trimmed.replace(/\D/g, "") };
}

function formatPhoneNumber(value) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

function sanitizePhoneNumber(value) {
  return (value || "").replace(/\D/g, "");
}

const PhoneInput = forwardRef(function PhoneInput(
  { label, hint, error, className, id, containerClassName, value, onChange, onBlur, placeholder, name, ...props },
  ref
) {
  const inputId = id || name;
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const parsedValue = useMemo(() => parsePhoneValue(value), [value]);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return countryOptions.find((country) => country.dialCode === parsedValue.dialCode) || defaultCountry;
  });
  const [phoneDisplay, setPhoneDisplay] = useState(formatPhoneNumber(parsedValue.number));
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const resolvedCountry = countryOptions.find((country) => country.dialCode === parsedValue.dialCode) || defaultCountry;
    setSelectedCountry(resolvedCountry);
    setPhoneDisplay(formatPhoneNumber(parsedValue.number));
  }, [parsedValue.dialCode, parsedValue.number]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleResize = () => setIsMobileView(mediaQuery.matches);
    handleResize();
    mediaQuery.addEventListener?.("change", handleResize);
    return () => mediaQuery.removeEventListener?.("change", handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 80);
    const handleDocumentClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isOpen]);

  const emitValue = (nextDialCode, nextDisplay) => {
    const digits = sanitizePhoneNumber(nextDisplay);
    const formattedValue = digits ? `${nextDialCode} ${digits}`.trim() : nextDialCode;
    if (onChange) {
      onChange({ target: { name, value: formattedValue } });
    }
  };

  const handlePhoneNumberChange = (event) => {
    const nextDisplay = formatPhoneNumber(event.target.value);
    setPhoneDisplay(nextDisplay);
    emitValue(selectedCountry.dialCode, nextDisplay);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    emitValue(country.dialCode, phoneDisplay);
  };

  const handleSelectorKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const filteredCountries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return countryOptions;

    return countryOptions.filter((country) => {
      const searchText = `${country.label} ${country.code} ${country.dialCode}`.toLowerCase();
      return searchText.includes(query);
    });
  }, [searchTerm]);

  const dropdownContent = (
    <div
      className={cn(
        "overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_16px_50px_rgba(0,0,0,0.14)]",
        isMobileView ? "mx-3 mb-3 flex max-h-[72vh] flex-col" : "w-[320px]"
      )}
      role="listbox"
      aria-label="Select country"
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-primary/5 to-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Choose country</p>
            <p className="text-xs text-gray-500">Search by country, code, or dial prefix</p>
          </div>
          {isMobileView && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close country picker"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <label className="mt-3 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search countries"
            className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            aria-label="Search countries"
          />
        </label>
      </div>

      <div className="max-h-[320px] overflow-y-auto px-2 py-2">
        {filteredCountries.map((country) => {
          const isSelected = selectedCountry.code === country.code && selectedCountry.dialCode === country.dialCode;
          return (
            <button
              key={`${country.code}-${country.dialCode}`}
              type="button"
              onClick={() => handleCountrySelect(country)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-all duration-200",
                isSelected
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
              role="option"
              aria-selected={isSelected}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{country.flag}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{country.label}</span>
                  <span className="text-xs text-gray-500">{country.code}</span>
                </span>
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                {isSelected && <Check className="h-4 w-4" />}
                <span>{country.dialCode}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)} ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-gray-700 tracking-[-0.01em]">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="flex items-stretch overflow-hidden rounded-[16px] border border-gray-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 hover:border-gray-400">
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            onKeyDown={handleSelectorKeyDown}
            className="flex h-11 min-w-[92px] items-center gap-2 border-r border-gray-200 bg-gradient-to-r from-white to-gray-50 px-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${inputId}-country-picker`}
            aria-label={`Select country code. Current selection ${selectedCountry.dialCode}`}
          >
            <span className="text-lg leading-none">{selectedCountry.flag}</span>
            <span className="flex min-w-0 flex-col">
              {/* <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400">Code</span> */}
              <span className="text-sm font-semibold text-gray-900">{selectedCountry.dialCode}</span>
            </span>
            <ChevronDown className={cn("ml-auto h-4 w-4 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
          </button>

          <input
            ref={ref}
            id={inputId}
            type="tel"
            value={phoneDisplay}
            onChange={handlePhoneNumberChange}
            onBlur={onBlur}
            placeholder={placeholder || "Phone number"}
            className={cn(
              "h-11 flex-1 border-0 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none",
              className,
              error && "text-danger"
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>

        {isOpen && !isMobileView && (
          <div id={`${inputId}-country-picker`} className="absolute left-0 top-full z-[60] mt-2">
            {dropdownContent}
          </div>
        )}
      </div>

      {isOpen && isMobileView && (
        <>
          <div className="fixed inset-0 z-[55] bg-gray-950/40 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[60] rounded-t-[24px] border border-gray-100 bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.16)]" role="dialog" aria-modal="true" aria-label="Country picker">
            {dropdownContent}
          </div>
        </>
      )}

      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p id={`${inputId}-error`} className="text-xs text-danger font-medium">{error}</p>}
    </div>
  );
});

export default PhoneInput;
