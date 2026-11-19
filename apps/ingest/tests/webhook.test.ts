import { describe, expect, it } from "vitest";
import { sign } from "@miru/shared/hmac";
import { miruEventV1Schema } from "@miru/shared";

import { buildServer, type PersistedEvent, type WebhookDeps } from "../src/app.js";

const SECRET = "test-secret";
const NOW = 1_767_000_000; // 2025-12-25T...Z fijo para la ventana de ±5 min
const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const CONNECTION_ID = "22222222-2222-2222-2222-222222222222";
const ROW_ID = "33333333-3333-3333-3333-333333333333";

const validEvent = {
  event_id: "evt-001",
  event_type: "order.upserted",
  occurred_at: "2026-11-19T09:00:00-05:00",
  order: {
    external_id: "DP-1001",
    status: "pendiente",
    external_created_at: "2026-11-19T08:00:00-05:00",
    external_updated_at: "2026-11-19T09:00:00-05:00",
    carrier: null,
    tracking_number: null,
    customer: { name: "Cliente", phone: "3001234567", city: "Bogotá", address: null },
    shipping_cost_cents: 1_450_000,
    gateway_fee_cents: 0,
    items: [{ sku: "SKU-1", qty: 2, unit_price_cents: 8_400_000, unit_cost_cents: 5_000_000 }],
  },
};

interface Harness {
  app: ReturnType<typeof buildServer>;
  persisted: PersistedEvent[];
  enqueued: string[];
}

function harness(overrides: Partial<WebhookDeps> = {}): Harness {
  const persisted: PersistedEvent[] = [];
  const enqueued: string[] = [];

  const app = buildServer({
    secret: SECRET,
    now: () => NOW,
    findConnection: async (id) =>
      id === CONNECTION_ID ? { id: CONNECTION_ID, tenantId: TENANT_ID } : null,
    storeEvent: async (event) => {
      persisted.push(event);
      return { status: "stored", id: ROW_ID };
    },
    enqueue: async (rowId) => {
      enqueued.push(rowId);
    },
    ...overrides,
  });

  return { app, persisted, enqueued };
}

function signedRequest(body: unknown, options: { signature?: string; timestamp?: string } = {}) {
  const raw = JSON.stringify(body);
  return {
    method: "POST" as const,
    url: `/webhooks/miru/v1/${CONNECTION_ID}`,
    headers: {
      "content-type": "application/json",
      "x-miru-signature": options.signature ?? sign(Buffer.from(raw), SECRET),
      "x-miru-timestamp": options.timestamp ?? String(NOW),
    },
    payload: raw,
  };
}

describe("POST /webhooks/miru/v1/:connectionId", () => {
  it("acepta un evento válido, lo persiste crudo y lo encola", async () => {
    const { app, persisted, enqueued } = harness();
    const eventWithExtra = { ...validEvent, extra_platform_field: true };

    const response = await app.inject(signedRequest(eventWithExtra));

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "accepted", event_id: "evt-001" });
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.eventId).toBe("evt-001");
    expect(persisted[0]?.tenantId).toBe(TENANT_ID);
    expect(persisted[0]?.externalUpdatedAt).toBe("2026-11-19T09:00:00-05:00");
    // D-07: se guarda el JSON tal como llegó, con claves desconocidas incluidas.
    expect(persisted[0]?.payload).toEqual(eventWithExtra);
    expect(enqueued).toEqual([ROW_ID]);

    await app.close();
  });

  it("rechaza una firma inválida sin tocar la base", async () => {
    const { app, persisted, enqueued } = harness();

    const response = await app.inject(signedRequest(validEvent, { signature: "sha256=deadbeef" }));

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "invalid_signature" });
    expect(persisted).toHaveLength(0);
    expect(enqueued).toHaveLength(0);

    await app.close();
  });

  it("rechaza un timestamp fuera de la ventana de ±5 minutos", async () => {
    const { app, persisted } = harness();

    const response = await app.inject(signedRequest(validEvent, { timestamp: String(NOW - 301) }));

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "stale_timestamp" });
    expect(persisted).toHaveLength(0);

    await app.close();
  });

  it("acepta el borde de la ventana (±300 s)", async () => {
    const { app } = harness();

    const response = await app.inject(signedRequest(validEvent, { timestamp: String(NOW - 300) }));

    expect(response.statusCode).toBe(200);

    await app.close();
  });

  it("rechaza JSON malformado con firma válida", async () => {
    const { app } = harness();
    const raw = "{ no es json }";

    const response = await app.inject({
      method: "POST",
      url: `/webhooks/miru/v1/${CONNECTION_ID}`,
      headers: {
        "content-type": "application/json",
        "x-miru-signature": sign(Buffer.from(raw), SECRET),
        "x-miru-timestamp": String(NOW),
      },
      payload: raw,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "invalid_json" });

    await app.close();
  });

  it("rechaza un payload que no cumple el contrato v1", async () => {
    const { app, persisted } = harness();
    const invalid = { ...validEvent, order: { ...validEvent.order, items: [] } };

    const response = await app.inject(signedRequest(invalid));

    expect(response.statusCode).toBe(422);
    expect(response.json().error).toBe("invalid_payload");
    expect(persisted).toHaveLength(0);

    await app.close();
  });

  it("responde 404 si la conexión no existe", async () => {
    const { app, persisted } = harness({ findConnection: async () => null });

    const response = await app.inject(signedRequest(validEvent));

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "unknown_connection" });
    expect(persisted).toHaveLength(0);

    await app.close();
  });

  it("responde 200 duplicate y reencola si el evento ya existía", async () => {
    const { app, enqueued } = harness({
      storeEvent: async () => ({ status: "duplicate", id: ROW_ID }),
    });

    const response = await app.inject(signedRequest(validEvent));

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "duplicate", event_id: "evt-001" });
    expect(enqueued).toEqual([ROW_ID]);

    await app.close();
  });

  it("responde 503 si la cola no está disponible, tras persistir", async () => {
    const { app } = harness({
      enqueue: async () => {
        throw new Error("redis down");
      },
    });

    const response = await app.inject(signedRequest(validEvent));

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: "queue_unavailable" });

    await app.close();
  });

  it("expone /health", async () => {
    const { app } = harness();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });

    await app.close();
  });

  it("corta con 429 al superar el límite por IP", async () => {
    const { app } = harness({ rateLimitMax: 2 });

    for (let i = 0; i < 2; i += 1) {
      const response = await app.inject(signedRequest(validEvent));
      expect(response.statusCode).toBe(200);
    }

    const blocked = await app.inject(signedRequest(validEvent));
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json()).toEqual({ error: "rate_limited" });

    await app.close();
  });
});

describe("contrato usado por la ingesta", () => {
  it("el fixture de las pruebas cumple miru v1", () => {
    expect(miruEventV1Schema.safeParse(validEvent).success).toBe(true);
  });

  it("no inventa campos: un evento sin order falla", () => {
    const parse = miruEventV1Schema.safeParse({ event_id: "x", event_type: "order.upserted" });
    expect(parse.success).toBe(false);
  });
});
