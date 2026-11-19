export interface McpConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  tenantId: string;
  apiToken: string;
  port: number;
  host: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Falta ${name}`);
  }
  return value;
}

/** El servidor MCP solo lee: service_role y token se quedan en el servidor. */
export function loadConfig(): McpConfig {
  return {
    supabaseUrl: required("SUPABASE_URL"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    tenantId: required("MCP_TENANT_ID"),
    apiToken: required("MCP_API_TOKEN"),
    port: Number.parseInt(process.env.PORT ?? "3002", 10),
    host: process.env.HOST ?? "0.0.0.0",
  };
}
