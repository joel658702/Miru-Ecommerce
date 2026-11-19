"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCOP } from "@miru/shared";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterBar } from "@/components/ui/FilterBar";
import { Toast, type ToastItem } from "@/components/ui/Toast";
import { dataSource } from "@/src/data";
import type { DataSourceState, Plataforma, WarrantyRecord } from "@/src/data/data-source";

const WARRANTY_STATUS_OPTIONS = [
  { value: "solicitada", label: "Solicitada" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "reembolsada", label: "Reembolsada" },
];

function GarantiasContent() {
  const searchParams = useSearchParams();
  const stateParam = (searchParams.get("state") as DataSourceState) ?? "data";

  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(stateParam === "loading");
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Plataforma[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRecord | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (titulo: string, descripcion?: string, tone?: "success" | "info" | "warning" | "danger") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, titulo, descripcion, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const loadWarranties = async (targetState: DataSourceState) => {
    if (targetState === "loading") {
      setLoading(true);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await dataSource.getWarranties(targetState);
      setWarranties(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar garantías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarranties(stateParam);
  }, [stateParam]);

  const filteredWarranties = useMemo(() => {
    return warranties.filter((w) => {
      if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(w.plataforma)) {
        return false;
      }
      if (selectedStatus !== "todos" && w.estado !== selectedStatus) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchId = w.id.toLowerCase().includes(query);
        const matchOrder = w.pedidoId.toLowerCase().includes(query);
        const matchClient = w.cliente.toLowerCase().includes(query);
        const matchProduct = w.producto.toLowerCase().includes(query);
        if (!matchId && !matchOrder && !matchClient && !matchProduct) {
          return false;
        }
      }
      return true;
    });
  }, [warranties, selectedPlatforms, selectedStatus, search]);

  const handleTogglePlatform = (p: Plataforma) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p],
    );
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedPlatforms([]);
    setSelectedStatus("todos");
  };

  const columns: Column<WarrantyRecord>[] = [
    {
      key: "id",
      header: "Caso",
      render: (w) => (
        <span className="font-mono text-xs font-bold text-[var(--color-neutral-900)]">
          {w.id}
        </span>
      ),
    },
    {
      key: "pedidoId",
      header: "Pedido Relacionado",
      render: (w) => (
        <span className="font-mono text-xs text-[var(--color-primary)]">
          {w.pedidoId}
        </span>
      ),
    },
    {
      key: "cliente",
      header: "Cliente / Ciudad",
      render: (w) => (
        <div>
          <p className="text-xs font-semibold text-[var(--color-neutral-900)]">{w.cliente}</p>
          <p className="text-[11px] text-[var(--color-neutral-500)]">{w.ciudad}</p>
        </div>
      ),
    },
    {
      key: "producto",
      header: "Producto Reclamado",
      render: (w) => (
        <div className="max-w-[200px]">
          <p className="text-xs text-[var(--color-neutral-800)] truncate">{w.producto}</p>
        </div>
      ),
    },
    {
      key: "plataforma",
      header: "Canal",
      render: (w) => <StatusChip domain="plataforma" status={w.plataforma} size="sm" />,
    },
    {
      key: "monto",
      header: "Monto Reclamado",
      render: (w) => (
        <span className="font-display font-semibold text-xs text-[var(--color-neutral-900)] tabular-nums">
          {formatCOP(w.montoSolicitadoCents)}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado Garantía",
      render: (w) => <StatusChip domain="garantia" status={w.estado} size="sm" />,
    },
  ];

  return (
    <div className="space-y-5">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-neutral-900)]">
            Módulo de Garantías y Reclamaciones
          </h1>
          <p className="text-xs text-[var(--color-neutral-500)]">
            {filteredWarranties.length} casos registrados en la plataforma
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-level-1)]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por caso, pedido asociado, cliente o producto..."
          />
          <FilterBar
            selectedPlatforms={selectedPlatforms}
            onTogglePlatform={handleTogglePlatform}
            selectedStatus={selectedStatus}
            onChangeStatus={setSelectedStatus}
            statusOptions={WARRANTY_STATUS_OPTIONS}
            onClear={handleClearFilters}
            hasActiveFilters={selectedPlatforms.length > 0 || selectedStatus !== "todos" || search.length > 0}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filteredWarranties}
        keyExtractor={(w) => w.id}
        state={loading ? "loading" : error ? "error" : filteredWarranties.length === 0 ? "empty" : "data"}
        onSelectRow={(w) => setSelectedWarranty(w)}
        onRetry={() => loadWarranties("data")}
        emptyTitle="Sin garantías para mostrar"
        emptyDescription="No se encontraron casos de garantía con los filtros seleccionados."
        emptyActionLabel="Restablecer filtros"
        onEmptyAction={handleClearFilters}
      />

      {/* Warranty Detail Drawer */}
      {selectedWarranty && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-[var(--color-surface-inverse)]/40 backdrop-blur-[3px]"
          onClick={() => setSelectedWarranty(null)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col bg-[var(--color-surface-card)] border-l border-[var(--color-border-subtle)] shadow-[var(--shadow-level-3)] animate-in slide-in-from-right duration-200"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-[var(--color-neutral-500)]">
                  Garantía {selectedWarranty.id}
                </p>
                <h2 className="font-display text-lg font-bold text-[var(--color-neutral-900)] truncate">
                  {selectedWarranty.cliente}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                aria-label="Cerrar panel de garantía"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip domain="garantia" status={selectedWarranty.estado} />
                <StatusChip domain="plataforma" status={selectedWarranty.plataforma} />
              </div>

              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-neutral-500)]">Pedido asociado:</span>
                  <span className="font-mono font-bold text-[var(--color-neutral-900)]">
                    {selectedWarranty.pedidoId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-neutral-500)]">Monto reclamado:</span>
                  <span className="font-display text-base font-bold text-[var(--color-neutral-900)] tabular-nums">
                    {formatCOP(selectedWarranty.montoSolicitadoCents)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-neutral-500)]">Producto</p>
                  <p className="mt-0.5 font-medium text-[var(--color-neutral-900)]">{selectedWarranty.producto}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[var(--color-neutral-500)]">Motivo reportado por el comprador</p>
                  <p className="mt-1 text-xs text-[var(--color-neutral-700)] bg-[var(--color-surface-canvas)] p-3 rounded-lg border border-[var(--color-border-subtle)] leading-relaxed">
                    {selectedWarranty.motivo}
                  </p>
                </div>

                {selectedWarranty.resolucionNota && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-neutral-500)]">Nota de resolución operativa</p>
                    <p className="mt-1 text-xs text-[var(--color-neutral-700)] bg-[var(--color-surface-canvas)] p-3 rounded-lg border border-[var(--color-border-subtle)] leading-relaxed">
                      {selectedWarranty.resolucionNota}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--color-border-subtle)] p-4 flex items-center justify-end gap-2.5 bg-[var(--color-surface-canvas)]">
              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                className="min-h-[44px] rounded-lg border border-[var(--color-border-interactive)] bg-[var(--color-surface-card)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-700)] hover:bg-[var(--color-surface-canvas)] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  addToast("Caso actualizado", `Caso ${selectedWarranty.id} marcado como revisado.`, "info");
                }}
                className="min-h-[44px] rounded-lg bg-[var(--color-neutral-900)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-neutral-800)] cursor-pointer"
              >
                Actualizar gestión
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function GarantiasPage() {
  return (
    <AppShell title="Garantías">
      <Suspense fallback={<div className="h-64 rounded-xl border border-[var(--color-border-subtle)] animate-pulse" />}>
        <GarantiasContent />
      </Suspense>
    </AppShell>
  );
}
