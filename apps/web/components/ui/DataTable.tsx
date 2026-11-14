import React, { type ReactNode } from "react";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  state?: "data" | "loading" | "empty" | "error";
  onSelectRow?: (row: T) => void;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  renderMobileCard?: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  state = "data",
  onSelectRow,
  onRetry,
  emptyTitle = "Sin registros para mostrar",
  emptyDescription = "No hay datos que coincidan con los criterios seleccionados.",
  emptyActionLabel,
  onEmptyAction,
  renderMobileCard,
}: DataTableProps<T>) {
  if (state === "loading") {
    return <Skeleton variant="table" rows={5} />;
  }

  if (state === "error") {
    return (
      <ErrorState
        title="Error al consultar registros"
        description="No fue posible sincronizar los datos de la tabla. Por favor reintenta la operación."
        onRetry={onRetry}
      />
    );
  }

  if (state === "empty" || rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] shadow-[var(--shadow-level-1)] overflow-hidden">
      {/* Desktop View: Dense Table (48px row height) */}
      <div className="hidden md:block overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de datos">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] text-xs font-semibold uppercase tracking-wider text-[var(--color-neutral-500)]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={`px-4 py-3.5 whitespace-nowrap ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {rows.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onSelectRow?.(row)}
                className={`h-12 transition-colors ${
                  onSelectRow ? "hover:bg-[var(--color-surface-canvas)] cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-2.5 whitespace-nowrap ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Cards */}
      <div className="block md:hidden divide-y divide-[var(--color-border-subtle)]">
        {rows.map((row) => (
          <div
            key={keyExtractor(row)}
            onClick={() => onSelectRow?.(row)}
            className={`p-4 transition-colors ${
              onSelectRow ? "active:bg-[var(--color-surface-canvas)] cursor-pointer" : ""
            }`}
          >
            {renderMobileCard ? (
              renderMobileCard(row)
            ) : (
              <div className="space-y-2">
                {columns.map((col) => (
                  <div key={col.key} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--color-neutral-500)]">{col.header}:</span>
                    <span className="text-[var(--color-neutral-900)]">{col.render(row)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
