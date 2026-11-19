import type { OrderStatus, WarrantyStatus } from "@miru/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ConnectionRecord,
  FinanceSummary,
  KpiSummary,
  OrderRecord,
  Plataforma,
  ProductRecord,
  WarrantyRecord,
} from "@/src/data/data-source";
import { computeChart, computeFinance, computeShare, computeTotals } from "./aggregate";
import type { OrderFacts } from "./aggregate";

export interface DataContext {
  /** Cliente con la sesión del operador: todo pasa por RLS. */
  client: SupabaseClient;
  /**
   * service_role SOLO en el servidor, para contadores que la RLS no expone
   * (`webhook_events` no tiene políticas de lectura para operadores).
   * Siempre se filtra por los tenants del usuario. Puede ser `null`.
   */
  admin: SupabaseClient | null;
}

const TIME_ZONE = "America/Bogota";

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
});

const TIME_FORMAT = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

interface OrderRow {
  external_id: string;
  tracking_number: string | null;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  estado: string;
  carrier: string | null;
  subtotal_cents: number;
  shipping_cost_cents: number;
  fee_miru_cents: number;
  external_created_at: string;
  external_updated_at: string;
  novedad_detalle: string | null;
  connections: { plataforma: Plataforma } | null;
  order_items: { sku: string; qty: number; unit_price_cents: number }[] | null;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  return `${DATE_FORMAT.format(date)} · ${TIME_FORMAT.format(date)}`;
}

export function formatRelative(iso: string | null, now: Date = new Date()): string {
  if (iso === null) {
    return "Sin eventos";
  }

  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Hace instantes";
  if (minutes < 60) return `Hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`;

  const days = Math.floor(hours / 24);
  return `Hace ${days} ${days === 1 ? "día" : "días"}`;
}

const ORDER_SELECT = [
  "external_id",
  "tracking_number",
  "customer_name",
  "customer_phone",
  "customer_city",
  "estado",
  "carrier",
  "subtotal_cents",
  "shipping_cost_cents",
  "fee_miru_cents",
  "external_created_at",
  "external_updated_at",
  "novedad_detalle",
  "connections(plataforma)",
  "order_items(sku, qty, unit_price_cents)",
].join(", ");

async function fetchOrderRows(ctx: DataContext, sinceIso?: string): Promise<OrderRow[]> {
  let query = ctx.client
    .from("orders")
    .select(ORDER_SELECT)
    .order("external_created_at", { ascending: false })
    .limit(500);

  if (sinceIso !== undefined) {
    query = query.gte("external_created_at", sinceIso);
  }

  const { data, error } = await query;

  if (error !== null) {
    throw error;
  }

  return (data ?? []) as unknown as OrderRow[];
}

function platformOf(row: OrderRow): Plataforma {
  const plataforma = row.connections?.plataforma;
  if (plataforma === undefined) {
    throw new Error(`El pedido ${row.external_id} no tiene conexión asociada.`);
  }
  return plataforma;
}

function toFacts(row: OrderRow): OrderFacts {
  return {
    estado: row.estado,
    subtotalCents: row.subtotal_cents,
    feeMiruCents: row.fee_miru_cents,
    plataforma: platformOf(row),
    createdAt: row.external_created_at,
    updatedAt: row.external_updated_at,
  };
}

function toOrderRecord(row: OrderRow): OrderRecord {
  const plataforma = platformOf(row);
  const items = row.order_items ?? [];
  const delivered = row.estado === "entregado";
  const returned = row.estado === "devuelto";

  return {
    id: row.external_id,
    externalId: row.external_id,
    guia: row.tracking_number ?? "—",
    cliente: row.customer_name,
    telefono: row.customer_phone,
    ciudad: row.customer_city,
    producto: items[0]?.sku ?? "—",
    unidades: items.reduce((sum, item) => sum + item.qty, 0),
    plataforma,
    transportadora: row.carrier ?? "—",
    valorTotalCents: row.subtotal_cents,
    costoFleteCents: row.shipping_cost_cents,
    // Regla del dueño: utilidad = fee de entregados; devueltos restan.
    utilidadNetaCents: delivered ? row.fee_miru_cents : returned ? -row.fee_miru_cents : 0,
    estado: row.estado as OrderStatus,
    fechaCreacion: row.external_created_at,
    novedadDetalle: row.novedad_detalle ?? undefined,
    items: items.map((item) => ({
      sku: item.sku,
      nombre: item.sku,
      unidades: item.qty,
      precioUnitarioCents: item.unit_price_cents,
    })),
    historial: [
      {
        timestamp: formatWhen(row.external_created_at),
        titulo: `Pedido sincronizado desde ${plataforma}`,
        ubicacion: row.customer_city,
      },
    ],
  };
}

async function countOpenWarranties(ctx: DataContext): Promise<number> {
  const { count, error } = await ctx.client
    .from("warranties")
    .select("id", { count: "exact", head: true })
    .in("estado", ["solicitada", "en_revision"]);

  if (error !== null) {
    throw error;
  }

  return count ?? 0;
}

export async function loadOrders(ctx: DataContext): Promise<OrderRecord[]> {
  const rows = await fetchOrderRows(ctx);
  return rows.map(toOrderRecord);
}

export async function loadKpis(ctx: DataContext): Promise<KpiSummary> {
  const rows = await fetchOrderRows(ctx);
  const facts = rows.map(toFacts);
  const totals = computeTotals(facts);
  const garantiasAbiertas = await countOpenWarranties(ctx);

  return {
    ...totals,
    garantiasAbiertas,
    despachosVsEntregados7d: computeChart(facts),
    participacionPlataforma: computeShare(facts),
    pedidosRequierenGestion: rows
      .filter((row) => row.estado === "pendiente" || row.estado === "novedad")
      .map(toOrderRecord),
  };
}

export async function loadFinance(ctx: DataContext, sinceIso?: string): Promise<FinanceSummary> {
  const rows = await fetchOrderRows(ctx, sinceIso);
  return computeFinance(rows.map(toFacts));
}

export async function loadProducts(ctx: DataContext): Promise<ProductRecord[]> {
  const { data, error } = await ctx.client
    .from("products")
    .select("id, sku, nombre, precio_venta_cents, costo_unitario_cents, stock, plataformas, activo")
    .order("sku", { ascending: true });

  if (error !== null) {
    throw error;
  }

  type ProductRow = {
    id: string;
    sku: string;
    nombre: string;
    precio_venta_cents: number;
    costo_unitario_cents: number;
    stock: number;
    plataformas: Plataforma[] | null;
    activo: boolean;
  };

  return ((data ?? []) as unknown as ProductRow[]).map((row) => ({
    id: row.id,
    sku: row.sku,
    nombre: row.nombre,
    precioVentaCents: row.precio_venta_cents,
    costoUnitarioCents: row.costo_unitario_cents,
    stock: row.stock,
    plataformas: row.plataformas ?? [],
    activo: row.activo,
  }));
}

const WARRANTY_SELECT = [
  "id",
  "order_id",
  "motivo",
  "monto_solicitado_cents",
  "estado",
  "fecha_solicitud",
  "resolucion_nota",
  "orders(customer_name, customer_phone, customer_city, external_id, connections(plataforma), order_items(sku))",
].join(", ");

interface WarrantyRow {
  id: string;
  order_id: string;
  motivo: string;
  monto_solicitado_cents: number;
  estado: WarrantyStatus;
  fecha_solicitud: string;
  resolucion_nota: string | null;
  orders: {
    customer_name: string;
    customer_phone: string;
    customer_city: string;
    external_id: string;
    connections: { plataforma: Plataforma } | null;
    order_items: { sku: string }[] | null;
  } | null;
}

function mapWarranty(row: WarrantyRow): WarrantyRecord {
  const order = row.orders;
  const plataforma = order?.connections?.plataforma;

  if (plataforma === undefined) {
    throw new Error(`La garantía ${row.id} no tiene conexión asociada.`);
  }

  return {
    id: row.id,
    pedidoId: order?.external_id ?? row.order_id,
    cliente: order?.customer_name ?? "—",
    telefono: order?.customer_phone ?? "—",
    ciudad: order?.customer_city ?? "—",
    producto: order?.order_items?.[0]?.sku ?? "—",
    plataforma,
    montoSolicitadoCents: row.monto_solicitado_cents,
    motivo: row.motivo,
    estado: row.estado,
    fechaSolicitud: row.fecha_solicitud,
    resolucionNota: row.resolucion_nota ?? undefined,
  };
}

export async function loadWarranties(ctx: DataContext): Promise<WarrantyRecord[]> {
  const { data, error } = await ctx.client
    .from("warranties")
    .select(WARRANTY_SELECT)
    .order("fecha_solicitud", { ascending: false });

  if (error !== null) {
    throw error;
  }

  return ((data ?? []) as unknown as WarrantyRow[]).map(mapWarranty);
}

/** Lee una garantía con la sesión del operador (RLS aplica). */
export async function getWarranty(ctx: DataContext, id: string): Promise<WarrantyRecord | null> {
  const { data, error } = await ctx.client
    .from("warranties")
    .select(WARRANTY_SELECT)
    .eq("id", id)
    .maybeSingle<WarrantyRow>();

  if (error !== null) {
    throw error;
  }

  return data === null ? null : mapWarranty(data);
}

/**
 * Actualiza estado y nota de una garantía. Las transiciones válidas se validan
 * en la ruta antes de llamar aquí; la base aplica RLS por tenant.
 */
export async function updateWarranty(
  ctx: DataContext,
  id: string,
  estado: WarrantyStatus,
  nota?: string,
): Promise<WarrantyRecord | null> {
  const patch: Record<string, unknown> = { estado };
  if (nota !== undefined && nota.trim().length > 0) {
    patch.resolucion_nota = nota.trim();
  }

  const { data, error } = await ctx.client
    .from("warranties")
    .update(patch)
    .eq("id", id)
    .select(WARRANTY_SELECT)
    .maybeSingle<WarrantyRow>();

  if (error !== null) {
    throw error;
  }

  return data === null ? null : mapWarranty(data);
}

export async function loadConnections(ctx: DataContext): Promise<ConnectionRecord[]> {
  const { data, error } = await ctx.client
    .from("connections")
    .select("id, plataforma, estado, ultimo_evento_at, version_contrato")
    .order("plataforma", { ascending: true });

  if (error !== null) {
    throw error;
  }

  type ConnectionRow = {
    id: string;
    plataforma: Plataforma;
    estado: "activa" | "pausada" | "error";
    ultimo_evento_at: string | null;
    version_contrato: string;
  };

  const rows = (data ?? []) as unknown as ConnectionRow[];
  const eventosHoy = await countEventsToday(ctx);

  const baseUrl = process.env.NEXT_PUBLIC_INGEST_URL ?? "http://127.0.0.1:3001";

  return rows.map((row) => ({
    id: row.id,
    plataforma: row.plataforma,
    estado: row.estado,
    ultimoEvento: formatRelative(row.ultimo_evento_at),
    eventosHoy: eventosHoy.get(row.id) ?? 0,
    webhookUrl: `${baseUrl}/webhooks/miru/v1/${row.id}`,
    versionContrato: row.version_contrato,
  }));
}

/**
 * Eventos de hoy por conexión. `webhook_events` no tiene políticas de lectura
 * para operadores, así que el conteo se hace con service_role, limitado a los
 * tenants del usuario. Sin service_role disponible, se devuelve vacío.
 */
async function countEventsToday(ctx: DataContext): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (ctx.admin === null) {
    return counts;
  }

  const { data: memberships, error: membershipsError } = await ctx.client
    .from("tenant_members")
    .select("tenant_id");

  if (membershipsError !== null) {
    throw membershipsError;
  }

  const tenantIds = ((memberships ?? []) as { tenant_id: string }[]).map((row) => row.tenant_id);
  if (tenantIds.length === 0) {
    return counts;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await ctx.admin
    .from("webhook_events")
    .select("connection_id")
    .in("tenant_id", tenantIds)
    .gte("received_at", startOfDay.toISOString());

  if (error !== null) {
    throw error;
  }

  for (const row of (data ?? []) as { connection_id: string }[]) {
    counts.set(row.connection_id, (counts.get(row.connection_id) ?? 0) + 1);
  }

  return counts;
}
