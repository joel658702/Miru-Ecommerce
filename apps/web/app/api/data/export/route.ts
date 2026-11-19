import { NextResponse } from "next/server";

import { getServerClient } from "@/src/lib/supabase/server";
import { getAdminClient } from "@/src/server/admin";
import { centsToDecimal, toCsv } from "@/src/server/csv";
import { isFinancePeriod, periodStartIso } from "@/src/server/period";
import { loadFinance, loadOrders, type DataContext } from "@/src/server/queries";

export const dynamic = "force-dynamic";

const DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayOf(iso: string): string {
  return DAY_FORMAT.format(new Date(iso));
}

/**
 * Exporta CSV con la sesión del operador (RLS aplica).
 *
 *   /api/data/export?tipo=pedidos
 *   /api/data/export?tipo=finanzas&periodo=hoy|semana|mes
 */
export async function GET(request: Request): Promise<NextResponse> {
  const client = await getServerClient();

  if (client === null) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  if (user === null) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const tipo = params.get("tipo") === "finanzas" ? "finanzas" : "pedidos";
  const requestedPeriod = params.get("periodo");
  const periodo = isFinancePeriod(requestedPeriod) ? requestedPeriod : "mes";
  const ctx: DataContext = { client, admin: getAdminClient() };
  const today = DAY_FORMAT.format(new Date());

  try {
    if (tipo === "pedidos") {
      const orders = await loadOrders(ctx);

      const csv = toCsv(
        [
          "pedido",
          "fecha",
          "plataforma",
          "estado",
          "cliente",
          "telefono",
          "ciudad",
          "guia",
          "transportadora",
          "producto",
          "unidades",
          "venta_cop",
          "utilidad_cop",
        ],
        orders.map((order) => [
          order.externalId,
          dayOf(order.fechaCreacion),
          order.plataforma,
          order.estado,
          order.cliente,
          order.telefono,
          order.ciudad,
          order.guia,
          order.transportadora,
          order.producto,
          order.unidades,
          centsToDecimal(order.valorTotalCents),
          centsToDecimal(order.utilidadNetaCents),
        ]),
      );

      return csvResponse(csv, `pedidos-${today}.csv`);
    }

    const finance = await loadFinance(ctx, periodStartIso(periodo));

    const rows = finance.desglosePlataforma.map((row) => [
      row.plataforma,
      row.pedidos,
      centsToDecimal(row.ventasCents),
      centsToDecimal(row.feeMiruCents ?? 0),
      centsToDecimal(row.fletesCents),
    ]);

    const totalPedidos = finance.desglosePlataforma.reduce((sum, row) => sum + row.pedidos, 0);
    rows.push([
      "TOTAL",
      totalPedidos,
      centsToDecimal(finance.ventasBrutasCents),
      centsToDecimal(finance.feeMiruCents ?? 0),
      centsToDecimal(finance.costoFletesCents),
    ]);

    const csv = toCsv(["canal", "pedidos", "ventas_cop", "fee_miru_cop", "fletes_cop"], rows);

    return csvResponse(csv, `finanzas-${periodo}-${today}.csv`);
  } catch (error) {
    console.error(`[api/data/export ${tipo}]`, error);
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}

function csvResponse(csv: string, filename: string): NextResponse {
  // BOM para que Excel respete los acentos.
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
