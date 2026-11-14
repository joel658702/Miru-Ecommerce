import { describe, expect, it } from "vitest";

import { miruEventV1Schema } from "../src/contract.js";

interface ValidPayload {
  event_id: string;
  event_type: string;
  occurred_at: string;
  order: {
    external_id: string;
    status: string;
    external_created_at: string;
    external_updated_at: string;
    carrier: string | null;
    tracking_number: string | null;
    customer: {
      name: string;
      phone: string;
      city: string;
      address: string | null;
    };
    shipping_cost_cents: number;
    gateway_fee_cents: number;
    items: Array<{
      sku: string;
      qty: number;
      unit_price_cents: number;
      unit_cost_cents: number;
    }>;
  };
}

function validPayload(): ValidPayload {
  return {
    event_id: "evt_123",
    event_type: "order.upserted",
    occurred_at: "2026-01-15T10:30:00-05:00",
    order: {
      external_id: "DROP-1",
      status: "confirmado",
      external_created_at: "2026-01-15T10:00:00Z",
      external_updated_at: "2026-01-15T10:05:00Z",
      carrier: "Servientrega",
      tracking_number: null,
      customer: {
        name: "Ana Pérez",
        phone: "3001234567",
        city: "Bogotá",
        address: null,
      },
      shipping_cost_cents: 1200000,
      gateway_fee_cents: 350000,
      items: [
        {
          sku: "SKU-1",
          qty: 2,
          unit_price_cents: 8990000,
          unit_cost_cents: 4500000,
        },
      ],
    },
  };
}

describe("miruEventV1Schema", () => {
  it("acepta un payload válido completo", () => {
    expect(miruEventV1Schema.safeParse(validPayload()).success).toBe(true);
  });

  it("acepta timestamps con offset -05:00 en el pedido (enmienda C-01)", () => {
    const payload = validPayload();
    payload.order.external_created_at = "2026-01-15T10:00:00-05:00";
    payload.order.external_updated_at = "2026-01-15T10:05:00-05:00";
    expect(miruEventV1Schema.safeParse(payload).success).toBe(true);
  });

  it("acepta timestamps en UTC con Z", () => {
    const payload = validPayload();
    payload.occurred_at = "2026-01-15T15:30:00Z";
    expect(miruEventV1Schema.safeParse(payload).success).toBe(true);
  });

  it("rechaza items vacío", () => {
    const payload = validPayload();
    payload.order.items = [];
    expect(miruEventV1Schema.safeParse(payload).success).toBe(false);
  });

  it("rechaza qty 0", () => {
    const payload = validPayload();
    payload.order.items[0]!.qty = 0;
    expect(miruEventV1Schema.safeParse(payload).success).toBe(false);
  });

  it("rechaza monto negativo", () => {
    const payload = validPayload();
    payload.order.items[0]!.unit_price_cents = -1;
    expect(miruEventV1Schema.safeParse(payload).success).toBe(false);
  });

  it("rechaza monto con decimales", () => {
    const payload = validPayload();
    payload.order.shipping_cost_cents = 1.5;
    expect(miruEventV1Schema.safeParse(payload).success).toBe(false);
  });

  it("rechaza status desconocido", () => {
    const payload = validPayload();
    payload.order.status = "desconocido";
    expect(miruEventV1Schema.safeParse(payload).success).toBe(false);
  });

  it("rechaza fecha no ISO", () => {
    const payload = validPayload();
    payload.order.external_created_at = "ayer";
    expect(miruEventV1Schema.safeParse(payload).success).toBe(false);
  });

  it("rechaza event_type distinto de order.upserted", () => {
    const payload = validPayload();
    payload.event_type = "order.created";
    expect(miruEventV1Schema.safeParse(payload).success).toBe(false);
  });

  it("rechaza occurred_at sin offset", () => {
    const payload = validPayload();
    payload.occurred_at = "2026-01-15T10:30:00";
    expect(miruEventV1Schema.safeParse(payload).success).toBe(false);
  });
});
