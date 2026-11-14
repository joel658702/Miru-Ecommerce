import React, { type ReactNode } from "react";

export interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  helperText?: string;
  icon?: ReactNode;
  accent?: "default" | "emerald" | "cyan" | "amber";
}

export function KpiCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  helperText,
  icon,
  accent = "default",
}: KpiCardProps) {
  const accentClasses =
    accent === "emerald"
      ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
      : accent === "cyan"
        ? "bg-[var(--color-info-bg)] text-[var(--color-info-text)]"
        : accent === "amber"
          ? "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
          : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]";

  const deltaToneClasses =
    deltaTone === "positive"
      ? "text-[var(--color-success-text)] bg-[var(--color-success-bg)]"
      : deltaTone === "negative"
        ? "text-[var(--color-danger-text)] bg-[var(--color-danger-bg)]"
        : "text-[var(--color-neutral-600)] bg-[var(--color-neutral-100)]";

  return (
    <article className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-4 md:p-5 shadow-[var(--shadow-level-1)] flex flex-col justify-between gap-3 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-neutral-500)]">
            {label}
          </p>
        </div>
        {icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentClasses}`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-display text-2xl md:text-[26px] font-bold leading-8 tracking-[-0.03em] text-[var(--color-neutral-900)] tabular-nums truncate">
          {value}
        </p>

        {(delta || helperText) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {delta && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold tabular-nums whitespace-nowrap ${deltaToneClasses}`}
              >
                {deltaTone === "positive" && (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 7l-5 5 1.41 1.41L12 9.83l3.59 3.58L17 12l-5-5z" clipRule="evenodd" />
                  </svg>
                )}
                {deltaTone === "negative" && (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 13l5-5-1.41-1.41L12 10.17l-3.59-3.58L7 8l5 5z" clipRule="evenodd" />
                  </svg>
                )}
                {deltaTone === "neutral" && (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{delta}</span>
              </span>
            )}
            {helperText && (
              <span className="text-[var(--color-neutral-500)] truncate">
                {helperText}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
