import type { SupabaseClient } from "@supabase/supabase-js";

import { compareExternalUpdatedAt } from "./processor.js";
import type { OrderApplyInput, PendingEvent, ProcessorDeps } from "./processor.js";

interface EventRow {
  id: string;
  tenant_id: string;
  connection_id: string;
  external_event_id: string;
  payload: unknown;
  processed_at: string | null;
}

interface OrderRow {
  id: string;
  external_updated_at: string;
}

const ORDER_FIELDS = (input: OrderApplyInput) => ({
  estado: input.status,
  carrier: input.carrier,
  tracking_number: input.trackingNumber,
  customer_name: input.customer.name,
  customer_phone: input.customer.phone,
  customer_city: input.customer.city,
  customer_address: input.customer.address,
  shipping_cost_cents: input.shippingCostCents,
  gateway_fee_cents: input.gatewayFeeCents,
  external_updated_at: input.externalUpdatedAt,
});

const MAX_ERROR_LENGTH = 2000;

/**
 * Implementación con service_role (D-09). El fee Miru nunca se escribe aquí:
 * es columna generada en `order_items` y el trigger lo totaliza en `orders`.
 */
export function createRepository(supabase: SupabaseClient): ProcessorDeps {
  return {
    async getEvent(rowId: string): Promise<PendingEvent | null> {
      const { data, error } = await supabase
        .from("webhook_events")
        .select("id, tenant_id, connection_id, external_event_id, payload, processed_at")
        .eq("id", rowId)
        .maybeSingle<EventRow>();

      if (error !== null) {
        throw error;
      }
      if (data === null) {
        return null;
      }

      return {
        id: data.id,
        tenantId: data.tenant_id,
        connectionId: data.connection_id,
        eventId: data.external_event_id,
        payload: data.payload,
        processedAt: data.processed_at,
      };
    },

    async applyOrder(input: OrderApplyInput): Promise<"applied" | "stale"> {
      const existing = await supabase
        .from("orders")
        .select("id, external_updated_at")
        .eq("connection_id", input.connectionId)
        .eq("external_id", input.externalId)
        .maybeSingle<OrderRow>();

      if (existing.error !== null) {
        throw existing.error;
      }

      let orderId: string;

      if (existing.data === null) {
        const inserted = await supabase
          .from("orders")
          .insert({
            tenant_id: input.tenantId,
            connection_id: input.connectionId,
            external_id: input.externalId,
            external_created_at: input.externalCreatedAt,
            ...ORDER_FIELDS(input),
          })
          .select("id")
          .single<{ id: string }>();

        if (inserted.error !== null) {
          // Otro intento la creó en paralelo: se reintenta como actualización.
          if (inserted.error.code === "23505") {
            return "stale";
          }
          throw inserted.error;
        }

        orderId = inserted.data.id;
      } else {
        orderId = existing.data.id;

        const order = compareExternalUpdatedAt(
          existing.data.external_updated_at,
          input.externalUpdatedAt,
        );
        if (order === "stale") {
          return "stale";
        }

        if (order === "newer") {
          // Condición atómica: solo si en la BD sigue siendo más viejo.
          const updated = await supabase
            .from("orders")
            .update(ORDER_FIELDS(input))
            .eq("id", orderId)
            .lt("external_updated_at", input.externalUpdatedAt)
            .select("id");

          if (updated.error !== null) {
            throw updated.error;
          }
          if (((updated.data as { id: string }[] | null) ?? []).length === 0) {
            return "stale";
          }
        }
        // `equal`: reintento del mismo evento; se reaplican los ítems abajo.
      }

      // Reemplazo de ítems: el fee lo recalcula la BD por cada fila y el
      // trigger lo totaliza en `orders`.
      const removed = await supabase.from("order_items").delete().eq("order_id", orderId);
      if (removed.error !== null) {
        throw removed.error;
      }

      const insertedItems = await supabase.from("order_items").insert(
        input.items.map((item) => ({
          order_id: orderId,
          sku: item.sku,
          qty: item.qty,
          unit_price_cents: item.unitPriceCents,
          unit_cost_cents: item.unitCostCents,
        })),
      );

      if (insertedItems.error !== null) {
        throw insertedItems.error;
      }

      return "applied";
    },

    async markProcessed(rowId: string): Promise<void> {
      const { error } = await supabase
        .from("webhook_events")
        .update({ processed_at: new Date().toISOString(), process_error: null })
        .eq("id", rowId);

      if (error !== null) {
        throw error;
      }
    },

    async markFailed(rowId: string, message: string): Promise<void> {
      const { error } = await supabase
        .from("webhook_events")
        .update({ process_error: message.slice(0, MAX_ERROR_LENGTH) })
        .eq("id", rowId);

      if (error !== null) {
        throw error;
      }
    },

    async touchConnection(connectionId: string): Promise<void> {
      const { error } = await supabase
        .from("connections")
        .update({ ultimo_evento_at: new Date().toISOString() })
        .eq("id", connectionId);

      if (error !== null) {
        throw error;
      }
    },
  };
}
