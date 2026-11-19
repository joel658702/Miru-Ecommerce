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
