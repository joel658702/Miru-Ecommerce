"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatCOP } from "@miru/shared";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { dataSource } from "@/src/data";
import { useDashboardRealtime } from "@/src/lib/supabase/use-dashboard-realtime";
import type { DataSourceState, KpiSummary, OrderRecord } from "@/src/data/data-source";

function DashboardContent() {
  const searchParams = useSearchParams();
  const stateParam = (searchParams.get("state") as DataSourceState) ?? "data";

  const [loading, setLoading] = useState(stateParam === "loading");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<KpiSummary | null>(null);

  const loadData = async (targetState: DataSourceState) => {
    if (targetState === "loading") {
      setLoading(true);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await dataSource.getKpis(targetState);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar KPIs del dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(stateParam);
  }, [stateParam]);

  // Realtime sobre `dashboard_metrics_daily` (D-08): refresca al cambiar el día.
  useDashboardRealtime(() => {
    void loadData(stateParam);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="kpi" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 h-72 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] animate-pulse" />
          <div className="lg:col-span-5 h-72 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] animate-pulse" />
        </div>
        <Skeleton variant="table" rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="No pudimos cargar el dashboard"
        description={error}
        onRetry={() => loadData("data")}
      />
    );
  }

  if (!data || (stateParam === "empty" && data.pedidosTotal === 0)) {
    return (
      <EmptyState
        title="Sin actividad registrada"
        description="Aún no hay pedidos ni métricas acumuladas en el período seleccionado."
        actionLabel="Restablecer vista"
        onAction={() => loadData("data")}
      />
    );
  }

  // Pure SVG/CSS 7-Day Logistics Chart
  const maxBarValue = Math.max(
    ...data.despachosVsEntregados7d.map((d) => Math.max(d.despachados, d.entregados)),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-[28px] font-bold tracking-tight text-[var(--color-neutral-900)]">
            Resumen Operativo
          </h1>
          <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
            Consolidado logístico, financiero y multicanal (Dropi · MasterShop · Effi)
          </p>
        </div>

        <Link
          href="/pedidos"
          className="inline-flex min-h-[44px] md:min-h-[40px] items-center gap-2 self-start rounded-lg bg-[var(--color-neutral-900)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-neutral-800)] whitespace-nowrap"
        >
          <span>Ver todos los pedidos</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      </div>

      {/* 8 Primary Financial and Operational KPIs (Fixed Drift) */}
      <section
        aria-label="Indicadores financieros clave"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* 1. Ventas brutas */}
        <KpiCard
          label="Ventas brutas"
          value={formatCOP(data.ventasBrutasCents)}
          helperText="Todos los pedidos no cancelados"
          accent="cyan"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
        />

        {/* 2. FEE MIRU 5% (Muestra "—" en demo; prohibido calcular en cliente) */}
        <KpiCard
          label="Fee Miru 5%"
          value={data.feeMiruCents !== null ? formatCOP(data.feeMiruCents) : "—"}
          helperText="Calculado en base de datos"
          accent="default"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
              />
            </svg>
          }
        />

        {/* 3. Costo de fletes */}
        <KpiCard
          label="Costo de fletes"
          value={formatCOP(data.costoFletesCents)}
          helperText="Los paga el dropshipper"
          accent="default"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          }
        />

        {/* 4. Utilidad neta (sin palabra "estimada") */}
        <KpiCard
          label="Utilidad neta"
          value={formatCOP(data.utilidadNetaCents)}
          helperText="5 % de entregados − devueltos"
          accent="emerald"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        {/* 5. Pedidos */}
        <KpiCard
          label="Pedidos totales"
          value={data.pedidosTotal.toString()}
          helperText="Órdenes sincronizadas"
          accent="default"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          }
        />

        {/* 6. Entregados */}
        <KpiCard
          label="Entregados"
          value={data.entregados.toString()}
          delta={data.tasaEntregaEfectiva !== null ? `${data.tasaEntregaEfectiva} %` : undefined}
          deltaTone="positive"
          helperText="Efectividad en destino"
          accent="emerald"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          }
        />

        {/* 7. Devueltos */}
        <KpiCard
          label="Devueltos"
          value={data.devueltos.toString()}
          delta={
            data.entregados + data.devueltos > 0
              ? `${Math.round((data.devueltos / (data.entregados + data.devueltos)) * 100)} %`
              : undefined
          }
          deltaTone="negative"
          helperText="Tasa de devolución"
          accent="amber"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          }
        />

        {/* 8. Garantías abiertas */}
        <KpiCard
          label="Garantías abiertas"
          value={data.garantiasAbiertas.toString()}
          helperText="Casos en revisión o trámite"
          accent="default"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          }
        />
      </section>

      {/* Pure SVG/CSS Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 7-Day Chart: Despachados vs Entregados */}
        <div className="lg:col-span-7 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-level-1)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-[var(--color-neutral-900)]">
                Flujo Logístico — Últimos 7 Días
              </h2>
              <p className="text-xs text-[var(--color-neutral-500)]">
                Comparativa de paquetes despachados frente a entregas efectivas
              </p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-[var(--color-neutral-700)]">
                <span
                  className="h-3 w-3 rounded-xs bg-[var(--color-primary-bright)]"
                  aria-hidden="true"
                />
                Despachados
              </span>
              <span className="flex items-center gap-1.5 text-[var(--color-neutral-700)]">
                <span
                  className="h-3 w-3 rounded-xs bg-[var(--color-accent-emerald)]"
                  aria-hidden="true"
                />
                Entregados
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-56 w-full pt-4">
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line
                x1="0"
                y1="40"
                x2="500"
                y2="40"
                stroke="var(--color-border-subtle)"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1="90"
                x2="500"
                y2="90"
                stroke="var(--color-border-subtle)"
                strokeDasharray="3 3"
              />
              <line
                x1="0"
                y1="140"
                x2="500"
                y2="140"
                stroke="var(--color-border-subtle)"
                strokeDasharray="3 3"
              />
              <line x1="0" y1="175" x2="500" y2="175" stroke="var(--color-border-subtle)" />

              {/* Data Bars */}
              {data.despachosVsEntregados7d.map((day, idx) => {
                const groupWidth = 500 / 7;
                const xCenter = idx * groupWidth + groupWidth / 2;
                const barWidth = 14;

                const despHeight = (day.despachados / maxBarValue) * 125;
                const entHeight = (day.entregados / maxBarValue) * 125;

                const despY = 175 - despHeight;
                const entY = 175 - entHeight;

                return (
                  <g key={day.dia}>
                    {/* Despachado Bar */}
                    <rect
                      x={xCenter - barWidth - 2}
                      y={despY}
                      width={barWidth}
                      height={despHeight}
                      rx="3"
                      fill="var(--color-primary-bright)"
                    >
                      <title>{`${day.dia}: ${day.despachados} despachados`}</title>
                    </rect>

                    {/* Entregado Bar */}
                    <rect
                      x={xCenter + 2}
                      y={entY}
                      width={barWidth}
                      height={entHeight}
                      rx="3"
                      fill="var(--color-accent-emerald)"
                    >
                      <title>{`${day.dia}: ${day.entregados} entregados`}</title>
                    </rect>

                    {/* Day Label */}
                    <text
                      x={xCenter}
                      y="194"
                      textAnchor="middle"
                      fill="var(--color-neutral-500)"
                      fontSize="11"
                      fontFamily="var(--font-sans)"
                      fontWeight="500"
                    >
                      {day.dia}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Platform Share: Participación por plataforma */}
        <div className="lg:col-span-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-level-1)] space-y-4 flex flex-col justify-between">
          <div className="border-b border-[var(--color-border-subtle)] pb-3">
            <h2 className="font-display text-base font-bold text-[var(--color-neutral-900)]">
              Participación por Plataforma
            </h2>
            <p className="text-xs text-[var(--color-neutral-500)]">
              Distribución porcentual de pedidos importados vía webhook
            </p>
          </div>

          {/* Pure CSS Segmented Progress Bar */}
          <div className="space-y-3">
            <div className="h-4 w-full rounded-full overflow-hidden flex bg-[var(--color-neutral-100)]">
              {data.participacionPlataforma.map((p) => {
                const color =
                  p.plataforma === "Dropi"
                    ? "bg-[var(--color-plataforma-dropi-dot)]"
                    : p.plataforma === "MasterShop"
                      ? "bg-[var(--color-plataforma-mastershop-dot)]"
                      : "bg-[var(--color-plataforma-effi-dot)]";
                return (
                  <div
                    key={p.plataforma}
                    style={{ width: `${p.porcentaje}%` }}
                    className={`${color} h-full transition-all`}
                    title={`${p.plataforma}: ${p.porcentaje}% (${p.pedidos} pedidos)`}
                  />
                );
              })}
            </div>

            {/* Platform Legend & Percentages */}
            <div className="grid grid-cols-1 gap-2 pt-2">
              {data.participacionPlataforma.map((p) => (
                <div
                  key={p.plataforma}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border-subtle)] p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <StatusChip domain="plataforma" status={p.plataforma} size="sm" />
                    <span className="text-[var(--color-neutral-600)]">{p.pedidos} pedidos</span>
                  </div>
                  <span className="font-display text-sm font-bold text-[var(--color-neutral-900)] tabular-nums">
                    {p.porcentaje}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-[var(--color-surface-canvas)] p-3 border border-[var(--color-border-subtle)] text-xs text-[var(--color-neutral-600)]">
            <span className="font-semibold text-[var(--color-neutral-900)]">
              Nota de sincronización:{" "}
            </span>
            La ingesta canónica Miru v1 valida HMAC-SHA256 en menos de 500ms para todos los canales.
          </div>
        </div>
      </section>

      {/* Lista: Pedidos que requieren gestión */}
      <section className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-level-1)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
          <div>
            <h2 className="font-display text-base font-bold text-[var(--color-neutral-900)]">
              Pedidos que Requieren Gestión
            </h2>
            <p className="text-xs text-[var(--color-neutral-500)]">
              Órdenes con novedades de transporte o pendientes de confirmación
            </p>
          </div>
          <Link
            href="/pedidos"
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>Ver todos los pedidos ({data.pedidosTotal})</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {data.pedidosRequierenGestion.length === 0 ? (
          <p className="text-sm text-[var(--color-neutral-500)] py-4 text-center">
            No hay pedidos con novedades pendientes en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.pedidosRequierenGestion.map((order: OrderRecord) => (
              <div
                key={order.id}
                className="rounded-xl border border-[var(--color-border-subtle)] p-4 space-y-3 bg-[var(--color-surface-canvas)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--color-neutral-900)]">
                    {order.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusChip domain="plataforma" status={order.plataforma} size="sm" />
                    <StatusChip domain="pedido" status={order.estado} size="sm" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--color-neutral-900)]">
                    {order.cliente}
                  </p>
                  <p className="text-xs text-[var(--color-neutral-600)] truncate">
                    {order.producto} ({order.unidades} un.) · {order.ciudad}
                  </p>
                </div>

                {order.novedadDetalle && (
                  <p className="rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-2 text-xs text-[var(--color-warning-text)] leading-relaxed">
                    <span className="font-bold">Novedad: </span>
                    {order.novedadDetalle}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border-subtle)] text-xs">
                  <span className="text-[var(--color-neutral-500)] font-mono">
                    Guía: {order.guia}
                  </span>
                  <span className="font-display font-bold text-[var(--color-neutral-900)] tabular-nums">
                    {formatCOP(order.valorTotalCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard General">
      <Suspense fallback={<Skeleton variant="table" rows={6} />}>
        <DashboardContent />
      </Suspense>
    </AppShell>
  );
}
