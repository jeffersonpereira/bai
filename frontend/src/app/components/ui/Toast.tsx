"use client";
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

// ─── Tipos ────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error:   (message: string) => void;
  info:    (message: string) => void;
  warning: (message: string) => void;
}

// ─── Contexto ─────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [...prev, { id, type, message, duration }]);
    },
    []
  );

  const value: ToastContextValue = {
    toast,
    success: (m) => toast(m, "success"),
    error:   (m) => toast(m, "error", 6000),
    info:    (m) => toast(m, "info"),
    warning: (m) => toast(m, "warning", 5000),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Portal de toasts — canto inferior direito */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Item individual ──────────────────────────────────────────────
const toastStyles: Record<ToastType, { bg: string; icon: string; bar: string }> = {
  success: { bg: "bg-white border-emerald-200", icon: "text-emerald-500", bar: "bg-emerald-500" },
  error:   { bg: "bg-white border-red-200",     icon: "text-red-500",     bar: "bg-red-500"     },
  warning: { bg: "bg-white border-amber-200",   icon: "text-amber-500",   bar: "bg-amber-500"   },
  info:    { bg: "bg-white border-blue-200",    icon: "text-blue-500",    bar: "bg-blue-500"    },
};

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const style = toastStyles[toast.type];
  const duration = toast.duration ?? 4000;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, duration);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, duration]);

  return (
    <div
      role="alert"
      className={`
        pointer-events-auto relative w-80 max-w-[calc(100vw-3rem)]
        rounded-2xl border shadow-md overflow-hidden
        ${style.bg}
        ${exiting ? "animate-slide-out-right" : "animate-slide-in-right"}
      `}
    >
      {/* Barra de progresso */}
      <div
        className={`absolute top-0 left-0 h-0.5 ${style.bar}`}
        style={{
          animation: `shrink ${duration}ms linear forwards`,
          width: "100%",
        }}
      />

      <div className="flex items-start gap-3 p-4">
        <span className={`mt-0.5 shrink-0 ${style.icon}`}>
          {toastIcons[toast.type]}
        </span>
        <p className="flex-1 text-sm font-medium text-slate-700 leading-snug">{toast.message}</p>
        <button
          onClick={dismiss}
          aria-label="Fechar notificação"
          className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors -mt-0.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
