import { createClient } from "@supabase/supabase-js";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

import { buildServer, type PersistedEvent } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();

// service_role: solo servidor (D-09). Sin sesión ni refresh de usuario.
const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// BullMQ sobre un cliente ya construido: en ESM no puede cargar ioredis por su
// cuenta. `maxRetriesPerRequest: null` es requisito de BullMQ.
const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
const queue = new Queue(config.queueName, { connection: redis });

async function findConnection(
  connectionId: string,
): Promise<{ id: string; tenantId: string } | null> {
  const { data, error } = await supabase
    .from("connections")
    .select("id, tenant_id")
    .eq("id", connectionId)
    .eq("estado", "activa")
    .maybeSingle<{ id: string; tenant_id: string }>();

  if (error !== null) {
    throw error;
  }

  return data === null ? null : { id: data.id, tenantId: data.tenant_id };
}

async function storeEvent(
  event: PersistedEvent,
): Promise<{ status: "stored" | "duplicate"; id: string }> {
  // ON CONFLICT DO NOTHING sobre (connection_id, external_event_id): el unique
  // de la BD es la fuente de verdad de la idempotencia (D-07).
  const inserted = await supabase
    .from("webhook_events")
    .upsert(
      {
        tenant_id: event.tenantId,
        connection_id: event.connectionId,
        external_event_id: event.eventId,
        event_type: event.eventType,
        occurred_at: event.occurredAt,
        external_updated_at: event.externalUpdatedAt,
        payload: event.payload,
      },
      { onConflict: "connection_id,external_event_id", ignoreDuplicates: true },
    )
    .select("id");

  if (inserted.error !== null) {
    throw inserted.error;
  }

  const row = (inserted.data as { id: string }[] | null)?.[0];
  if (row !== undefined) {
    return { status: "stored", id: row.id };
  }

  const existing = await supabase
    .from("webhook_events")
    .select("id")
    .eq("connection_id", event.connectionId)
    .eq("external_event_id", event.eventId)
    .single<{ id: string }>();

  if (existing.error !== null) {
    throw existing.error;
  }

  return { status: "duplicate", id: existing.data.id };
}

async function enqueue(eventRowId: string): Promise<void> {
  // jobId fijo por fila: reintentos de la plataforma no duplican el trabajo.
  await queue.add(
    "process-webhook",
    { eventRowId },
    {
      jobId: eventRowId,
      attempts: 5,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: 1_000,
      removeOnFail: 5_000,
    },
  );
}

const app = buildServer({
  secret: config.hmacSecret,
  logger: true,
  findConnection,
  storeEvent,
  enqueue,
});

app.addHook("onClose", async () => {
  await queue.close();
  redis.disconnect();
});

try {
  await app.listen({ port: config.port, host: config.host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
