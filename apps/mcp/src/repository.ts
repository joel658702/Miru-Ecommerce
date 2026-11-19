import type { SupabaseClient } from "@supabase/supabase-js";

export interface OrderSummary {
  externalId: string;
  estado: string;
  plataforma: string | null;
  cliente: string;
  ciudad: string;
  creadoEn: string;
  actualizadoEn: string;
  ventaCents: number;
  feeCents: number;
}

export interface OrderItem {
  sku: string;
  qty: number;
  unitPriceCents: number;
  unitCostCents: number;
}

export interface OrderDetail extends OrderSummary {
  carrier: string | null;
  tracking: string | null;
  direccion: string | null;
  items: OrderItem[];
}

export interface ProductRow {
  sku: string;
  nombre: string;
  precioVentaCents: number;
  costoUnitarioCents: number;
  stock: number;
  activo: boolean;
}

export interface WarrantyRow {
  id: string;
  estado: string;
  motivo: string;
  montoCents: number;
  pedido: string;
  fecha: string;
}

export interface FinanceRow {
  estado: string;
  subtotalCents: number;
  feeCents: number;
}

/**
 * Ventas y fee de todos los pedidos no cancelados; utilidad = fee de
 * entregados menos fee de devueltos (regla del dueño). No recalcula el fee:
 * usa los centavos que ya guardó la base de datos.
 */
export interface FinanceSummary {
  ventasCents: number;
  feeCents: number;
  utilidadCents: number;
  pedidos: number;
  entregados: number;
  devueltos: number;
}

export function computeFinance(rows: readonly FinanceRow[]): FinanceSummary {
  let ventasCents = 0;
  let feeCents = 0;
  let entregadosFee = 0;
  let devueltosFee = 0;
  let pedidos = 0;
  let entregados = 0;
  let devueltos = 0;

  for (const row of rows) {
    if (row.estado === "cancelado") {
      continue;
    }

    pedidos += 1;
    ventasCents += row.subtotalCents;
    feeCents += row.feeCents;

    if (row.estado === "entregado") {
      entregados += 1;
      entregadosFee += row.feeCents;
    }
    if (row.estado === "devuelto") {
      devueltos += 1;
      devueltosFee += row.feeCents;
    }
  }

  return {
    ventasCents,
    feeCents,
    utilidadCents: entregadosFee - devueltosFee,
    pedidos,
    entregados,
    devueltos,
  };
}

export interface McpRepository {
  listOrders(params: {
    estado?: string;
    plataforma?: string;
    limit: number;
  }): Promise<OrderSummary[]>;
  getOrder(externalId: string): Promise<OrderDetail | null>;
  listProducts(sku?: string): Promise<ProductRow[]>;
  listWarranties(estado?: string): Promise<WarrantyRow[]>;
  financeRows(sinceIso: string): Promise<FinanceRow[]>;
}

interface OrderDbRow {
  external_id: string;
  estado: string;
  connection_id: string;
  customer_name: string;
  customer_city: string;
  external_created_at: string;
  external_updated_at: string;
  subtotal_cents: number;
  fee_miru_cents: number;
  carrier: string | null;
  tracking_number: string | null;
  customer_address: string | null;
}

interface ItemDbRow {
  sku: string;
  qty: number;
  unit_price_cents: number;
  unit_cost_cents: number;
}

export function createRepository(supabase: SupabaseClient, tenantId: string): McpRepository {
  return {
    async listOrders({ estado, plataforma, limit }) {
      let query = supabase
        .from("orders")
        .select(
          "external_id, estado, customer_name, customer_city, external_created_at, external_updated_at, subtotal_cents, fee_miru_cents",
        )
        .eq("tenant_id", tenantId)
        .order("external_created_at", { ascending: false })
        .limit(limit);

      if (estado !== undefined) {
        query = query.eq("estado", estado);
      }

      const { data, error } = await query;
      if (error !== null) {
        throw error;
      }

      const rows = (data ?? []) as unknown as OrderDbRow[];

      // El filtro por plataforma vive en connections; se resuelve aparte para
      // no acoplar la consulta a un join cuando no se pide.
      if (plataforma !== undefined) {
        const { data: connections, error: connectionError } = await supabase
          .from("connections")
          .select("id, plataforma")
          .eq("tenant_id", tenantId)
          .eq("plataforma", plataforma);

        if (connectionError !== null) {
          throw connectionError;
        }

        const allowed = new Set(
          ((connections ?? []) as { id: string }[]).map((connection) => connection.id),
        );

        return rows.filter((row) => allowed.has(row.connection_id)).map(toSummary(plataforma));
      }

      return rows.map(toSummary(null));
    },

    async getOrder(externalId) {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "external_id, estado, customer_name, customer_city, external_created_at, external_updated_at, subtotal_cents, fee_miru_cents, carrier, tracking_number, customer_address",
        )
        .eq("tenant_id", tenantId)
        .eq("external_id", externalId)
        .maybeSingle<OrderDbRow>();

      if (error !== null) {
        throw error;
      }
      if (data === null) {
        return null;
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("external_id", externalId)
        .maybeSingle<{ id: string }>();

      if (orderError !== null) {
        throw orderError;
      }

      const items =
        order === null
          ? []
          : ((
              await supabase
                .from("order_items")
                .select("sku, qty, unit_price_cents, unit_cost_cents")
                .eq("order_id", order.id)
            ).data ?? []);

      const summary = toSummary(null)(data);

      return {
        ...summary,
        carrier: data.carrier,
        tracking: data.tracking_number,
        direccion: data.customer_address,
        items: ((items ?? []) as ItemDbRow[]).map((item) => ({
          sku: item.sku,
          qty: item.qty,
          unitPriceCents: item.unit_price_cents,
          unitCostCents: item.unit_cost_cents,
        })),
      };
    },

    async listProducts(sku) {
      let query = supabase
        .from("products")
        .select("sku, nombre, precio_venta_cents, costo_unitario_cents, stock, activo")
        .eq("tenant_id", tenantId)
        .order("sku", { ascending: true })
        .limit(200);

      if (sku !== undefined) {
        query = query.eq("sku", sku);
      }

      const { data, error } = await query;
      if (error !== null) {
        throw error;
      }

      return (
        (data ?? []) as {
          sku: string;
          nombre: string;
          precio_venta_cents: number;
          costo_unitario_cents: number;
          stock: number;
          activo: boolean;
        }[]
      ).map((row) => ({
        sku: row.sku,
        nombre: row.nombre,
        precioVentaCents: row.precio_venta_cents,
        costoUnitarioCents: row.costo_unitario_cents,
        stock: row.stock,
        activo: row.activo,
      }));
    },

    async listWarranties(estado) {
      let query = supabase
        .from("warranties")
        .select(
          "id, estado, motivo, monto_solicitado_cents, fecha_solicitud, orders!inner(external_id)",
        )
        .eq("tenant_id", tenantId)
        .order("fecha_solicitud", { ascending: false })
        .limit(200);

      if (estado !== undefined) {
        query = query.eq("estado", estado);
      }

      const { data, error } = await query;
      if (error !== null) {
        throw error;
      }

      return (
        (data ?? []) as unknown as {
          id: string;
          estado: string;
          motivo: string;
          monto_solicitado_cents: number;
          fecha_solicitud: string;
          orders: { external_id: string };
        }[]
      ).map((row) => ({
        id: row.id,
        estado: row.estado,
        motivo: row.motivo,
        montoCents: row.monto_solicitado_cents,
        pedido: row.orders.external_id,
        fecha: row.fecha_solicitud,
      }));
    },

    async financeRows(sinceIso) {
      const { data, error } = await supabase
        .from("orders")
        .select("estado, subtotal_cents, fee_miru_cents")
        .eq("tenant_id", tenantId)
        .gte("external_created_at", sinceIso);

      if (error !== null) {
        throw error;
      }

      return (
        (data ?? []) as {
          estado: string;
          subtotal_cents: number;
          fee_miru_cents: number;
        }[]
      ).map((row) => ({
        estado: row.estado,
        subtotalCents: row.subtotal_cents,
        feeCents: row.fee_miru_cents,
      }));
    },
  };
}

function toSummary(plataforma: string | null) {
  return (row: OrderDbRow): OrderSummary => ({
    externalId: row.external_id,
    estado: row.estado,
    plataforma,
    cliente: row.customer_name,
    ciudad: row.customer_city,
    creadoEn: row.external_created_at,
    actualizadoEn: row.external_updated_at,
    ventaCents: row.subtotal_cents,
    feeCents: row.fee_miru_cents,
  });
}
