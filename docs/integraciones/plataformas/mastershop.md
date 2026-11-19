# Integración con MasterShop · Ficha para su equipo técnico

Documento preparado por **Miru-Ecommerce** para la revisión técnica y la autorización
de la conexión. Fecha: 19-nov-2026. Basado en **Mastershop Public API** (Postman).

## 1. Qué es Miru-Ecommerce

Plataforma centralizada de **pedidos, garantías, transportadoras y finanzas** para
operaciones de dropshipping. Recibe pedidos de los canales, calcula el fee del 5 % y
consolida la operación en un panel.

- Panel: https://miruecommerce.pro
- API: https://api.miruecommerce.pro
- Titular: _(razón social y NIT — completar)_

## 2. Ficha técnica

| Componente    | Detalle                                                |
| ------------- | ------------------------------------------------------ |
| WebApp        | Next.js 16 + TypeScript + Tailwind, Vercel             |
| Ingesta       | Fastify 5 (Node 22) en VPS Contabo, Docker             |
| Cola          | BullMQ + Redis (procesamiento asíncrono)               |
| Base de datos | PostgreSQL 15 (Supabase Cloud) con RLS multi-tenant    |
| Dinero        | Enteros en centavos; fee Miru 5 % calculado en la base |
| Auth panel    | Supabase Auth, roles owner/operador                    |
| Transporte    | TLS en todos los endpoints                             |

## 3. Seguridad

| Control                     | Implementación                                                 |
| --------------------------- | -------------------------------------------------------------- |
| Firma de webhooks (Miru v1) | HMAC-SHA256 del body crudo + timestamp ±5 min                  |
| Idempotencia                | `unique(connection_id, external_event_id)`                     |
| Orden                       | Se aplica solo si `external_updated_at` es mayor al almacenado |
| Aislamiento                 | RLS en todas las tablas por tenant                             |
| Secretos                    | Solo en servidor (`service_role`, HMAC)                        |
| Límite                      | 120 req/min por IP; payload máximo 1 MiB                       |
| Auditoría                   | Evento crudo persistido antes de procesar (14 días)            |
| Respaldos                   | Exportación diaria de la base                                  |

**Nota:** no contamos con SOC 2 / ISO 27001.

## 4. Cómo se conecta MasterShop

Su plataforma **empuja** notificaciones a una URL nuestra y expone una API REST para
consultar pedidos. Según su catálogo:

- Base: `https://prod.api.mastershop.com`
- Auth: cabecera **`ms-api-key`**
- Webhooks: `POST /api/webhooks` con `{ idProduct: null, idWebhook, name, url, webhookName }`
- Consulta de pedidos: `GET /api/orders`, `POST /api/orders/list`
- Creación de pedidos: `POST /api/orders` (si Miru los originara)

### Eventos que proponemos suscribir

| idWebhook | Evento                                |
| --------- | ------------------------------------- |
| 15        | Pedido creado                         |
| 16        | Cambio de estado del pedido           |
| 17        | Cambio de estado de la transportadora |
| 18        | Pedido entregado                      |
| 27        | Pedido con novedad                    |

Se crea una suscripción por evento; guardamos el `idProductWebhook` que devuelve su API
(no hay endpoint para listarlas).

### Estados de MasterShop → Miru

| `id_status` | MasterShop     | Miru          |
| ----------- | -------------- | ------------- |
| 1           | Por Confirmar  | `pendiente`   |
| 2           | Pendiente      | `confirmado`  |
| 3           | Por Alistar    | `confirmado`  |
| 4           | Por Recolectar | `confirmado`  |
| 5           | Recolectada    | `en_transito` |
| 6           | En tránsito    | `en_transito` |
| 8           | Entregada      | `entregado`   |
| 9           | Cancelada      | `cancelado`   |
| 10          | Devuelta       | `devuelto`    |
| 11          | Reclamaciones  | `novedad`     |

Los eventos de transportadora llegan con `id_status = 6` y se distinguen por
`carrier_status_info.carrier_status`.

### Receptor del lado de Miru

```
https://api.miruecommerce.pro/webhooks/mastershop/<connection_id>?token=<token>
```

- La URL lleva un token derivado del secreto del servidor (no adivinable).
- Idempotencia por `id_order + id_status + date_update_order`.
- Se guarda el crudo y se contrasta contra `GET /api/orders` lo que sea crítico.
- Como su notificación **no trae firma**, la URL es el único secreto: no la publicamos.

## 5. Qué necesitamos de MasterShop

| Dato                                   | Para qué                                         |
| -------------------------------------- | ------------------------------------------------ |
| **API Key** del negocio (`ms-api-key`) | Consultar pedidos y crear suscripciones          |
| Un pedido de ejemplo (JSON real)       | La forma completa del pedido no está documentada |
| Confirmación de límites de la API      | Dimensionar el _pull_ de respaldo                |
| Contacto técnico                       | Incidentes                                       |
| ¿Reintentos y timeout de sus webhooks? | Definir tolerancia a fallos                      |

## 6. Formas de conexión disponibles

### A — Webhooks (recomendada)

MasterShop envía, Miru recibe y procesa. Es el flujo natural de su plataforma y no
requiere que ustedes expongan nada más.

### B — Servidor MCP (opcional, a implementar)

Podemos exponer un servidor **MCP (Model Context Protocol)** de **solo lectura** para
que sus herramientas/agentes consulten pedidos, stock y garantías de la cuenta
conectada, con token revocable y TLS. Hoy no está implementado; se acuerda alcance.

### C — Pull por API

Si prefieren no emitir webhooks, Miru consulta `POST /api/orders/list` con su API Key
(límite: sin filtros devuelve solo los últimos 7 días).

## 7. Qué entregamos

- Token de conexión y URL del receptor.
- Contrato y ejemplo para validación.
- Soporte durante la primera prueba y logs de eventos.

## 8. Checklist de autorización

- [ ] Revisaron esta ficha.
- [ ] Confirmaron el modo (A, B o C).
- [ ] Tienen un pedido de ejemplo para validar el mapeo.
- [ ] Entienden que su webhook no trae firma y que usamos URL + token.
- [ ] Designaron contacto técnico.
