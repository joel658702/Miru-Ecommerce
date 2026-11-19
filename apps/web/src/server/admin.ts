import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role para contadores que la RLS no expone.
 *
 * Solo servidor (D-09). El llamador siempre debe filtrar por los tenants del
 * usuario: este cliente se salta RLS por completo.
 */
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (url.length === 0 || key.length === 0) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
