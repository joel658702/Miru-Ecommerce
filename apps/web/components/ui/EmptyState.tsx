import React from "react";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] px-6 py-12 text-center flex flex-col items-center justify-center gap-3">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
        aria-hidden="true"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="font-display text-base font-semibold text-[var(--color-neutral-900)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--color-neutral-500)] leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--color-border-interactive)] bg-[var(--color-surface-card)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-900)] transition-colors hover:bg-[var(--color-surface-canvas)] whitespace-nowrap cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
