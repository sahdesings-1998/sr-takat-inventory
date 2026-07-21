import { forwardRef, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

const VARIANT_CLASSES = {
  primary:
    "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] focus-visible:ring-primary/40 disabled:bg-primary/50 shadow-[0_4px_12px_rgba(10,73,88,0.2)]",
  secondary:
    "bg-accent text-white hover:bg-accent/90 active:scale-[0.98] focus-visible:ring-accent/40 disabled:bg-accent/50 shadow-[0_4px_12px_rgba(203,155,66,0.2)]",
  outline:
    "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] focus-visible:ring-primary/30",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98] focus-visible:ring-primary/30",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:scale-[0.98] focus-visible:ring-danger/40 disabled:bg-danger/50 shadow-[0_4px_12px_rgba(220,38,38,0.2)]",
};

const SIZE_CLASSES = {
  sm: "h-8 px-3.5 text-xs font-semibold rounded-xl",
  md: "h-11 px-5 text-sm font-semibold rounded-xl",
  lg: "h-12 px-7 text-sm font-semibold rounded-2xl",
};

function extractText(node) {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join(" ");
  }
  if (node && typeof node === "object" && node.props && node.props.children) {
    return extractText(node.props.children);
  }
  return "";
}

function getPresentContinuous(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  if (trimmed.endsWith("...")) return trimmed;

  const lower = trimmed.toLowerCase();

  // Explicit mappings for common UI actions
  if (lower === "sign in" || lower === "login" || lower === "log in") return "Signing In...";
  if (lower === "create account") return "Creating Account...";
  if (lower === "send reset link" || lower === "send link") return "Sending Link...";
  if (lower === "reset password") return "Resetting Password...";
  if (lower === "print & checkout invoice" || lower === "checkout invoice") return "Processing Invoice...";
  if (lower === "extend return date") return "Extending Return Date...";
  if (lower === "generate pdf") return "Generating PDF...";
  if (lower === "generate invoice") return "Generating Invoice...";
  if (lower === "issue stock") return "Issuing Stock...";
  if (lower === "log return") return "Logging Return...";
  if (lower === "save status") return "Saving Status...";
  if (lower === "save costing") return "Saving Costing...";
  if (lower === "save changes") return "Saving Changes...";
  if (lower === "approve costing") return "Approving Costing...";

  const verbMap = {
    save: "Saving",
    submit: "Submitting",
    create: "Creating",
    update: "Updating",
    delete: "Deleting",
    generate: "Generating",
    upload: "Uploading",
    download: "Downloading",
    approve: "Approving",
    issue: "Issuing",
    log: "Logging",
    add: "Adding",
    extend: "Extending",
    print: "Printing",
    send: "Sending",
    reset: "Resetting",
    confirm: "Confirming",
    checkout: "Checking out",
    process: "Processing",
    export: "Exporting",
    import: "Importing",
    search: "Searching",
    filter: "Filtering",
    pay: "Processing payment",
    cancel: "Cancelling",
    mark: "Marking",
    clear: "Clearing",
    sign: "Signing",
  };

  const words = trimmed.split(" ");
  const firstWord = words[0].toLowerCase();

  if (verbMap[firstWord]) {
    const newFirstWord = verbMap[firstWord];
    const rest = words.slice(1).join(" ");
    return rest ? `${newFirstWord} ${rest}...` : `${newFirstWord}...`;
  }

  if (firstWord.endsWith("e") && !firstWord.endsWith("ee")) {
    const base = words[0].slice(0, -1);
    const newFirstWord = base.charAt(0).toUpperCase() + base.slice(1) + "ing";
    const rest = words.slice(1).join(" ");
    return rest ? `${newFirstWord} ${rest}...` : `${newFirstWord}...`;
  }

  if (firstWord.endsWith("ing")) {
    return `${trimmed}...`;
  }

  return `${trimmed}...`;
}

/**
 * Premium Button component — unified sizing, border-radius, interactive states, and click protection.
 */
const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading: controlledIsLoading,
    disabled = false,
    className,
    children,
    type = "button",
    onClick,
    loadingText: explicitLoadingText,
    icon,
    ...props
  },
  ref
) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isPendingRef = useRef(false);

  const isLoading = controlledIsLoading !== undefined ? controlledIsLoading : internalLoading;

  const handleClick = async (e) => {
    if (disabled || isLoading || isPendingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (type === "submit") {
      isPendingRef.current = true;
      setTimeout(() => {
        isPendingRef.current = false;
      }, 500);
      if (onClick) onClick(e);
      return;
    }

    if (onClick) {
      isPendingRef.current = true;
      try {
        const result = onClick(e);
        if (result && typeof result.then === "function") {
          setInternalLoading(true);
          await result;
        }
      } catch (err) {
        throw err;
      } finally {
        setInternalLoading(false);
        setTimeout(() => {
          isPendingRef.current = false;
        }, 300);
      }
    }
  };

  const extracted = extractText(children);
  const derivedLoadingText = explicitLoadingText || getPresentContinuous(extracted);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
          <span>{derivedLoadingText || "Processing..."}</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
});

export default Button;
