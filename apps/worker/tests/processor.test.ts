import { describe, expect, it } from "vitest";

import {
  compareExternalUpdatedAt,
  createProcessor,
  type OrderApplyInput,
  type PendingEvent,
  type ProcessorDeps,
} from "../src/processor.js";

const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const CONNECTION_ID = "22222222-2222-2222-2222-222222222222";
const ROW_ID = "33333333-3333-3333-3333-333333333333";

const payload = {
  event_id: "evt-001",
  event_type: "order.upserted",
  occurred_at: "2026-11-19T09:00:00-05:00",
  order: {
    external_id: "DP-1001",
    status: "pendiente",
    external_created_at: "2026-11-19T08:00:00-05:00",
    external_updated_at: "2026-11-19T09:00:00-05:00",
    carrier: "Coordinadora",
    tracking_number: null,
    customer: { name: "Cliente", phone: "3001234567", city: "Bogotá", address: null },
    shipping_cost_cents: 1_450_000,
    gateway_fee_cents: 0,
    items: [{ sku: "SKU-1", qty: 2, unit_price_cents: 8_400_000, unit_cost_cents: 5_000_000 }],
  },
};

function pendingEvent(overrides: Partial<PendingEvent> = {}): PendingEvent {
  return {
    id: ROW_ID,
    tenantId: TENANT_ID,
    connectionId: CONNECTION_ID,
    eventId: "evt-001",
    payload,
    processedAt: null,
    ...overrides,
  };
}

interface Harness {
  deps: ProcessorDeps;
  applied: OrderApplyInput[];
  processed: string[];
  failed: { rowId: string; message: string }[];
  touched: string[];
}

function harness(
  overrides: Partial<ProcessorDeps> = {},
  outcome: "applied" | "stale" = "applied",
): Harness {
  const applied: OrderApplyInput[] = [];
  const processed: string[] = [];
  const failed: { rowId: string; message: string }[] = [];
  const touched: string[] = [];

  const deps: ProcessorDeps = {
    getEvent: async () => pendingEvent(),
    applyOrder: async (input) => {
      applied.push(input);
      return outcome;
    },
    markProcessed: async (rowId) => {
      processed.push(rowId);
    },
    markFailed: async (rowId, message) => {
      failed.push({ rowId, message });
    },
    touchConnection: async (connectionId) => {
      touched.push(connectionId);
    },
    ...overrides,
  };

  return { deps, applied, processed, failed, touched };
}

describe("processEvent", () => {
  it("aplica el pedido con los campos del contrato y marca el evento", async () => {
    const h = harness();
    const outcome = await createProcessor(h.deps).processEvent(ROW_ID);

    expect(outcome).toBe("applied");
    expect(h.applied).toHaveLength(1);
    expect(h.applied[0]).toMatchObject({
      tenantId: TENANT_ID,
      connectionId: CONNECTION_ID,
      externalId: "DP-1001",
      status: "pendiente",
      carrier: "Coordinadora",
      shippingCostCents: 1_450_000,
      items: [{ sku: "SKU-1", qty: 2, unitPriceCents: 8_400_000, unitCostCents: 5_000_000 }],
    });
    expect(h.processed).toEqual([ROW_ID]);
    expect(h.touched).toEqual([CONNECTION_ID]);
    expect(h.failed).toHaveLength(0);
  });

  it("no reaplica un evento ya procesado", async () => {
    const h = harness({
      getEvent: async () => pendingEvent({ processedAt: "2026-11-19T10:00:00Z" }),
    });

    const outcome = await createProcessor(h.deps).processEvent(ROW_ID);

    expect(outcome).toBe("already-processed");
    expect(h.applied).toHaveLength(0);
    expect(h.processed).toHaveLength(0);
  });

  it("devuelve missing si la fila no existe", async () => {
    const h = harness({ getEvent: async () => null });

    const outcome = await createProcessor(h.deps).processEvent(ROW_ID);

    expect(outcome).toBe("missing");
    expect(h.applied).toHaveLength(0);
    expect(h.failed).toHaveLength(0);
  });

  it("marca invalid_payload y no aplica un payload roto", async () => {
    const h = harness({
      getEvent: async () =>
        pendingEvent({ payload: { event_id: "x", event_type: "order.upserted" } }),
    });

    const outcome = await createProcessor(h.deps).processEvent(ROW_ID);

    expect(outcome).toBe("invalid");
    expect(h.applied).toHaveLength(0);
    expect(h.failed).toHaveLength(1);
    expect(h.failed[0]?.message.startsWith("invalid_payload:")).toBe(true);
    expect(h.processed).toHaveLength(0);
  });

  it("marca procesado también cuando el evento es viejo (stale)", async () => {
    const h = harness({}, "stale");

    const outcome = await createProcessor(h.deps).processEvent(ROW_ID);

    expect(outcome).toBe("stale");
    expect(h.applied).toHaveLength(1);
    expect(h.processed).toEqual([ROW_ID]);
  });

  it("si falla la aplicación guarda el error y relanza para reintentar", async () => {
    const h = harness({
      applyOrder: async () => {
        throw new Error("conexión caída");
      },
    });

    await expect(createProcessor(h.deps).processEvent(ROW_ID)).rejects.toThrow("conexión caída");

    expect(h.failed).toEqual([{ rowId: ROW_ID, message: "conexión caída" }]);
    expect(h.processed).toHaveLength(0);
  });

  it("un fallo al actualizar la conexión no tumba el evento", async () => {
    const h = harness({
      touchConnection: async () => {
        throw new Error("db lenta");
      },
    });

    const outcome = await createProcessor(h.deps).processEvent(ROW_ID);

    expect(outcome).toBe("applied");
    expect(h.processed).toEqual([ROW_ID]);
  });
});

describe("compareExternalUpdatedAt", () => {
  it("detecta un evento viejo", () => {
    expect(compareExternalUpdatedAt("2026-11-19T09:00:00-05:00", "2026-11-19T08:59:59-05:00")).toBe(
      "stale",
    );
  });

  it("considera igual el reintento del mismo evento", () => {
    expect(compareExternalUpdatedAt("2026-11-19T09:00:00-05:00", "2026-11-19T14:00:00Z")).toBe(
      "equal",
    );
  });

  it("detecta una versión más nueva", () => {
    expect(compareExternalUpdatedAt("2026-11-19T09:00:00-05:00", "2026-11-19T09:00:01-05:00")).toBe(
      "newer",
    );
  });

  it("lanza con timestamps inválidos", () => {
    expect(() => compareExternalUpdatedAt("no-es-fecha", "2026-11-19T09:00:00-05:00")).toThrow(
      "Timestamp inválido",
    );
  });
});
