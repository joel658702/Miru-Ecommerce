import { timingSafeEqual } from "node:crypto";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import type { McpRepository } from "./repository.js";
import { registerTools } from "./tools.js";

export function isAuthorized(header: string | undefined, token: string): boolean {
  if (header === undefined || !header.startsWith("Bearer ")) {
    return false;
  }

  const provided = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(token);

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

/**
 * Servidor MCP sobre Streamable HTTP (sin sesiones) en `/mcp`.
 * Solo lectura: las herramientas consultan, nunca escriben.
 */
export function buildServer(repo: McpRepository, apiToken: string): FastifyInstance {
  const app = Fastify({ logger: false, bodyLimit: 1024 * 1024 });

  app.get("/health", async () => ({ ok: true, service: "mcp" }));

  const handle = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!isAuthorized(request.headers.authorization, apiToken)) {
      await reply.code(401).send({ error: "unauthorized" });
      return;
    }

    const server = new McpServer({ name: "miru-ecommerce", version: "0.1.0" });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    registerTools(server, repo);

    reply.hijack();
    await server.connect(transport);
    await transport.handleRequest(request.raw, reply.raw, request.body);
  };

  app.post("/mcp", handle);
  app.get("/mcp", handle);
  app.delete("/mcp", handle);

  return app;
}
