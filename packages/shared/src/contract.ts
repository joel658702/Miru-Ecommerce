import { z } from "zod";

import { ORDER_STATUSES } from "./status.js";

/**
 * Contrato canónico Miru v1 — evento `order.upserted`.
 *
 * El fee Miru 5% NO se calcula aquí: vive en la base de datos (columna
 * generada por ítem + totalizado por trigger). Este esquema solo describe lo
 * que llega desde la integración.
 */

const centsSchema = z.number().int().nonnegative();

// Enmienda C-01: todos los timestamps del contrato aceptan offset explícito
// (`-05:00`) además de `Z`. Los payloads nativos llegan en hora local de Colombia.
const isoDateTimeSchema = z.iso.datetime({ offset: true });

const itemSchema = z.object({
  sku: z.string(),
  qty: z.number().int().positive(),
  unit_price_cents: centsSchema,
  unit_cost_cents: centsSchema,
});

const customerSchema = z.object({
  name: z.string(),
  phone: z.string(),
  city: z.string(),
  address: z.string().nullable(),
});

const orderSchema = z.object({
  external_id: z.string(),
  status: z.enum(ORDER_STATUSES),
  external_created_at: isoDateTimeSchema,
  external_updated_at: isoDateTimeSchema,
  carrier: z.string().nullable(),
  tracking_number: z.string().nullable(),
  customer: customerSchema,
  shipping_cost_cents: centsSchema,
  gateway_fee_cents: centsSchema,
  items: z.array(itemSchema).min(1),
});

export const miruEventV1Schema = z.object({
  event_id: z.string(),
  event_type: z.literal("order.upserted"),
  occurred_at: isoDateTimeSchema,
  order: orderSchema,
});

export type MiruEventV1 = z.infer<typeof miruEventV1Schema>;
