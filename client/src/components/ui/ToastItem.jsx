import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const variantStyles = {
  success: {
    container: "border-l-4 border-l-emerald-500 shadow-emerald-500/5",
    icon: "text-emerald-500",
    bar: "bg-emerald-500",
    IconComponent: CheckCircle2,
  },
  error: {
    container: "border-l-4 border-l-rose-500 shadow-rose-500/5",
    icon: "text-rose-500",
    bar: "bg-rose-500",
    IconComponent: XCircle,
  },
  warning: {
    container: "border-l-4 border-l-amber-500 shadow-amber-500/5",
    icon: "text-amber-500",
    bar: "bg-amber-500",
    IconComponent: AlertTriangle,
  },
  info: {
    container: "border-l-4 border-l-sky-500 shadow-sky-500/5",
    icon: "text-sky-500",
    bar: "bg-sky-500",
    IconComponent: Info,
  },
};

export default function ToastItem({ toast, onClose }) {
  const [timeLeft, setTimeLeft] = useState(toast.duration);
  const [isHovered, setIsHovered] = useState(false);

  const style = variantStyles[toast.type] || variantStyles.info;
  const Icon = style.IconComponent;

  // Auto-dismiss logic with pause on hover
  useEffect(() => {
    if (toast.persistent) return;

    const interval = setInterval(() => {
      if (!isHovered) {
        setTimeLeft((prev) => {
          if (prev <= 50) {
            clearInterval(interval);
            return 0;
          }
          return prev - 50;
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isHovered, toast.persistent]);

  // Handle closing when timeLeft hits 0
  useEffect(() => {
    if (timeLeft === 0 && !toast.persistent) {
      onClose();
    }
  }, [timeLeft, toast.persistent, onClose]);

  const percentage = toast.persistent ? 0 : (timeLeft / toast.duration) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95, transition: { duration: 0.2 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex gap-3 p-4 bg-white/95 backdrop-blur-md rounded-xl border border-gray-100 shadow-lg pointer-events-auto overflow-hidden ${style.container}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className={`mt-0.5 flex-shrink-0 ${style.icon}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>

      <div className="flex-1 flex flex-col gap-1 pr-6">
        {toast.title && (
          <h5 className="font-semibold text-sm text-gray-900 leading-tight">
            {toast.title}
          </h5>
        )}
        <p className="text-xs text-gray-600 leading-relaxed font-medium">
          {toast.message}
        </p>

        {toast.action && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.action.onClick();
              onClose();
            }}
            className="mt-2 text-xs font-semibold text-accent hover:underline text-left"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress Bar */}
      {!toast.persistent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100/50">
          <div
            className={`h-full transition-all duration-75 ${style.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}
