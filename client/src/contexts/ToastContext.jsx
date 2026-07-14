import React, { createContext, useContext, useState, useCallback } from "react";
import ToastContainer from "@/components/ui/ToastContainer";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, title, message, options = {}) => {
    const { duration = 4000, persistent = false, action = null, allowDuplicate = false } = options;

    setToasts((prev) => {
      // Prevent duplicates with same type and message if not allowed
      if (!allowDuplicate && prev.some((t) => t.type === type && t.message === message)) {
        return prev;
      }

      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      return [
        ...prev,
        {
          id,
          type,
          title,
          message,
          duration,
          persistent,
          action,
        },
      ];
    });
  }, []);

  const showSuccess = useCallback((title, message, options) => {
    addToast("success", title, message, options);
  }, [addToast]);

  const showError = useCallback((title, message, options) => {
    addToast("error", title, message, options);
  }, [addToast]);

  const showWarning = useCallback((title, message, options) => {
    addToast("warning", title, message, options);
  }, [addToast]);

  const showInfo = useCallback((title, message, options) => {
    addToast("info", title, message, options);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
