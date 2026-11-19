import type { SupabaseClient } from "@supabase/supabase-js";

/** Misma zona y reglas que la WebApp (`apps/web/src/server/aggregate.ts`). */
export const TIME_ZONE = "America/Bogota";

const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export interface DayOrderFacts {
  estado: string;
  subtotalCents: number;
  feeMiruCents: number;
}

export interface DailyTotals {
  ventasBrutasCents: number;
  feeMiruCents: number;
  utilidadNetaCents: number;
  pedidosTotal: number;
  entregados: number;
  devueltos: number;
}

/**
 * Regla del dueño (19-nov-2026):
 *  - Ventas y fee: todos los pedidos no cancelados del día.
 *  - Utilidad: fee de ENTREGADOS menos fee de DEVUELTOS.
 *  - Fletes: no se cuentan (los paga el dropshipper).
 */
export function computeDailyTotals(orders: DayOrderFacts[]): DailyTotals {
  let ventasBrutas = 0;
  let feeMiru = 0;
  let feeEntregados = 0;
  let feeDevueltos = 0;
  let entregados = 0;
  let devueltos = 0;

  for (const order of orders) {
    if (order.estado === "cancelado") {
      continue;
    }

    ventasBrutas += order.subtotalCents;
    feeMiru += order.feeMiruCents;

    if (order.estado === "entregado") {
      feeEntregados += order.feeMiruCents;
      entregados += 1;
    } else if (order.estado === "devuelto") {
      feeDevueltos += order.feeMiruCents;
      devueltos += 1;
    }
  }

  return {
    ventasBrutasCents: ventasBrutas,
    feeMiruCents: feeMiru,
    utilidadNetaCents: feeEntregados - feeDevueltos,
    pedidosTotal: orders.length,
    entregados,
    devueltos,
  };
}

/** Día calendario en Bogotá (UTC-5 todo el año), como `YYYY-MM-DD`. */
export function bogotaDayKey(date: Date = new Date()): string {
  return DAY_KEY_FORMAT.format(date);
}

/** Rango [inicio, fin) del día en Bogotá, listo para comparar timestamps. */
export function bogotaDayRange(dayKey: string): { startIso: string; endIso: string } {
  const [year, month, day] = dayKey.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Día inválido: ${dayKey}`);
  }

  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextKey = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(
    next.getUTCDate(),
  ).padStart(2, "0")}`;

  return { startIso: `${dayKey}T00:00:00-05:00`, endIso: `${nextKey}T00:00:00-05:00` };
}

/**
 * Recalcula y guarda la fila de métricas del día para un tenant. Es la señal de
 * Realtime del dashboard (D-08): una fila por día y tenant.
 */
export async function refreshDailyMetrics(
  supabase: SupabaseClient,
  tenantId: string,
  now: Date = new Date(),
): Promise<DailyTotals> {
  const dia = bogotaDayKey(now);
  const { startIso, endIso } = bogotaDayRange(dia);

  const { data, error } = await supabase
    .from("orders")
    .select("estado, subtotal_cents, fee_miru_cents")
    .eq("tenant_id", tenantId)
    .gte("external_created_at", startIso)
    .lt("external_created_at", endIso);

  if (error !== null) {
    throw error;
  }

  const totals = computeDailyTotals(
    ((data ?? []) as { estado: string; subtotal_cents: number; fee_miru_cents: number }[]).map(
      (row) => ({
        estado: row.estado,
        subtotalCents: row.subtotal_cents,
        feeMiruCents: row.fee_miru_cents,
      }),
    ),
  );

  const openWarranties = await supabase
    .from("warranties")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("estado", ["solicitada", "en_revision"]);

  if (openWarranties.error !== null) {
    throw openWarranties.error;
  }

  const { error: upsertError } = await supabase.from("dashboard_metrics_daily").upsert(
    {
      tenant_id: tenantId,
      dia,
      ventas_brutas_cents: totals.ventasBrutasCents,
      fee_miru_cents: totals.feeMiruCents,
      costo_fletes_cents: 0,
      utilidad_neta_cents: totals.utilidadNetaCents,
      pedidos_total: totals.pedidosTotal,
      entregados: totals.entregados,
      devueltos: totals.devueltos,
      garantias_abiertas: openWarranties.count ?? 0,
    },
    { onConflict: "tenant_id,dia" },
  );

  if (upsertError !== null) {
    throw upsertError;
  }

  return totals;
}
