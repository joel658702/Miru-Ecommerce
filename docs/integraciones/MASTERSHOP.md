# Integración MasterShop

Fuente: **Mastershop Public API** (Postman, 19-nov-2026).
Base: `https://prod.api.mastershop.com` · Auth: cabecera **`ms-api-key`**.

## Cómo funciona (diferencia clave con Miru v1)

MasterShop **no envía** el contrato Miru v1:

- No hay firma HMAC ni secreto compartido; la única protección es una **URL
  difícil de adivinar**.
- Su notificación trae su propio sobre: `{ eventName, body: { ...pedido..., id_status } }`.
- No está especificado el reintento, el timeout ni el orden de entrega → el
  receptor debe ser **idempotente** y tolerar duplicados y desorden.

Por eso Miru necesita un **receptor dedicado** (`/webhooks/mastershop/...`) que
valide la URL secreta, guarde el evento crudo y lo traduzca al modelo interno.

## Suscripciones (idWebhook)

| idWebhook    | Evento                                | ¿Suscribir?                      |
| ------------ | ------------------------------------- | -------------------------------- |
| 15           | Pedido creado                         | Sí                               |
| 16           | Cambio de estado del pedido           | Sí                               |
| 17           | Cambio de estado de la transportadora | Sí                               |
| 18           | Pedido entregado                      | Sí                               |
| 27           | Pedido con novedad                    | Sí                               |
| 19–26, 28–37 | Estados específicos                   | Solo si se necesita granularidad |

La suscripción se crea con `POST /api/webhooks`:

```json
{
  "idProduct": null,
  "idWebhook": 15,
  "name": "Miru",
  "url": "https://api.miruecommerce.pro/webhooks/mastershop/<connection_id>?token=<token>",
  "webhookName": "Miru"
}
```

Devuelve `productWebhook.idProductWebhook`; **guardarlo**, porque no hay endpoint
para listar suscripciones y sin ese id no se pueden desactivar con `PUT`.

## Estados de MasterShop → Miru

| `id_status` | MasterShop                  | Estado Miru   |
| ----------- | --------------------------- | ------------- |
| 1           | Por Confirmar               | `pendiente`   |
| 2           | Pendiente                   | `confirmado`  |
| 3           | Por Alistar (guía generada) | `confirmado`  |
| 4           | Por Recolectar              | `confirmado`  |
| 5           | Recolectada                 | `en_transito` |
| 6           | En tránsito                 | `en_transito` |
| 8           | Entregada                   | `entregado`   |
| 9           | Cancelada                   | `cancelado`   |
| 10          | Devuelta                    | `devuelto`    |
| 11          | Reclamaciones               | `novedad`     |

Los eventos de transportadora llegan **siempre con `id_status = 6`**; se
distinguen por `carrier_status_info.carrier_status`:

| `carrier_status`                         | Estado Miru   |
| ---------------------------------------- | ------------- |
| `Pedido en reparto`                      | `en_transito` |
| `Pedido en oficina de la transportadora` | `en_transito` |
| `Pedido con Novedad`                     | `novedad`     |

## Datos del pedido (documentados)

- `body.id_order` (número interno) y `body.external_order_id`.
- `body.date_update_order` → `external_updated_at`.
- `body.order_transaction.total` (número, **pesos**) → centavos.
- `body.order_Items` → ítems (precio, cantidad, sku/producto).
- `body.customer`, `body.shipping_address`.
- `body.order_logistics` (guía, transportadora) en el evento de alistar.
- `body.carrier_novelty` en «Pedido con Novedad».

> La forma completa del pedido **no está documentada**. Antes de mapear hay que
> ver un pedido real (GET /api/orders) y validar campo por campo.

## Plan de conexión

1. **API Key** del negocio (MasterShop → Configuraciones → API), se guarda solo
   en el servidor.
2. Con la key: `GET /api/orders?` para obtener un pedido real y confirmar campos.
3. Implementar el receptor `mastershop` (validación de token, idempotencia por
   `id_order + id_status + date_update_order`, mapeo y encolado).
4. Suscribir los eventos con `scripts/mastershop-subscribe.mjs`.
5. Prueba: crear un pedido de prueba en MasterShop y verlo en el panel.

## Seguridad

- URL con `connection_id` + `token` (HMAC truncado del id con el secreto del
  servidor): aunque no haya firma, un tercero no puede fabricar la URL.
- Guardar el crudo antes de procesar y descartar payloads que no cumplan el
  sobre mínimo (`eventName`, `body.id_status`, `body.id_order`).
- No publicar la URL del webhook.
