import { NextResponse } from "next/server";

import { getServerClient } from "@/src/lib/supabase/server";
import { getAdminClient } from "@/src/server/admin";
import {
  createOperator,
  listOperators,
  loadOperatorContext,
  validateOperatorInput,
} from "@/src/server/operators";

export const dynamic = "force-dynamic";

/** Lista los operadores del tenant activo (cualquier miembro puede verla). */
export async function GET(): Promise<NextResponse> {
  const client = await getServerClient();
  const admin = getAdminClient();

  if (client === null || admin === null) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  try {
    const ctx = await loadOperatorContext(client);
    if (ctx === null) {
      return NextResponse.json({ error: "no_membership" }, { status: 403 });
    }

    return NextResponse.json(await listOperators(ctx, client, admin));
  } catch (error) {
    console.error("[api/data/operators GET]", error);
    return NextResponse.json({ error: "data_unavailable" }, { status: 500 });
  }
}

/** Alta de operador. Solo el owner del tenant puede crear cuentas. */
export async function POST(request: Request): Promise<NextResponse> {
  const client = await getServerClient();
  const admin = getAdminClient();

  if (client === null || admin === null) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  let body: { email?: unknown; password?: unknown; rol?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const validation = validateOperatorInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "invalid_input", message: validation.error },
      { status: 422 },
    );
  }

  try {
    const ctx = await loadOperatorContext(client);
    if (ctx === null) {
      return NextResponse.json({ error: "no_membership" }, { status: 403 });
    }
    if (ctx.rol !== "owner") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const result = await createOperator(ctx, admin, validation.value);
    if (!result.ok) {
      const status = result.error === "email_exists" ? 409 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.operator, { status: 201 });
  } catch (error) {
    console.error("[api/data/operators POST]", error);
    return NextResponse.json({ error: "data_unavailable" }, { status: 500 });
  }
}
