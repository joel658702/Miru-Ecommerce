import React from "react";

export interface ToastItem {
  id: string;
  titulo: string;
  descripcion?: string;
  tone?: "success" | "info" | "warning" | "danger";
}

export interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-20 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 md:bottom-6 md:right-6 pointer-events-none"
    >
      {toasts.map((toast) => {
        const borderClass =
          toast.tone === "success"
            ? "border-[var(--color-success-border)]"
            : toast.tone === "warning"
              ? "border-[var(--color-warning-border)]"
              : toast.tone === "danger"
                ? "border-[var(--color-danger-border)]"
                : "border-[var(--color-info-border)]";

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-[var(--color-surface-card)] p-3.5 shadow-[var(--shadow-level-2)] ${borderClass}`}
          >
            <div className="pt-0.5 shrink-0" aria-hidden="true">
              {toast.tone === "success" && (
                <svg className="h-5 w-5 text-[var(--color-success-text)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {toast.tone === "warning" && (
                <svg className="h-5 w-5 text-[var(--color-warning-text)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {toast.tone === "danger" && (
                <svg className="h-5 w-5 text-[var(--color-danger-text)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {(!toast.tone || toast.tone === "info") && (
                <svg className="h-5 w-5 text-[var(--color-info-text)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-neutral-900)]">
                {toast.titulo}
              </p>
              {toast.descripcion && (
                <p className="mt-0.5 text-xs text-[var(--color-neutral-600)] leading-relaxed">
                  {toast.descripcion}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Cerrar notificación"
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
