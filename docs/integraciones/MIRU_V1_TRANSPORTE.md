# Transporte de webhooks — Miru v1

Contrato **propio** de Miru para recibir eventos del panel. **No** describe las APIs nativas de
Dropi, MasterShop ni Effi: esas siguen sin documentación oficial y no se inventan (D-11).

- Payload canónico: [`packages/shared/src/contract.ts`](../../packages/shared/src/contract.ts)
  (evento `order.upserted`).
- Implementación: [`apps/ingest`](../../apps/ingest).

## 1. Endpoint

```
POST {INGEST_URL}/webhooks/miru/v1/:connectionId
Content-Type: application/json
```

`connectionId` es el UUID de la fila en `connections`; debe estar en estado `activa`.

## 2. Cabeceras

| Cabecera           | Valor                  | Regla                                            |
| ------------------ | ---------------------- | ------------------------------------------------ |
| `x-miru-signature` | `sha256=<hex>`         | HMAC-SHA256 del **body crudo**, byte por byte    |
| `x-miru-timestamp` | segundos Unix (string) | Debe estar dentro de ±300 s del reloj del server |

La firma se verifica **antes** de deserializar el JSON. Un reintento con el mismo body y una
firma nueva es válido mientras el timestamp siga vigente.

## 3. Respuestas

| Código | `error` / `status`              | Significado                                                   |
| ------ | ------------------------------- | ------------------------------------------------------------- |
| 200    | `accepted`                      | Evento nuevo persistido y encolado                            |
| 200    | `duplicate`                     | Ya existía `(connection_id, external_event_id)`; reencola     |
| 400    | `invalid_body` / `invalid_json` | Cuerpo ausente o JSON roto                                    |
| 401    | `invalid_signature`             | HMAC no coincide                                              |
| 401    | `stale_timestamp`               | Timestamp fuera de ±5 min o ausente                           |
| 404    | `unknown_connection`            | UUID inexistente o conexión no activa                         |
| 422    | `invalid_payload`               | No cumple el contrato v1 (incluye `issues`)                   |
| 503    | `queue_unavailable`             | Redis caído; el evento queda persistido y se puede reintentar |

## 4. Garantías

1. **Persistir antes de procesar** (D-07): la fila se escribe en `webhook_events` antes de
   encolar. `processed_at` queda `null` hasta que el worker la procese.
2. **Idempotencia**: `unique(connection_id, external_event_id)` en la base. El segundo intento
   responde `200 duplicate` y reencola con el mismo `jobId`.
3. **ACK rápido**: medido en local, 38 ms en caliente (límite: 500 ms). El trabajo pesado va a
   BullMQ.
4. **Orden**: aplicarlo (solo si `external_updated_at` entrante > almacenado) es
   responsabilidad del worker, no de la ingesta.

## 5. Variables de entorno (solo servidor)

| Variable                    | Uso                                              |
| --------------------------- | ------------------------------------------------ |
| `MIRU_WEBHOOK_HMAC_SECRET`  | Secreto compartido para firmar (D-09)            |
| `SUPABASE_URL`              | URL del proyecto Supabase                        |
| `SUPABASE_SERVICE_ROLE_KEY` | Escritura en `webhook_events` (nunca al cliente) |
| `REDIS_URL`                 | Redis de BullMQ (`redis://127.0.0.1:6379`)       |
| `MIRU_WEBHOOK_QUEUE`        | Opcional; por defecto `miru-webhooks`            |

## 6. Ejemplo

```bash
BODY='{"event_id":"evt-1","event_type":"order.upserted","occurred_at":"2026-11-19T09:00:00-05:00","order":{...}}'
TS=$(date +%s)
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$MIRU_WEBHOOK_HMAC_SECRET" -r | cut -d' ' -f1)"

curl -X POST "http://127.0.0.1:3001/webhooks/miru/v1/$CONNECTION_ID" \
  -H 'content-type: application/json' \
  -H "x-miru-signature: $SIG" \
  -H "x-miru-timestamp: $TS" \
  --data-binary "$BODY"
```

## 7. Payload canónico

Archivo de referencia: [`ejemplo-order.upserted.json`](ejemplo-order.upserted.json).

```json
{
  "event_id": "evt-ejemplo-0001",
  "event_type": "order.upserted",
  "occurred_at": "2026-11-19T09:15:00-05:00",
  "order": {
    "external_id": "DP-1001",
    "status": "confirmado",
    "external_created_at": "2026-11-19T08:40:00-05:00",
    "external_updated_at": "2026-11-19T09:10:00-05:00",
    "carrier": "Coordinadora",
    "tracking_number": "CO-994120581",
    "customer": {
      "name": "Camila Restrepo",
      "phone": "3105550142",
      "city": "Medellín",
      "address": "Cra 43 # 10-25"
    },
    "shipping_cost_cents": 1450000,
    "gateway_fee_cents": 0,
    "items": [
      {
        "sku": "LAMP-LED-01",
        "qty": 2,
        "unit_price_cents": 8400000,
        "unit_cost_cents": 5000000
      }
    ]
  }
}
```

| Campo                       | Tipo                | Regla                                                                                     |
| --------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `event_id`                  | string              | Único por conexión. Reenviar el mismo no duplica el pedido                                |
| `event_type`                | `"order.upserted"`  | Único tipo soportado hoy                                                                  |
| `occurred_at`               | ISO 8601 con offset | Cuándo generó el evento la plataforma                                                     |
| `order.external_id`         | string              | Identificador del pedido en la plataforma                                                 |
| `order.status`              | enum                | `pendiente`, `confirmado`, `en_transito`, `entregado`, `devuelto`, `cancelado`, `novedad` |
| `order.external_created_at` | ISO 8601 con offset | Creación en la plataforma                                                                 |
| `order.external_updated_at` | ISO 8601 con offset | **Ordena las actualizaciones**: solo se aplica si es mayor                                |
| `order.carrier`             | string \| null      | Transportadora                                                                            |
| `order.tracking_number`     | string \| null      | Guía                                                                                      |
| `order.customer`            | objeto              | `name`, `phone`, `city` obligatorios; `address` nullable                                  |
| `order.shipping_cost_cents` | entero ≥ 0          | **Centavos**, no pesos                                                                    |
| `order.gateway_fee_cents`   | entero ≥ 0          | Centavos                                                                                  |
| `order.items[]`             | array ≥ 1           | `sku`, `qty > 0`, `unit_price_cents`, `unit_cost_cents`                                   |

**El fee Miru no se envía**: lo calcula la base de datos de Miru (5 % por ítem).

## 8. Cómo firmar (para el equipo de la plataforma)

La firma se calcula sobre **el body exacto** que se envía (mismos bytes, sin reformatear).

**Node.js**

```js
import { createHmac } from "node:crypto";

const raw = JSON.stringify(payload); // se envía este mismo string
const signature = `sha256=${createHmac("sha256", SECRET).update(raw).digest("hex")}`;
```

**PHP**

```php
$raw = json_encode($payload);
$signature = 'sha256=' . hash_hmac('sha256', $raw, $secret);
```

**OpenSSL / cURL**

```bash
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -r | cut -d' ' -f1)"
```

**Vector de prueba** (para verificar su implementación):

| Entrada        | Valor                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Body           | [`ejemplo-order.upserted.json`](ejemplo-order.upserted.json) (567 bytes UTF-8) |
| Secreto        | `test-secret`                                                                  |
| Firma esperada | `sha256=faed6806b262f98ceafa5a79b2c88170009e39f15c7eb0db8d4414f56cdad3ce`      |

## 9. Reintentos y comportamiento esperado

- **Timeout recomendado** del lado emisor: 5 s. Miru responde en < 500 ms.
- **Reintentos** con backoff exponencial (2, 4, 8, 16, 32 s) máximo 5 intentos.
- Un `200` (`accepted` o `duplicate`) significa **entregado**: no reintentar.
- Un `401`, `400` o `422` es un **error de la integración**: corregir y reemitir con nuevo
  `timestamp`; reintentar igual no sirve.
- Un `503` es transitorio (cola caída): reintentar.
- Los reenvíos del mismo `event_id` son seguros: la base impide el duplicado.

## 10. Checklist de integración

1. [ ] Recibieron `connection_id` y el secreto HMAC por canal privado.
2. [ ] Calculan la firma sobre el body crudo y envían `x-miru-signature` + `x-miru-timestamp`.
3. [ ] El `timestamp` se genera al momento del envío (no se reutiliza).
4. [ ] `event_id` es único por evento; se reutiliza en reintentos.
5. [ ] Montos siempre en **centavos enteros**.
6. [ ] `external_updated_at` refleja la última modificación del pedido.
7. [ ] Probado contra el sandbox con el vector de la sección 8.
