import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

function loadLocalEnv(): void {
  if (process.env.MIRU_ENV_LOADED === "1") {
    return;
  }

  // dist/config.js y src/config.ts quedan a la misma profundidad:
  // apps/worker/<src|dist>/config.* -> ../../../ = raíz del repo.
  for (const relative of ["../../../.env", "../.env"]) {
    const path = fileURLToPath(new URL(relative, import.meta.url));
    if (existsSync(path)) {
      loadEnvFile(path);
      break;
    }
  }

  process.env.MIRU_ENV_LOADED = "1";
}

export interface WorkerConfig {
  supabaseUrl: string;
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

export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  loadLocalEnv();

  return {
    supabaseUrl: required(env, "SUPABASE_URL"),
    supabaseServiceRoleKey: required(env, "SUPABASE_SERVICE_ROLE_KEY"),
    redisUrl: env.REDIS_URL ?? "redis://127.0.0.1:6379",
    queueName: env.MIRU_WEBHOOK_QUEUE ?? "miru-webhooks",
  };
}
