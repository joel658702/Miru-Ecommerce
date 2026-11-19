"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCOP } from "@miru/shared";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterBar } from "@/components/ui/FilterBar";
import { KanbanCard } from "@/components/ui/KanbanCard";
import { Toast, type ToastItem } from "@/components/ui/Toast";
import { dataSource } from "@/src/data";
import type { DataSourceState, OrderRecord, Plataforma } from "@/src/data/data-source";

const ORDER_STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "en_transito", label: "En tránsito" },
  { value: "entregado", label: "Entregado" },
  { value: "devuelto", label: "Devuelto" },
  { value: "cancelado", label: "Cancelado" },
  { value: "novedad", label: "Novedad" },
];

function PedidosContent() {
  const searchParams = useSearchParams();
  const stateParam = (searchParams.get("state") as DataSourceState) ?? "data";

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(stateParam === "loading");
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Plataforma[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Selected Order for Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    titulo: string,
    descripcion?: string,
    tone?: "success" | "info" | "warning" | "danger",
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, titulo, descripcion, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const loadOrders = async (targetState: DataSourceState) => {
    if (targetState === "loading") {
      setLoading(true);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await dataSource.getOrders(targetState);
      setOrders(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(stateParam);
  }, [stateParam]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Platform filter
      if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(order.plataforma)) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "todos" && order.estado !== selectedStatus) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchId = order.id.toLowerCase().includes(query);
        const matchGuia = order.guia.toLowerCase().includes(query);
        const matchClient = order.cliente.toLowerCase().includes(query);
        const matchProduct = order.producto.toLowerCase().includes(query);
        const matchCity = order.ciudad.toLowerCase().includes(query);
        if (!matchId && !matchGuia && !matchClient && !matchProduct && !matchCity) {
          return false;
        }
      }
      return true;
    });
  }, [orders, selectedPlatforms, selectedStatus, search]);

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

  const columns: Column<OrderRecord>[] = [
    {
      key: "id",
      header: "Pedido",
      render: (r) => (
        <span className="font-mono text-xs font-bold text-[var(--color-neutral-900)]">{r.id}</span>
      ),
    },
    {
      key: "cliente",
      header: "Cliente",
      render: (r) => (
        <div>
          <p className="font-medium text-[var(--color-neutral-900)] text-xs">{r.cliente}</p>
          <p className="text-[11px] text-[var(--color-neutral-500)]">{r.ciudad}</p>
        </div>
      ),
    },
    {
      key: "producto",
      header: "Producto / Cantidad",
      render: (r) => (
        <div className="max-w-[220px]">
          <p className="text-xs text-[var(--color-neutral-800)] truncate">{r.producto}</p>
          <p className="text-[11px] text-[var(--color-neutral-500)]">{r.unidades} un.</p>
        </div>
      ),
    },
    {
      key: "plataforma",
      header: "Canal",
      render: (r) => <StatusChip domain="plataforma" status={r.plataforma} size="sm" />,
    },
    {
      key: "guia",
      header: "Guía de transporte",
      render: (r) => (
        <div>
          <p className="font-mono text-xs text-[var(--color-neutral-700)]">{r.guia}</p>
          <p className="text-[11px] text-[var(--color-neutral-500)]">{r.transportadora}</p>
        </div>
      ),
    },
    {
      key: "valorTotal",
      header: "Total COP",
      render: (r) => (
        <span className="font-display font-semibold text-xs text-[var(--color-neutral-900)] tabular-nums">
          {formatCOP(r.valorTotalCents)}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (r) => <StatusChip domain="pedido" status={r.estado} size="sm" />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Toast Notification Container */}
      <Toast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Header and Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-neutral-900)]">
            Gestión de Pedidos
          </h1>
          <p className="text-xs text-[var(--color-neutral-500)]">
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "orden encontrada" : "órdenes encontradas"}
          </p>
        </div>

        {/* View Mode Toggle (Table / Kanban) */}
        <div className="inline-flex rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === "table"
                ? "bg-[var(--color-neutral-900)] text-white"
                : "text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            <span>Tabla</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            aria-pressed={viewMode === "kanban"}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === "kanban"
                ? "bg-[var(--color-neutral-900)] text-white"
                : "text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <span>Kanban</span>
          </button>
        </div>

        <a
          href="/api/data/export?tipo=pedidos"
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] px-3 text-xs font-semibold text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)] self-start sm:self-auto"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
            />
          </svg>
          Exportar CSV
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-level-1)]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por cliente, pedido, guía, ciudad o producto..."
          />
          <FilterBar
            selectedPlatforms={selectedPlatforms}
            onTogglePlatform={handleTogglePlatform}
            selectedStatus={selectedStatus}
            onChangeStatus={setSelectedStatus}
            statusOptions={ORDER_STATUS_OPTIONS}
            onClear={handleClearFilters}
            hasActiveFilters={
              selectedPlatforms.length > 0 || selectedStatus !== "todos" || search.length > 0
            }
          />
        </div>
      </div>

      {/* Main View: Table or Kanban */}
      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          rows={filteredOrders}
          keyExtractor={(r) => r.id}
          state={
            loading ? "loading" : error ? "error" : filteredOrders.length === 0 ? "empty" : "data"
          }
          onSelectRow={(r) => setSelectedOrder(r)}
          onRetry={() => loadOrders("data")}
          emptyTitle="No hay pedidos que coincidan"
          emptyDescription="Prueba modificando los filtros de plataforma o el término de búsqueda."
          emptyActionLabel="Restablecer filtros"
          onEmptyAction={handleClearFilters}
          renderMobileCard={(r) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--color-neutral-900)]">
                  {r.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusChip domain="plataforma" status={r.plataforma} size="sm" />
                  <StatusChip domain="pedido" status={r.estado} size="sm" />
                </div>
              </div>
              <p className="text-sm font-semibold text-[var(--color-neutral-900)]">{r.cliente}</p>
              <p className="text-xs text-[var(--color-neutral-600)]">
                {r.producto} ({r.unidades} un.) · {r.ciudad}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--color-neutral-100)] text-xs">
                <span className="font-mono text-[var(--color-neutral-500)]">{r.guia}</span>
                <span className="font-display font-bold text-[var(--color-neutral-900)] tabular-nums">
                  {formatCOP(r.valorTotalCents)}
                </span>
              </div>
            </div>
          )}
        />
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => (
            <KanbanCard
              key={order.id}
              id={order.id}
              title={order.cliente}
              subtitle={`${order.producto} (${order.unidades} un.)`}
              metaLine={`${order.ciudad} · ${order.transportadora}`}
              amountCents={order.valorTotalCents}
              plataforma={order.plataforma}
              status={order.estado}
              domain="pedido"
              onInspect={() => setSelectedOrder(order)}
              quickActionLabel="Ver detalle"
              onQuickAction={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      )}

      {/* Order Detail Modal / Drawer */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-detail-title"
          className="fixed inset-0 z-50 flex justify-end bg-[var(--color-surface-inverse)]/40 backdrop-blur-[3px]"
          onClick={() => setSelectedOrder(null)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col bg-[var(--color-surface-card)] border-l border-[var(--color-border-subtle)] shadow-[var(--shadow-level-3)] animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-[var(--color-neutral-500)]">
                  Pedido {selectedOrder.id}
                </p>
                <h2
                  id="order-detail-title"
                  className="font-display text-lg font-bold text-[var(--color-neutral-900)] truncate"
                >
                  {selectedOrder.cliente}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Cerrar panel de detalle"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip domain="pedido" status={selectedOrder.estado} />
                <StatusChip domain="plataforma" status={selectedOrder.plataforma} />
              </div>

              {/* Novedad Alert */}
              {selectedOrder.novedadDetalle && (
                <div
                  role="status"
                  className="rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3.5 text-xs text-[var(--color-warning-text)] leading-relaxed"
                >
                  <span className="font-bold">Novedad registrada: </span>
                  {selectedOrder.novedadDetalle}
                </div>
              )}

              {/* Financial Box */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-4">
                <div>
                  <p className="text-xs text-[var(--color-neutral-500)]">Valor total</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-[var(--color-neutral-900)] tabular-nums">
                    {formatCOP(selectedOrder.valorTotalCents)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-neutral-500)]">Costo de flete</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--color-neutral-700)] tabular-nums">
                    {formatCOP(selectedOrder.costoFleteCents)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-neutral-500)]">Utilidad neta</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-[var(--color-success-text)] tabular-nums">
                    {formatCOP(selectedOrder.utilidadNetaCents)}
                  </p>
                </div>
              </div>

              {/* Logistics & Delivery details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-4 w-4 text-[var(--color-neutral-500)] mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-[var(--color-neutral-900)]">
                      {selectedOrder.producto}
                    </p>
                    <p className="text-xs text-[var(--color-neutral-500)]">
                      {selectedOrder.unidades}{" "}
                      {selectedOrder.unidades === 1 ? "unidad" : "unidades"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="h-4 w-4 text-[var(--color-neutral-500)] mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-[var(--color-neutral-900)]">
                      {selectedOrder.transportadora}
                    </p>
                    <p className="font-mono text-xs text-[var(--color-neutral-600)]">
                      Guía {selectedOrder.guia}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="h-4 w-4 text-[var(--color-neutral-500)] mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-[var(--color-neutral-700)]">{selectedOrder.ciudad}</p>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="h-4 w-4 text-[var(--color-neutral-500)] mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <p className="font-mono text-xs text-[var(--color-neutral-700)]">
                    {selectedOrder.telefono}
                  </p>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-[var(--color-neutral-500)] mb-3 uppercase">
                  Trazabilidad de la transportadora
                </h3>
                <ol className="space-y-3 border-l border-[var(--color-border-subtle)] ml-2 pl-4">
                  {selectedOrder.historial.map((step, idx) => (
                    <li key={idx} className="relative">
                      <span
                        className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-surface-card)]"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-[var(--color-neutral-900)]">
                        {step.titulo}
                      </p>
                      <p className="text-xs text-[var(--color-neutral-500)]">
                        {step.timestamp} · {step.ubicacion}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="border-t border-[var(--color-border-subtle)] p-4 flex items-center justify-end gap-2.5 bg-[var(--color-surface-canvas)]">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="min-h-[44px] rounded-lg border border-[var(--color-border-interactive)] bg-[var(--color-surface-card)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-700)] hover:bg-[var(--color-surface-canvas)] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  addToast(
                    "Guía copiada",
                    `Guía ${selectedOrder.guia} copiada al portapapeles.`,
                    "success",
                  );
                }}
                className="min-h-[44px] rounded-lg bg-[var(--color-neutral-900)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-neutral-800)] cursor-pointer"
              >
                Copiar guía
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function PedidosPage() {
  return (
    <AppShell title="Pedidos">
      <Suspense
        fallback={
          <div className="h-64 rounded-xl border border-[var(--color-border-subtle)] animate-pulse" />
        }
      >
        <PedidosContent />
      </Suspense>
    </AppShell>
  );
}
