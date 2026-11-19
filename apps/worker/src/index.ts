import { createClient } from "@supabase/supabase-js";
import { Worker } from "bullmq";
import { Redis } from "ioredis";

import { loadConfig } from "./config.js";
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
    return processor.processEvent(data.eventRowId);
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

async function shutdown(signal: string): Promise<void> {
  console.log(`[worker] ${signal}: cerrando`);
  await worker.close();
  connection.disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
