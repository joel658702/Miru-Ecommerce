import { miruEventV1Schema } from "@miru/shared";

export interface PendingEvent {
  id: string;
  tenantId: string;
  connectionId: string;
  eventId: string;
  payload: unknown;
  processedAt: string | null;
}

export interface OrderItemInput {
  sku: string;
  qty: number;
  unitPriceCents: number;
  unitCostCents: number;
}

export interface OrderApplyInput {
  tenantId: string;
  connectionId: string;
  externalId: string;
  status: string;
  externalCreatedAt: string;
  externalUpdatedAt: string;
  carrier: string | null;
  trackingNumber: string | null;
  customer: { name: string; phone: string; city: string; address: string | null };
  shippingCostCents: number;
  gatewayFeeCents: number;
  items: OrderItemInput[];
}

export interface ProcessorDeps {
  getEvent(rowId: string): Promise<PendingEvent | null>;
  /**
   * Aplica el pedido solo si `externalUpdatedAt` es mayor que el almacenado
   * (D-07). Devuelve `stale` cuando el evento es viejo o ya fue aplicado.
   */
  applyOrder(input: OrderApplyInput): Promise<"applied" | "stale">;
  /** Marca `processed_at` y limpia el error previo. */
  markProcessed(rowId: string): Promise<void>;
  /** Guarda el motivo en `process_error`. */
  markFailed(rowId: string, message: string): Promise<void>;
  touchConnection(connectionId: string): Promise<void>;
}

export type ProcessOutcome = "applied" | "stale" | "already-processed" | "missing" | "invalid";

/**
 * Regla de orden de D-07: solo se aplica lo más reciente.
 *
 * `equal` no es un empate ambiguo: es el mismo `external_updated_at`, es decir,
 * el reintento de un evento que ya se aplicó (o una aplicación a medias). Se
 * vuelve a aplicar porque el proceso es idempotente.
 */
export function compareExternalUpdatedAt(
  storeIso: string,
  incomingIso: string,
): "stale" | "equal" | "newer" {
  const stored = Date.parse(storeIso);
  const incoming = Date.parse(incomingIso);

  if (Number.isNaN(stored) || Number.isNaN(incoming)) {
    throw new Error(`Timestamp inválido: ${storeIso} / ${incomingIso}`);
  }

  if (incoming < stored) return "stale";
  if (incoming === stored) return "equal";
  return "newer";
}

/**
 * Procesa un evento ya persistido por la ingesta.
 *
 * Idempotente: si el evento ya tiene `processed_at`, no vuelve a aplicarse. Un
 * fallo de base de datos se propaga para que BullMQ reintente (la comparación
 * de `external_updated_at` hace que el reintento sea seguro).
 */
export function createProcessor(deps: ProcessorDeps) {
  return {
    async processEvent(rowId: string): Promise<ProcessOutcome> {
      const event = await deps.getEvent(rowId);
      if (event === null) {
        return "missing";
      }
      if (event.processedAt !== null) {
        return "already-processed";
      }

      const parsed = miruEventV1Schema.safeParse(event.payload);
      if (!parsed.success) {
        const detail = parsed.error.issues
          .map((issue) => `${issue.path.join(".")}:${issue.code}`)
          .join(",");
        await deps.markFailed(rowId, `invalid_payload: ${detail}`);
        return "invalid";
      }

      const data = parsed.data;

      let outcome: "applied" | "stale";
      try {
        outcome = await deps.applyOrder({
          tenantId: event.tenantId,
          connectionId: event.connectionId,
          externalId: data.order.external_id,
          status: data.order.status,
          externalCreatedAt: data.order.external_created_at,
          externalUpdatedAt: data.order.external_updated_at,
          carrier: data.order.carrier,
          trackingNumber: data.order.tracking_number,
          customer: {
            name: data.order.customer.name,
            phone: data.order.customer.phone,
            city: data.order.customer.city,
            address: data.order.customer.address,
          },
          shippingCostCents: data.order.shipping_cost_cents,
          gatewayFeeCents: data.order.gateway_fee_cents,
          items: data.order.items.map((item) => ({
            sku: item.sku,
            qty: item.qty,
            unitPriceCents: item.unit_price_cents,
            unitCostCents: item.unit_cost_cents,
          })),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "apply_failed";
        await deps.markFailed(rowId, message);
        throw error;
      }

      await deps.markProcessed(rowId);
      await deps.touchConnection(event.connectionId).catch(() => undefined);

      return outcome;
    },
  };
}
