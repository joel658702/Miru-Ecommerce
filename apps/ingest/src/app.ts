import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import { miruEventV1Schema } from "@miru/shared";
import { isTimestampFresh, verifySignature } from "@miru/shared/hmac";

import { createRateLimiter } from "./rate-limit.js";

/**
 * Cabeceras del transporte Miru v1 (documentadas en
 * docs/integraciones/MIRU_V1_TRANSPORTE.md). No son cabeceras de Dropi,
 * MasterShop ni Effi: esas APIs nativas siguen sin documentación (D-11).
 */
export const SIGNATURE_HEADER = "x-miru-signature";
export const TIMESTAMP_HEADER = "x-miru-timestamp";

export interface PersistedEvent {
  connectionId: string;
  tenantId: string;
  eventId: string;
  eventType: string;
  occurredAt: string;
  externalUpdatedAt: string;
  payload: unknown;
}

export interface WebhookDeps {
  /** Secreto HMAC compartido (solo servidor). */
  secret: string;
  /** Logs de Fastify (se desactivan en las pruebas). */
  logger?: boolean;
  /** Reloj inyectable para probar la ventana de ±5 min. */
  now?: () => number;
  /** Máximo de peticiones por minuto e IP (las pruebas usan valores bajos). */
  rateLimitMax?: number;
  findConnection: (connectionId: string) => Promise<{ id: string; tenantId: string } | null>;
  /**
   * Persiste el evento crudo ANTES de procesar (D-07). Devuelve `duplicate`
   * cuando ya existía por `(connection_id, external_event_id)`.
   */
  storeEvent: (event: PersistedEvent) => Promise<{ status: "stored" | "duplicate"; id: string }>;
  /** Encola el trabajo pesado; recibe el id de la fila de webhook_events. */
  enqueue: (eventRowId: string) => Promise<void>;
}

const MAX_BODY_BYTES = 1024 * 1024; // 1 MiB

/** Límite por defecto: 120 peticiones por minuto e IP. */
const DEFAULT_RATE_LIMIT_MAX = 120;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function headerValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

/**
 * Servidor de ingesta Miru v1.
 *
 * Contrato de respuesta (ACK):
 *   200 almacenado o duplicado · 401 firma/timestamp inválidos · 404 conexión
 *   desconocida · 422 payload fuera de contrato · 503 Redis no disponible.
 */
export function buildServer(deps: WebhookDeps): FastifyInstance {
  const app = Fastify({ logger: deps.logger ?? false, bodyLimit: MAX_BODY_BYTES });

  // Límite por IP: protege la ingesta de picos o abuso sin tocar el ACK.
  const limiter = createRateLimiter(deps.rateLimitMax ?? DEFAULT_RATE_LIMIT_MAX, 60_000);

  app.addHook("onRequest", async (request, reply) => {
    const result = limiter.check(request.ip);

    if (!result.allowed) {
      void reply
        .header("retry-after", String(Math.ceil(result.retryAfterMs / 1000)))
        .code(429)
        .send({ error: "rate_limited" });
    }
  });

  // Guardamos el body CRUDO: la firma se verifica sobre los bytes exactos que
  // envió la plataforma, antes de deserializar (D-07).
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer", bodyLimit: MAX_BODY_BYTES },
    (_request, body, done) => done(null, body),
  );

  app.get("/health", async () => ({ ok: true }));

  // Nunca devolver mensajes internos (SQL, detalles de conexión) al emisor.
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({ error: "invalid_request" });
    }
    if (typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: "invalid_request" });
    }

    request.log.error({ err: error }, "Error no controlado en la ingesta");
    return reply.code(500).send({ error: "internal_error" });
  });

  app.post<{ Params: { connectionId: string } }>(
    "/webhooks/miru/v1/:connectionId",
    async (request, reply) => {
      const raw = request.body;
      if (!Buffer.isBuffer(raw)) {
        return reply.code(400).send({ error: "invalid_body" });
      }

      const signature = headerValue(request.headers[SIGNATURE_HEADER]);
      if (signature === null || !verifySignature(raw, deps.secret, signature)) {
        return reply.code(401).send({ error: "invalid_signature" });
      }

      const timestamp = headerValue(request.headers[TIMESTAMP_HEADER]);
      const nowSeconds = deps.now ? deps.now() : Math.floor(Date.now() / 1000);
      if (timestamp === null || !isTimestampFresh(timestamp, nowSeconds)) {
        return reply.code(401).send({ error: "stale_timestamp" });
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw.toString("utf8"));
      } catch {
        return reply.code(400).send({ error: "invalid_json" });
      }

      const validation = miruEventV1Schema.safeParse(parsed);
      if (!validation.success) {
        return reply.code(422).send({
          error: "invalid_payload",
          issues: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            code: issue.code,
          })),
        });
      }

      const event = validation.data;
      const connectionId = request.params.connectionId;
      if (!UUID_PATTERN.test(connectionId)) {
        return reply.code(404).send({ error: "unknown_connection" });
      }

      const connection = await deps.findConnection(connectionId);
      if (connection === null) {
        return reply.code(404).send({ error: "unknown_connection" });
      }

      const stored = await deps.storeEvent({
        connectionId: connection.id,
        tenantId: connection.tenantId,
        eventId: event.event_id,
        eventType: event.event_type,
        occurredAt: event.occurred_at,
        externalUpdatedAt: event.order.external_updated_at,
        // Se persiste el JSON tal como llegó, no la salida de Zod (que descarta
        // claves desconocidas): D-07 exige guardar el evento crudo.
        payload: parsed,
      });

      // También se encola en el camino duplicado: si el encolado falló en el
      // intento anterior, el reintento de la plataforma lo recupera.
      try {
        await deps.enqueue(stored.id);
      } catch (error) {
        request.log.error({ err: error }, "No se pudo encolar el evento");
        return reply.code(503).send({ error: "queue_unavailable" });
      }

      return reply.code(200).send({
        status: stored.status === "stored" ? "accepted" : "duplicate",
        event_id: event.event_id,
      });
    },
  );

  return app;
}
