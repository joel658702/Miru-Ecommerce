import { createClient } from "@supabase/supabase-js";
import { Worker } from "bullmq";
import { Redis } from "ioredis";

import { loadConfig } from "./config.js";
import { purgeOldEvents } from "./maintenance.js";
import { refreshDailyMetrics } from "./metrics.js";
import { createProcessor } from "./processor.js";
import { createRepository } from "./repository.js";

const config = loadConfig();

// service_role: solo servidor (D-09).
const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const processor = createProcessor(createRepository(supabase));

const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
connection.on("error", (error) => {
  console.error(`[worker] redis: ${error.message}`);
});

/**
 * Concurrencia 1 a propósito: la regla de orden (D-07) y el reemplazo de ítems
 * se resuelven sin carreras entre eventos del mismo pedido. Se podrá subir por
 * tenant cuando haya métricas que lo justifiquen.
 */
const worker = new Worker(
  config.queueName,
  async (job) => {
    const data = job.data as { eventRowId?: unknown };
    if (typeof data.eventRowId !== "string") {
      throw new Error("job sin eventRowId");
    }

    const outcome = await processor.processEvent(data.eventRowId);

    // Señal de Realtime del dashboard (D-08). Un fallo aquí no debe reencolar
    // el pedido: se registra y se sigue.
    try {
      const { data: row } = await supabase
        .from("webhook_events")
        .select("tenant_id")
        .eq("id", data.eventRowId)
        .maybeSingle<{ tenant_id: string }>();

      if (row !== null) {
        await refreshDailyMetrics(supabase, row.tenant_id);
      }
    } catch (error) {
      console.error(`[worker] métricas: ${error instanceof Error ? error.message : String(error)}`);
    }

    return outcome;
  },
  { connection, concurrency: 1 },
);

worker.on("completed", (job, result) => {
  console.log(`[worker] evento ${job.id ?? "?"}: ${String(result)}`);
});

worker.on("failed", (job, error) => {
  console.error(`[worker] evento ${job?.id ?? "?"} falló: ${error.message}`);
});

console.log(`[worker] escuchando cola ${config.queueName}`);

// Al arrancar, deja las métricas del día listas para el dashboard (best-effort).
void (async () => {
  try {
    const { data, error } = await supabase.from("connections").select("tenant_id");
    if (error !== null) {
      throw error;
    }

    const tenants = new Set(((data ?? []) as { tenant_id: string }[]).map((row) => row.tenant_id));
    for (const tenantId of tenants) {
      await refreshDailyMetrics(supabase, tenantId);
    }

    if (tenants.size > 0) {
      console.log(`[worker] métricas del día listas para ${tenants.size} tenant(s)`);
    }
  } catch (error) {
    console.error(
      `[worker] métricas iniciales: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
})();

/**
 * Mantenimiento: purga los eventos crudos de más de 14 días (plan Free).
 * Corre al arrancar y cada 24 h; los pedidos no se tocan.
 */
async function runPurge(): Promise<void> {
  try {
    const deleted = await purgeOldEvents(supabase);
    if (deleted > 0) {
      console.log(`[worker] purga: ${deleted} evento(s) antiguos eliminados`);
    }
  } catch (error) {
    console.error(`[worker] purga: ${error instanceof Error ? error.message : String(error)}`);
  }
}

void runPurge();
const purgeTimer = setInterval(() => void runPurge(), 24 * 60 * 60 * 1000);

async function shutdown(signal: string): Promise<void> {
  console.log(`[worker] ${signal}: cerrando`);
  clearInterval(purgeTimer);
  await worker.close();
  connection.disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
