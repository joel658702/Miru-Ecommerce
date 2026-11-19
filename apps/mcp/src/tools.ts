import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { computeFinance, type McpRepository } from "./repository.js";

const ORDER_STATUSES = [
  "pendiente",
  "confirmado",
  "en_transito",
  "entregado",
  "devuelto",
  "cancelado",
  "novedad",
] as const;

const WARRANTY_STATUSES = [
  "solicitada",
  "en_revision",
  "aprobada",
  "rechazada",
  "reembolsada",
] as const;

const PERIODS = ["hoy", "semana", "mes"] as const;

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Inicio del período en ISO UTC, calculado sobre el día de Bogotá. */
export function periodStartIso(periodo: (typeof PERIODS)[number], now: Date = new Date()): string {
  const bogota = new Date(now.getTime() - BOGOTA_OFFSET_MS);
  const daysBack = periodo === "hoy" ? 0 : periodo === "semana" ? 6 : 29;
  const startUtc =
    Date.UTC(bogota.getUTCFullYear(), bogota.getUTCMonth(), bogota.getUTCDate()) +
    BOGOTA_OFFSET_MS -
    daysBack * 24 * 60 * 60 * 1000;

  return new Date(startUtc).toISOString();
}

/** Centavos → pesos con dos decimales, sin float. */
export function formatCop(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100);
  const fraction = absolute % 100;

  return `${sign}$${whole.toLocaleString("es-CO")},${String(fraction).padStart(2, "0")}`;
}

function text(data: unknown): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

/**
 * Herramientas de SOLO LECTURA sobre el tenant configurado.
 * No hay escritura: el token MCP no puede modificar pedidos ni finanzas.
 */
export function registerTools(server: McpServer, repo: McpRepository): void {
  server.registerTool(
    "orders_list",
    {
      title: "Listar pedidos",
      description:
        "Pedidos del tenant, más recientes primero. Filtra por estado y/o plataforma. Solo lectura.",
      inputSchema: {
        estado: z.enum(ORDER_STATUSES).optional(),
        plataforma: z.string().min(1).max(40).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ estado, plataforma, limit }) => {
      const orders = await repo.listOrders({ estado, plataforma, limit: limit ?? 25 });
      return text({ total: orders.length, pedidos: orders });
    },
  );

  server.registerTool(
    "orders_get",
    {
      title: "Detalle de pedido",
      description:
        "Pedido por su identificador externo (el de la plataforma de origen), con ítems.",
      inputSchema: { external_id: z.string().min(1).max(120) },
    },
    async ({ external_id }) => {
      const order = await repo.getOrder(external_id);

      if (order === null) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `No existe el pedido ${external_id}` }],
        };
      }

      return text(order);
    },
  );

  server.registerTool(
    "products_stock",
    {
      title: "Stock y precios",
      description: "Catálogo con stock, precio de venta y costo. Filtra por SKU exacto.",
      inputSchema: { sku: z.string().min(1).max(60).optional() },
    },
    async ({ sku }) => {
      const products = await repo.listProducts(sku);
      return text({ total: products.length, productos: products });
    },
  );

  server.registerTool(
    "warranties_list",
    {
      title: "Listar garantías",
      description: "Garantías por estado, con monto solicitado y pedido asociado.",
      inputSchema: {
        estado: z.enum(WARRANTY_STATUSES).optional(),
      },
    },
    async ({ estado }) => {
      const warranties = await repo.listWarranties(estado);
      return text({ total: warranties.length, garantias: warranties });
    },
  );

  server.registerTool(
    "finance_summary",
    {
      title: "Resumen financiero",
      description:
        "Ventas brutas, fee Miru 5 % y utilidad del período. Utilidad = fee de entregados menos fee de devueltos.",
      inputSchema: { periodo: z.enum(PERIODS).default("mes") },
    },
    async ({ periodo }) => {
      const rows = await repo.financeRows(periodStartIso(periodo));
      const summary = computeFinance(rows);

      return text({
        periodo,
        ventasCents: summary.ventasCents,
        feeCents: summary.feeCents,
        utilidadCents: summary.utilidadCents,
        ventas: formatCop(summary.ventasCents),
        fee: formatCop(summary.feeCents),
        utilidad: formatCop(summary.utilidadCents),
        pedidos: summary.pedidos,
        entregados: summary.entregados,
        devueltos: summary.devueltos,
        fletesCents: 0,
      });
    },
  );
}
