import React from "react";

export interface ErrorStateProps {
  title?: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "No pudimos cargar la información",
  description,
  retryLabel = "Reintentar",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-6 py-10 text-center flex flex-col items-center justify-center gap-3"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-card)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]"
        aria-hidden="true"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="font-display text-base font-semibold text-[var(--color-danger-text)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--color-danger-text)]/90 leading-relaxed">
          {description}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-danger-solid)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-danger-text)] whitespace-nowrap cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}
