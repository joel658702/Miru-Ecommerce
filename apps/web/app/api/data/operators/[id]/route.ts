import { NextResponse } from "next/server";

import { getServerClient } from "@/src/lib/supabase/server";
import { getAdminClient } from "@/src/server/admin";
import { loadOperatorContext, removeOperator } from "@/src/server/operators";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Revoca el acceso de un operador al tenant. Solo el owner puede hacerlo. */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;

  const client = await getServerClient();
  const admin = getAdminClient();

  if (client === null || admin === null) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    const ctx = await loadOperatorContext(client);
    if (ctx === null) {
      return NextResponse.json({ error: "no_membership" }, { status: 403 });
    }
    if (ctx.rol !== "owner") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const result = await removeOperator(ctx, admin, id);
    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 409;
      return NextResponse.json({ error: result.error }, { status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[api/data/operators DELETE]", error);
    return NextResponse.json({ error: "data_unavailable" }, { status: 500 });
  }
}
