import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

export function Modal({ isOpen, onClose, title, children, className }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => {
        setAnimate(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // matches transition duration (duration-300)
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-gray-900/40 backdrop-blur-[4px] transition-opacity duration-300 ease-out",
          animate ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Modal Content / Bottom Sheet */}
      <div
        className={cn(
          // Mobile Bottom Sheet styles
          "relative z-10 w-full max-h-[90vh] bg-white rounded-t-[28px] border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex flex-col transition-all duration-300 ease-out pb-safe",
          // Desktop centered layout overrides
          "md:bottom-auto md:rounded-[28px] md:border md:shadow-[0_32px_64px_rgba(0,0,0,0.12)] md:max-w-lg md:max-h-[85vh]",
          // State transition classes
          animate
            ? "translate-y-0 opacity-100 md:scale-100"
            : "translate-y-full opacity-0 md:translate-y-0 md:scale-95 md:opacity-0",
          className
        )}
      >
        {/* Drag handle for mobile bottom sheet */}
        <div 
          onClick={onClose}
          className="md:hidden w-12 h-1.5 bg-gray-200/80 rounded-full mx-auto my-3 cursor-pointer shrink-0 hover:bg-gray-300 transition-colors" 
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 md:px-7 md:py-5 shrink-0">
          {title && (
            <h3 className="text-base font-bold text-gray-900 tracking-[-0.02em]">{title}</h3>
          )}
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 ml-auto"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="px-6 py-5 md:px-7 md:py-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
