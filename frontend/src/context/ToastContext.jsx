import React, { createContext, useCallback, useState } from "react";
import Toast from "../components/Toast";

export const ToastContext = createContext({ showToast: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, ...opts };
    setToasts((t) => [...t, toast]);
    // auto remove after duration (default 3s)
    const duration = opts.duration || 3000;
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", right: 20, top: 20, zIndex: 9999 }}>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
