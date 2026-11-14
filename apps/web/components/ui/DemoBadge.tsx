import React from "react";

export function DemoBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-warning-text)] shadow-xs"
      title="Entorno DEMO — Montos y registros de prueba ficticios (P8b)"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning-solid)]" aria-hidden="true" />
      <span>DEMO</span>
    </span>
  );
}
