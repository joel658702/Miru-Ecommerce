# Integración con Effi · Ficha para su equipo técnico

Documento preparado por **Miru-Ecommerce** para la revisión técnica y la autorización
de la conexión. Fecha: 19-nov-2026.

> **Estado:** de Effi todavía no tenemos documentación técnica ni credenciales de
> sandbox. Esta ficha describe lo que Miru ofrece y lo que necesitamos de su lado;
> los endpoints concretos se completan cuando nos compartan su documentación.

## 1. Qué es Miru-Ecommerce

Plataforma centralizada de **pedidos, garantías, transportadoras y finanzas** para
dropshipping. Recibe pedidos de los canales, calcula el fee del 5 % y consolida la
operación en un panel.

- Panel: https://miruecommerce.pro
- API: https://api.miruecommerce.pro
- Titular: _(razón social y NIT — completar)_

## 2. Ficha técnica

| Componente    | Detalle                                                |
| ------------- | ------------------------------------------------------ |
| WebApp        | Next.js 16 + TypeScript + Tailwind, Vercel             |
| Ingesta       | Fastify 5 (Node 22) en VPS Contabo, Docker             |
| Cola          | BullMQ + Redis                                         |
| Base de datos | PostgreSQL 15 (Supabase Cloud) con RLS multi-tenant    |
| Dinero        | Enteros en centavos; fee Miru 5 % calculado en la base |
| Auth panel    | Supabase Auth, roles owner/operador                    |
| Transporte    | TLS en todos los endpoints                             |

## 3. Seguridad

| Control           | Implementación                                      |
| ----------------- | --------------------------------------------------- |
| Firma de webhooks | HMAC-SHA256 del body crudo + timestamp ±5 min       |
| Idempotencia      | `unique(connection_id, external_event_id)`          |
| Orden             | Solo si `external_updated_at` entrante > almacenado |
| Aislamiento       | RLS en todas las tablas por tenant                  |
| Secretos          | Solo en servidor; nunca en el navegador             |
| Límite            | 120 req/min por IP; payload máximo 1 MiB            |
| Auditoría         | Evento crudo guardado antes de procesar (14 días)   |
| Respaldos         | Exportación diaria de la base                       |

**No contamos con SOC 2 / ISO 27001.** Si su autorización las exige, indíquenlo.

## 4. Formas de conexión

### A — Webhooks Miru v1 (recomendada si Effi puede emitir)

Effi envía eventos de pedido a:

```
POST https://api.miruecommerce.pro/webhooks/miru/v1/<connection_id>
x-miru-signature: sha256=<HMAC-SHA256 del body crudo con el secreto del canal>
x-miru-timestamp: <segundos Unix>
Content-Type: application/json
```

- `200 accepted` en < 500 ms; `200 duplicate` si se repite el `event_id`.
- Contrato, ejemplo y vector de firma se entregan con esta ficha.
- Si Effi no emite webhooks, se usa la opción C.

### B — Servidor MCP (solo lectura, disponible)

Endpoint `https://api.miruecommerce.pro/mcp` (Streamable HTTP) con token Bearer:

| Herramienta       | Devuelve               |
| ----------------- | ---------------------- |
| `orders_list`     | Pedidos con filtros    |
| `orders_get`      | Detalle de un pedido   |
| `products_stock`  | Stock y precio por SKU |
| `warranties_list` | Garantías por estado   |
| `finance_summary` | Ventas, fee y utilidad |

- Token revocable por conexión + TLS.
- Disponible hoy; solo lectura y aislado por tenant.

### C — Pull por API (si Effi expone REST)

Miru consulta periódicamente los pedidos/estado con credenciales de solo lectura.
Necesitamos su documentación, límites y entorno de pruebas.

## 5. Qué necesitamos de Effi

| Dato                                                        | Para qué                       |
| ----------------------------------------------------------- | ------------------------------ |
| Documentación de API (endpoints, auth, paginación, límites) | Diseñar el mapeo real          |
| ¿Emiten webhooks? ¿Con firma/HMAC?                          | Elegir A o C                   |
| API key o credenciales de sandbox                           | Validar                        |
| Estructura del pedido (JSON real de ejemplo)                | Mapear estados, ítems y montos |
| Catálogo de estados y su significado                        | Traducir a los estados de Miru |
| Contacto técnico y horario                                  | Incidentes                     |
| Requisitos de su proceso de autorización                    | Completar formularios          |

## 6. Qué entregamos nosotros

- URL del webhook por canal y secreto HMAC (por medio privado).
- Contrato Miru v1, ejemplo de payload y vector de firma.
- Entorno de pruebas y acompañamiento en la primera integración.
- Logs de eventos aceptados/rechazados y contacto técnico.

## 7. Checklist de autorización

- [ ] Revisaron esta ficha.
- [ ] Nos compartieron su documentación técnica.
- [ ] Confirmaron el modo de conexión (A, B o C).
- [ ] Tienen un pedido de ejemplo y el catálogo de estados.
- [ ] Designaron contacto técnico de ambas partes.
