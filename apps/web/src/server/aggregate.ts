import type {
  ChartDayRecord,
  FinanceSummary,
  PlatformShareRecord,
  Plataforma,
} from "@/src/data/data-source";

/** Datos mínimos de un pedido para calcular KPIs (sin recargar el DTO completo). */
export interface OrderFacts {
  estado: string;
  subtotalCents: number;
  feeMiruCents: number;
  plataforma: Plataforma;
  createdAt: string;
  updatedAt: string;
}

export interface Totals {
  ventasBrutasCents: number;
  feeMiruCents: number;
  utilidadNetaCents: number;
  costoFletesCents: number;
  pedidosTotal: number;
  entregados: number;
  devueltos: number;
  tasaEntregaEfectiva: number | null;
}

const TIME_ZONE = "America/Bogota";
const PLATFORMS = ["Dropi", "MasterShop", "Effi"] as const;
const DAY_MS = 86_400_000;

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIME_ZONE,
  weekday: "short",
});
const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayKey(date: Date): string {
  return DAY_KEY_FORMAT.format(date);
}

function weekdayLabel(date: Date): string {
  const label = WEEKDAY_FORMAT.format(date).replace(/\.$/, "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Regla del dueño (19-nov-2026):
 *  - Ventas brutas y fee: todos los pedidos NO cancelados.
 *  - La utilidad es el 5 % (fee Miru) sobre la venta de los pedidos ENTREGADOS.
 *  - Los DEVUELTOS descuentan del saldo (se resta su fee).
 *  - Los fletes NO se cuentan: los paga el dropshipper.
 *
 * El fee llega ya calculado por la base de datos (D-05): aquí solo se suma.
 */
export function computeTotals(orders: OrderFacts[]): Totals {
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

  const finalizados = entregados + devueltos;

  return {
    ventasBrutasCents: ventasBrutas,
    feeMiruCents: feeMiru,
    utilidadNetaCents: feeEntregados - feeDevueltos,
    costoFletesCents: 0,
    pedidosTotal: orders.length,
    entregados,
    devueltos,
    tasaEntregaEfectiva: finalizados === 0 ? null : Math.round((entregados / finalizados) * 100),
  };
}

/**
 * Últimos 7 días. "Despachados" = pedidos creados ese día (la BD no guarda un
 * timestamp de despacho propio). "Entregados" = pedidos entregados cuya última
 * actualización cae ese día.
 */
export function computeChart(orders: OrderFacts[], now: Date = new Date()): ChartDayRecord[] {
  const days: { key: string; label: string }[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now.getTime() - offset * DAY_MS);
    days.push({ key: dayKey(date), label: weekdayLabel(date) });
  }

  return days.map(({ key, label }) => ({
    dia: label,
    despachados: orders.filter((order) => dayKey(new Date(order.createdAt)) === key).length,
    entregados: orders.filter(
      (order) => order.estado === "entregado" && dayKey(new Date(order.updatedAt)) === key,
    ).length,
  }));
}

export function computeShare(orders: OrderFacts[]): PlatformShareRecord[] {
  const total = orders.length;

  return PLATFORMS.map((plataforma) => {
    const pedidos = orders.filter((order) => order.plataforma === plataforma).length;
    return {
      plataforma,
      pedidos,
      porcentaje: total === 0 ? 0 : Math.round((pedidos / total) * 100),
    };
  }).filter((row) => row.pedidos > 0);
}

export function computeFinance(orders: OrderFacts[]): FinanceSummary {
  const totals = computeTotals(orders);

  return {
    ventasBrutasCents: totals.ventasBrutasCents,
    costoFletesCents: 0,
    utilidadNetaCents: totals.utilidadNetaCents,
    feeMiruCents: totals.feeMiruCents,
    desglosePlataforma: PLATFORMS.map((plataforma) => {
      const ofPlatform = orders.filter((order) => order.plataforma === plataforma);
      const ventasCents = ofPlatform
        .filter((order) => order.estado !== "cancelado")
        .reduce((sum, order) => sum + order.subtotalCents, 0);

      return { plataforma, ventasCents, fletesCents: 0, pedidos: ofPlatform.length };
    }).filter((row) => row.pedidos > 0),
  };
}
