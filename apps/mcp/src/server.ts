import { createClient } from "@supabase/supabase-js";

import { buildServer } from "./app.js";
import { loadConfig } from "./config.js";
import { createRepository } from "./repository.js";

async function main(): Promise<void> {
  const config = loadConfig();

  // service_role: solo servidor (no se expone al cliente MCP).
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const repo = createRepository(supabase, config.tenantId);
  const app = buildServer(repo, config.apiToken);

  await app.listen({ port: config.port, host: config.host });
  console.log(`[mcp] escuchando en http://${config.host}:${config.port}/mcp`);
}

main().catch((error: unknown) => {
  console.error(`[mcp] error fatal: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
