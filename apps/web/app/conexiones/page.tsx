"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { StatusChip } from "@/components/ui/StatusChip";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { demoDataSource } from "@/src/data/demo-data-source";
import type { ConnectionRecord, DataSourceState } from "@/src/data/data-source";

function ConexionesContent() {
  const searchParams = useSearchParams();
  const stateParam = (searchParams.get("state") as DataSourceState) ?? "data";

  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [loading, setLoading] = useState(stateParam === "loading");
  const [error, setError] = useState<string | null>(null);

  const loadConnections = async (targetState: DataSourceState) => {
    if (targetState === "loading") {
      setLoading(true);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await demoDataSource.getConnections(targetState);
      setConnections(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar conexiones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections(stateParam);
  }, [stateParam]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Error al consultar conexiones"
        description={error}
        onRetry={() => loadConnections("data")}
      />
    );
  }

  if (connections.length === 0 || stateParam === "empty") {
    return (
      <EmptyState
        title="Sin integraciones configuradas"
        description="Aún no se han configurado endpoints de webhook para recibir eventos de transportadoras."
        actionLabel="Restablecer"
        onAction={() => loadConnections("data")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-neutral-900)]">
          Conexiones y Webhooks
        </h1>
        <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
          Monitoreo de ingesta canónica Miru v1 con verificación HMAC-SHA256 y ventana ±5 min
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-level-1)] space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <StatusChip domain="plataforma" status={conn.plataforma} />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--color-success-text)] border border-[var(--color-success-border)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success-solid)]" aria-hidden="true" />
                  <span>Activa</span>
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Endpoint canónico</p>
                <p className="mt-1 font-mono text-xs text-[var(--color-neutral-800)] bg-[var(--color-surface-canvas)] p-2 rounded-lg border border-[var(--color-border-subtle)] break-all">
                  {conn.webhookUrl}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[var(--color-neutral-500)]">Último evento:</span>
                  <p className="font-medium text-[var(--color-neutral-800)]">{conn.ultimoEvento}</p>
                </div>
                <div>
                  <span className="text-[var(--color-neutral-500)]">Eventos hoy:</span>
                  <p className="font-mono font-bold text-[var(--color-neutral-900)]">{conn.eventosHoy}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--color-border-subtle)] pt-3 text-[11px] text-[var(--color-neutral-500)] flex items-center justify-between">
              <span>Contrato {conn.versionContrato}</span>
              <span className="font-semibold text-[var(--color-primary)]">ACK &lt; 500 ms</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-5 space-y-3">
        <h3 className="font-display text-sm font-bold text-[var(--color-neutral-900)]">
          Especificación de Seguridad de Webhooks (D-07)
        </h3>
        <ul className="text-xs text-[var(--color-neutral-600)] space-y-1.5 list-disc list-inside">
          <li>Validación HMAC-SHA256 del body crudo antes de cualquier deserialización.</li>
          <li>Ventana estricta de timestamp ±300 segundos (±5 minutos).</li>
          <li>Idempotencia por unicidad en <code className="font-mono text-[var(--color-neutral-800)]">(connection_id, external_event_id)</code>.</li>
          <li>Respuesta inmediata 200 OK en &lt; 500 ms y delegación asíncrona hacia BullMQ.</li>
        </ul>
      </div>
    </div>
  );
}

export default function ConexionesPage() {
  return (
    <AppShell title="Conexiones">
      <Suspense fallback={<div className="h-64 rounded-xl border border-[var(--color-border-subtle)] animate-pulse" />}>
        <ConexionesContent />
      </Suspense>
    </AppShell>
  );
}
