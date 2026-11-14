import React from "react";

export interface LiveIndicatorProps {
  isLive: boolean;
  lastSyncLabel: string;
  onToggle?: () => void;
}

export function LiveIndicator({
  isLive,
  lastSyncLabel,
  onToggle,
}: LiveIndicatorProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] px-2.5 py-1.5 text-xs shadow-xs">
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        {isLive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-emerald)] opacity-60 motion-reduce:hidden" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            isLive ? "bg-[var(--color-accent-emerald)]" : "bg-[var(--color-neutral-400)]"
          }`}
        />
      </span>

      <span className="font-semibold text-[var(--color-neutral-900)] whitespace-nowrap">
        {isLive ? "En vivo" : "Pausado"}
      </span>

      <span className="hidden sm:inline text-[var(--color-neutral-300)]" aria-hidden="true">
        ·
      </span>

      <span className="hidden sm:inline text-[var(--color-neutral-500)] whitespace-nowrap tabular-nums font-mono text-[11px]">
        {lastSyncLabel}
      </span>

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={isLive ? "Pausar actualización en vivo" : "Reanudar actualización en vivo"}
          className="ml-1 inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] cursor-pointer"
        >
          {isLive ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
