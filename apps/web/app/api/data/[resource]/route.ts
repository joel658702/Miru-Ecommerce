import { NextResponse } from "next/server";

import { getServerClient } from "@/src/lib/supabase/server";
import { getAdminClient } from "@/src/server/admin";
import {
  loadConnections,
  loadFinance,
  loadKpis,
  loadOrders,
  loadProducts,
  loadWarranties,
  type DataContext,
} from "@/src/server/queries";

export const dynamic = "force-dynamic";

/**
 * Datos de la WebApp con la sesión del operador (RLS activo). Sin sesión no se
 * devuelve nada: el panel nunca lee con service_role.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ resource: string }> },
): Promise<NextResponse> {
  const { resource } = await context.params;

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

  const ctx: DataContext = { client, admin: getAdminClient() };

  try {
    switch (resource) {
      case "kpis":
        return NextResponse.json(await loadKpis(ctx));
      case "orders":
        return NextResponse.json(await loadOrders(ctx));
      case "warranties":
        return NextResponse.json(await loadWarranties(ctx));
      case "products":
        return NextResponse.json(await loadProducts(ctx));
      case "finance":
        return NextResponse.json(await loadFinance(ctx));
      case "connections":
        return NextResponse.json(await loadConnections(ctx));
      default:
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  } catch (error) {
    console.error(`[api/data/${resource}]`, error);
    return NextResponse.json({ error: "data_unavailable" }, { status: 500 });
  }
}
