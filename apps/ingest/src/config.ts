import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

/**
 * Carga `.env` desde la raíz del repo o desde `apps/ingest`, sin sobreescribir
 * variables ya presentes en el entorno. `loadEnvFile` sigue la semántica de
 * dotenv: no pisa lo que ya está definido.
 */
function loadLocalEnv(): void {
  if (process.env.MIRU_ENV_LOADED === "1") {
    return;
  }

  // dist/config.js y src/config.ts quedan a la misma profundidad:
  // apps/ingest/<src|dist>/config.* -> ../../../ = raíz del repo.
  const candidates = ["../../../.env", "../.env"];

  for (const relative of candidates) {
    const path = fileURLToPath(new URL(relative, import.meta.url));
    if (existsSync(path)) {
      loadEnvFile(path);
      break;
    }
  }

  process.env.MIRU_ENV_LOADED = "1";
}

export interface IngestConfig {
  port: number;
  host: string;
  /** Secreto HMAC compartido con las plataformas (D-07). Solo servidor. */
  hmacSecret: string;
  supabaseUrl: string;
  /** service_role: nunca debe llegar al cliente (D-09). */
  supabaseServiceRoleKey: string;
  redisUrl: string;
  queueName: string;
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name] ?? "";
  if (value.trim().length === 0) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa .env (ver .env.example).`);
  }
  return value;
}

/**
 * Configuración del servicio de ingesta. Falla al arrancar si falta un secreto:
 * es preferible no levantar a levantar sin verificar firmas.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): IngestConfig {
  loadLocalEnv();

  return {
    port: Number(env.PORT ?? 3001),
    host: env.HOST ?? "0.0.0.0",
    hmacSecret: required(env, "MIRU_WEBHOOK_HMAC_SECRET"),
    supabaseUrl: required(env, "SUPABASE_URL"),
    supabaseServiceRoleKey: required(env, "SUPABASE_SERVICE_ROLE_KEY"),
    redisUrl: env.REDIS_URL ?? "redis://127.0.0.1:6379",
    queueName: env.MIRU_WEBHOOK_QUEUE ?? "miru-webhooks",
  };
}
