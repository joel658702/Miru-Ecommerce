import type { SupabaseClient } from "@supabase/supabase-js";

export type OperatorRole = "owner" | "operador";

export interface OperatorRecord {
  userId: string;
  email: string;
  rol: OperatorRole;
  desde: string;
}

export interface OperatorInput {
  email: string;
  password: string;
  rol: OperatorRole;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export type ValidationResult = { ok: true; value: OperatorInput } | { ok: false; error: string };

/** Valida el alta de un operador (misma regla en UI y API). */
export function validateOperatorInput(input: {
  email?: unknown;
  password?: unknown;
  rol?: unknown;
}): ValidationResult {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const rol = input.rol === "owner" ? "owner" : "operador";

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "El correo no es válido." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  return { ok: true, value: { email, password, rol } };
}

export interface OperatorContext {
  userId: string;
  tenantId: string;
  rol: OperatorRole;
}

/**
 * Resuelve el tenant activo y el rol del usuario con la sesión (RLS).
 * La WebApp es de un tenant por operador en esta etapa.
 */
export async function loadOperatorContext(client: SupabaseClient): Promise<OperatorContext | null> {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user === null) {
    return null;
  }

  const { data, error } = await client
    .from("tenant_members")
    .select("tenant_id, rol")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ tenant_id: string; rol: OperatorRole }>();

  if (error !== null) {
    throw error;
  }
  if (data === null) {
    return null;
  }

  return { userId: user.id, tenantId: data.tenant_id, rol: data.rol };
}

async function emailsById(admin: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (error !== null) {
    throw error;
  }

  return new Map(data.users.map((user) => [user.id, user.email ?? "—"]));
}

export async function listOperators(
  ctx: OperatorContext,
  client: SupabaseClient,
  admin: SupabaseClient,
): Promise<OperatorRecord[]> {
  const { data, error } = await client
    .from("tenant_members")
    .select("user_id, rol, created_at")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: true });

  if (error !== null) {
    throw error;
  }

  const emails = await emailsById(admin);

  return ((data ?? []) as { user_id: string; rol: OperatorRole; created_at: string }[]).map(
    (row) => ({
      userId: row.user_id,
      email: emails.get(row.user_id) ?? "—",
      rol: row.rol,
      desde: row.created_at,
    }),
  );
}

export type CreateOperatorResult =
  { ok: true; operator: OperatorRecord } | { ok: false; error: "email_exists" | "create_failed" };

export async function createOperator(
  ctx: OperatorContext,
  admin: SupabaseClient,
  input: OperatorInput,
): Promise<CreateOperatorResult> {
  const created = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (created.error !== null) {
    const exists =
      created.error.code === "email_exists" ||
      created.error.message.toLowerCase().includes("already been registered");

    return { ok: false, error: exists ? "email_exists" : "create_failed" };
  }

  const user = created.data.user;
  if (user === null) {
    return { ok: false, error: "create_failed" };
  }

  const membership = await admin
    .from("tenant_members")
    .insert({ tenant_id: ctx.tenantId, user_id: user.id, rol: input.rol });

  if (membership.error !== null) {
    // No dejar un usuario sin tenant si falló la membresía.
    await admin.auth.admin.deleteUser(user.id);
    return { ok: false, error: "create_failed" };
  }

  return {
    ok: true,
    operator: {
      userId: user.id,
      email: input.email,
      rol: input.rol,
      desde: new Date().toISOString(),
    },
  };
}

export type RemoveOperatorResult =
  { ok: true } | { ok: false; error: "not_found" | "cannot_remove_self" | "last_owner" };

export async function removeOperator(
  ctx: OperatorContext,
  admin: SupabaseClient,
  targetUserId: string,
): Promise<RemoveOperatorResult> {
  if (targetUserId === ctx.userId) {
    return { ok: false, error: "cannot_remove_self" };
  }

  const { data: target, error: targetError } = await admin
    .from("tenant_members")
    .select("rol")
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", targetUserId)
    .maybeSingle<{ rol: OperatorRole }>();

  if (targetError !== null) {
    throw targetError;
  }
  if (target === null) {
    return { ok: false, error: "not_found" };
  }

  if (target.rol === "owner") {
    const { count, error: countError } = await admin
      .from("tenant_members")
      .select("user_id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("rol", "owner");

    if (countError !== null) {
      throw countError;
    }
    if ((count ?? 0) <= 1) {
      return { ok: false, error: "last_owner" };
    }
  }

  const { error } = await admin
    .from("tenant_members")
    .delete()
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", targetUserId);

  if (error !== null) {
    throw error;
  }

  return { ok: true };
}
