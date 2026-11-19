import { NextResponse } from "next/server";
import { WARRANTY_STATUSES, type WarrantyStatus } from "@miru/shared";

import { getServerClient } from "@/src/lib/supabase/server";
import { getAdminClient } from "@/src/server/admin";
import { getWarranty, updateWarranty, type DataContext } from "@/src/server/queries";
import { canTransitionWarranty, requiresResolutionNote } from "@/src/server/warranty-transitions";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PatchBody {
  estado?: unknown;
  nota?: unknown;
}

/**
 * Cambia el estado de una garantía con la sesión del operador: la RLS limita la
 * fila a su tenant y aquí se validan las transiciones del flujo.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;

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

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const estado = body.estado;
  if (typeof estado !== "string" || !WARRANTY_STATUSES.includes(estado as WarrantyStatus)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 422 });
  }

  const nota = typeof body.nota === "string" ? body.nota : undefined;

  const ctx: DataContext = { client, admin: getAdminClient() };

  try {
    const current = await getWarranty(ctx, id);

    if (current === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const target = estado as WarrantyStatus;

    if (!canTransitionWarranty(current.estado, target)) {
      return NextResponse.json(
        { error: "invalid_transition", from: current.estado, to: target },
        { status: 409 },
      );
    }

    if (requiresResolutionNote(target) && (nota === undefined || nota.trim().length < 3)) {
      return NextResponse.json({ error: "note_required" }, { status: 422 });
    }

    const updated = await updateWarranty(ctx, id, target, nota);
    if (updated === null) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`[api/data/warranties/${id}]`, error);
    return NextResponse.json({ error: "data_unavailable" }, { status: 500 });
  }
}
