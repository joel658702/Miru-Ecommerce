"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCOP } from "@miru/shared";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { demoDataSource } from "@/src/data/demo-data-source";
import type { DataSourceState, FinanceSummary } from "@/src/data/data-source";

function FinanzasContent() {
  const searchParams = useSearchParams();
  const stateParam = (searchParams.get("state") as DataSourceState) ?? "data";

  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(stateParam === "loading");
  const [error, setError] = useState<string | null>(null);

  const loadFinance = async (targetState: DataSourceState) => {
    if (targetState === "loading") {
      setLoading(true);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await demoDataSource.getFinanceSummary(targetState);
      setFinance(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar balance financiero.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinance(stateParam);
  }, [stateParam]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="kpi" />
          ))}
        </div>
        <Skeleton variant="table" rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Error al consultar finanzas"
        description={error}
        onRetry={() => loadFinance("data")}
      />
    );
  }

  if (!finance || (stateParam === "empty" && finance.ventasBrutasCents === 0)) {
    return (
      <EmptyState
        title="Sin registros financieros"
        description="No hay movimientos registrados para el período seleccionado."
        actionLabel="Restablecer"
        onAction={() => loadFinance("data")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-neutral-900)]">
          Balance Financiero y Liquidación
        </h1>
        <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
          Consolidado monetario en COP (valores enteros en centavos sin redondeo float)
        </p>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ventas brutas"
          value={formatCOP(finance.ventasBrutasCents)}
          delta="+12,4 %"
          deltaTone="positive"
          helperText="Ingreso bruto consolidado"
          accent="cyan"
        />

        <KpiCard
          label="Fee Miru 5%"
          value={finance.feeMiruCents !== null ? formatCOP(finance.feeMiruCents) : "—"}
          helperText="Columna generada en BD"
          accent="default"
        />

        <KpiCard
          label="Costo de fletes"
          value={formatCOP(finance.costoFletesCents)}
          delta="-2,1 %"
          deltaTone="positive"
          helperText="Descuento logístico"
          accent="default"
        />

        <KpiCard
          label="Utilidad neta"
          value={formatCOP(finance.utilidadNetaCents)}
          delta="+8,7 %"
          deltaTone="positive"
          helperText="Resultado operativo consolidado"
          accent="emerald"
        />
      </div>

      {/* Platform Breakdown */}
      <section className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-level-1)] space-y-4">
        <div>
          <h2 className="font-display text-base font-bold text-[var(--color-neutral-900)]">
            Desglose por Plataforma de Dropshipping
          </h2>
          <p className="text-xs text-[var(--color-neutral-500)]">
            Distribución de volumen transaccional y deducciones por canal
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] text-xs font-semibold uppercase text-[var(--color-neutral-500)]">
              <tr>
                <th scope="col" className="px-4 py-3">Canal</th>
                <th scope="col" className="px-4 py-3">Pedidos</th>
                <th scope="col" className="px-4 py-3">Ventas Brutas</th>
                <th scope="col" className="px-4 py-3">Fletes</th>
                <th scope="col" className="px-4 py-3">Fee Miru (5%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {finance.desglosePlataforma.map((item) => (
                <tr key={item.plataforma} className="h-12 hover:bg-[var(--color-surface-canvas)] transition-colors">
                  <td className="px-4 py-2.5">
                    <StatusChip domain="plataforma" status={item.plataforma} size="sm" />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-neutral-800)]">
                    {item.pedidos}
                  </td>
                  <td className="px-4 py-2.5 font-display font-semibold text-xs text-[var(--color-neutral-900)] tabular-nums">
                    {formatCOP(item.ventasCents)}
                  </td>
                  <td className="px-4 py-2.5 font-display text-xs text-[var(--color-neutral-600)] tabular-nums">
                    {formatCOP(item.fletesCents)}
                  </td>
                  <td className="px-4 py-2.5 font-display text-xs text-[var(--color-neutral-400)] tabular-nums">
                    —
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg bg-[var(--color-surface-canvas)] p-3 border border-[var(--color-border-subtle)] text-xs text-[var(--color-neutral-600)]">
          <p className="font-semibold text-[var(--color-neutral-900)]">Regla financiera bloqueada (D-04 y D-05):</p>
          <p className="mt-0.5">
            Los montos se almacenan estrictamente como enteros en centavos (BIGINT en PostgreSQL).
            El fee de Miru se calcula por trigger a nivel de fila en la base de datos y nunca en la aplicación web.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function FinanzasPage() {
  return (
    <AppShell title="Finanzas">
      <Suspense fallback={<div className="h-64 rounded-xl border border-[var(--color-border-subtle)] animate-pulse" />}>
        <FinanzasContent />
      </Suspense>
    </AppShell>
  );
}
