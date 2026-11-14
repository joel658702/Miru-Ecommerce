import React from "react";

export interface SkeletonProps {
  variant?: "kpi" | "table" | "kanban";
  rows?: number;
}

export function Skeleton({ variant = "table", rows = 5 }: SkeletonProps) {
  if (variant === "kpi") {
    return (
      <div
        aria-busy="true"
        aria-label="Cargando indicador"
        className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 rounded bg-[var(--color-neutral-200)] animate-pulse motion-reduce:animate-none" />
          <div className="h-9 w-9 rounded-lg bg-[var(--color-neutral-100)] animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="h-7 w-36 rounded bg-[var(--color-neutral-200)] animate-pulse motion-reduce:animate-none" />
        <div className="h-4 w-28 rounded bg-[var(--color-neutral-100)] animate-pulse motion-reduce:animate-none" />
      </div>
    );
  }

  if (variant === "kanban") {
    return (
      <div
        aria-busy="true"
        aria-label="Cargando tarjeta"
        className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-3.5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-16 rounded bg-[var(--color-neutral-200)] animate-pulse motion-reduce:animate-none" />
          <div className="h-5 w-20 rounded-full bg-[var(--color-neutral-100)] animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="h-4 w-3/4 rounded bg-[var(--color-neutral-100)] animate-pulse motion-reduce:animate-none" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3.5 w-24 rounded bg-[var(--color-neutral-100)] animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-20 rounded bg-[var(--color-neutral-200)] animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      aria-label="Cargando registros"
      className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-level-1)]"
    >
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-3 flex items-center gap-4">
        <div className="h-3.5 w-20 rounded bg-[var(--color-neutral-200)] animate-pulse motion-reduce:animate-none" />
        <div className="h-3.5 w-36 rounded bg-[var(--color-neutral-200)] animate-pulse motion-reduce:animate-none" />
        <div className="hidden md:block h-3.5 w-28 rounded bg-[var(--color-neutral-200)] animate-pulse motion-reduce:animate-none" />
        <div className="ml-auto h-3.5 w-24 rounded bg-[var(--color-neutral-200)] animate-pulse motion-reduce:animate-none" />
      </div>
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 h-12">
            <div className="h-4 w-20 rounded bg-[var(--color-neutral-100)] animate-pulse motion-reduce:animate-none" />
            <div className="h-4 w-40 rounded bg-[var(--color-neutral-100)] animate-pulse motion-reduce:animate-none" />
            <div className="hidden sm:block h-5 w-20 rounded-full bg-[var(--color-neutral-100)] animate-pulse motion-reduce:animate-none" />
            <div className="hidden lg:block h-4 w-28 rounded bg-[var(--color-neutral-100)] animate-pulse motion-reduce:animate-none" />
            <div className="ml-auto h-4 w-24 rounded bg-[var(--color-neutral-100)] animate-pulse motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
