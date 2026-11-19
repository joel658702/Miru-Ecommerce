import type { SupabaseClient } from "@supabase/supabase-js";

/** Días que se conservan los eventos crudos (plan Free de Supabase). */
export const EVENT_RETENTION_DAYS = 14;

/**
 * Borra los eventos ya recibidos hace más de `retentionDays`.
 *
 * Los pedidos viven en `orders`; `webhook_events` solo guarda el crudo para
 * auditoría e idempotencia, así que se puede purgar sin perder datos de negocio.
 */
export async function purgeOldEvents(
  supabase: SupabaseClient,
  now: Date = new Date(),
  retentionDays: number = EVENT_RETENTION_DAYS,
): Promise<number> {
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("webhook_events")
    .delete()
    .lt("received_at", cutoff)
    .select("id");

  if (error !== null) {
    throw error;
  }

  return (data ?? []).length;
}
