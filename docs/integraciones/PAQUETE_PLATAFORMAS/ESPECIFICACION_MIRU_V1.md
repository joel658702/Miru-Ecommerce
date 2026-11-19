# Integración Miru v1 · Especificación para plataformas

Versión del contrato: **miru.v1** · Fecha: 19-nov-2026

## 1. Endpoint

Cada canal tiene su propia URL, con un `connection_id` (UUID) asignado por Miru:

```
POST https://api.miruecommerce.pro/webhooks/miru/v1/<connection_id>
Content-Type: application/json
```

Ejemplo (canal de prueba): `.../webhooks/miru/v1/55555555-5555-5555-5555-555555555555`

## 2. Cabeceras obligatorias

| Cabecera           | Valor                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| `Content-Type`     | `application/json`                                                       |
| `x-miru-signature` | `sha256=<hex>` — HMAC-SHA256 del **body crudo** con el secreto del canal |
| `x-miru-timestamp` | Segundos Unix del momento del envío (se acepta ±5 minutos)               |

La firma se calcula sobre **los bytes exactos** que se envían. Si se re-serializa
el JSON después de firmar, la firma deja de valer.

## 3. Payload

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
      { "sku": "LAMP-LED-01", "qty": 2, "unit_price_cents": 8400000, "unit_cost_cents": 5000000 }
    ]
  }
}
```

| Campo                       | Tipo                | Regla                                                                                     |
| --------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `event_id`                  | string              | Único por conexión. Reenviarlo no duplica el pedido                                       |
| `event_type`                | string              | Solo `order.upserted`                                                                     |
| `occurred_at`               | ISO 8601 con offset | Cuándo se generó el evento                                                                |
| `order.external_id`         | string              | ID del pedido en la plataforma                                                            |
| `order.status`              | enum                | `pendiente`, `confirmado`, `en_transito`, `entregado`, `devuelto`, `cancelado`, `novedad` |
| `order.external_created_at` | ISO 8601            | Creación en la plataforma                                                                 |
| `order.external_updated_at` | ISO 8601            | Ordena las actualizaciones (solo se aplica si es mayor)                                   |
| `order.carrier`             | string \| null      | Transportadora                                                                            |
| `order.tracking_number`     | string \| null      | Guía                                                                                      |
| `order.customer`            | objeto              | `name`, `phone`, `city` obligatorios; `address` opcional                                  |
| `order.shipping_cost_cents` | entero ≥ 0          | **Centavos**, no pesos                                                                    |
| `order.gateway_fee_cents`   | entero ≥ 0          | Centavos                                                                                  |
| `order.items[]`             | array ≥ 1           | `sku`, `qty > 0`, `unit_price_cents`, `unit_cost_cents`                                   |

El fee de Miru **no se envía**: lo calcula la base de datos de Miru.

## 4. Firma (ejemplos)

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

**OpenSSL**

```bash
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -r | cut -d' ' -f1)"
```

## 5. Vector de prueba

| Entrada        | Valor                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Body           | `ejemplo-order.upserted.json` (567 bytes UTF-8)                           |
| Secreto        | `test-secret`                                                             |
| Firma esperada | `sha256=faed6806b262f98ceafa5a79b2c88170009e39f15c7eb0db8d4414f56cdad3ce` |

Si su implementación produce esa firma, está correcta.

## 6. Respuestas

| Código | Significado                 | Acción                                  |
| ------ | --------------------------- | --------------------------------------- |
| `200`  | `accepted` o `duplicate`    | Entregado. **No reintentar**            |
| `400`  | JSON inválido               | Corregir y reemitir con nuevo timestamp |
| `401`  | Firma o timestamp inválidos | Revisar secreto/reloj; reemitir         |
| `404`  | `connection_id` desconocido | Revisar la URL                          |
| `422`  | Payload fuera de contrato   | Corregir campos y reemitir              |
| `429`  | Demasiadas peticiones       | Esperar `retry-after` y reintentar      |
| `503`  | Servicio no disponible      | Reintentar con backoff                  |

## 7. Reintentos

- Timeout recomendado: **5 s** (Miru responde en < 500 ms).
- Backoff exponencial: 2, 4, 8, 16, 32 s; máximo 5 intentos.
- Reutilizar el **mismo `event_id`** en los reintentos: es idempotente.
- Un `200`, `400`, `401` o `422` no se reintenta.

## 8. Seguridad

- TLS obligatorio (HTTPS).
- No incluir datos de tarjetas ni contraseñas en el payload.
- El secreto HMAC es por canal y se comparte por un medio privado.
