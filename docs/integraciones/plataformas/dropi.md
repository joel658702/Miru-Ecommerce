# Integración con Dropi · Ficha para su equipo técnico

Documento preparado por **Miru-Ecommerce** para la revisión técnica y la autorización
de la conexión. Fecha: 19-nov-2026.

> **Perfil técnico completo para su área de seguridad:**
> [`dropi-perfil-tecnico.md`](dropi-perfil-tecnico.md) (arquitectura, stack,
> controles, límites declarados y cuestionario de seguridad respondido).

## 1. Qué es Miru-Ecommerce

Plataforma centralizada de **pedidos, garantías, transportadoras y finanzas** para
operaciones de dropshipping. Recibe los pedidos de los canales de venta, calcula el
fee del 5 % y entrega al dueño del negocio un panel con la operación consolidada.

- Panel: https://miruecommerce.pro
- API de integración: https://api.miruecommerce.pro
- Titular: _(razón social y NIT — completar antes de enviar)_

## 2. Ficha técnica de la plataforma

| Componente              | Detalle                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| WebApp                  | Next.js 16 (App Router) + TypeScript + Tailwind, en Vercel                    |
| Ingesta                 | Fastify 5 (Node 22), en VPS Contabo con Docker                                |
| Procesamiento           | Worker BullMQ + Redis (eventos asíncronos, ACK rápido)                        |
| Base de datos           | PostgreSQL 15 (Supabase Cloud), esquema con RLS multi-tenant                  |
| Dinero                  | Enteros en **centavos** (`BIGINT`); sin `float` en ninguna capa               |
| Fee Miru                | 5 % calculado en la base de datos (columna generada + trigger)                |
| Autenticación del panel | Supabase Auth (sesión en cookies httpOnly), roles owner/operador              |
| Multi-tenant            | Aislamiento por RLS con `tenant_members`; el servidor no confía en el cliente |
| Realtime                | Suscripción a `dashboard_metrics_daily` (1 fila/día/tenant)                   |
| Despliegue              | Vercel (panel) + VPS Contabo (ingesta/worker) + Supabase Cloud                |

## 3. Seguridad y control de datos

| Control             | Cómo está implementado                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| Transporte          | HTTPS/TLS obligatorio en panel y API (Let's Encrypt)                   |
| Firma de webhooks   | HMAC-SHA256 sobre el body crudo + ventana de timestamp ±5 min          |
| Idempotencia        | `unique(connection_id, external_event_id)`; un reenvío no duplica      |
| Orden de eventos    | Solo se aplica si `external_updated_at` entrante > almacenado          |
| Persistencia previa | El evento crudo se guarda **antes** de procesarse (auditoría 14 días)  |
| Aislamiento         | RLS en todas las tablas; cada negocio solo ve sus filas                |
| Secretos            | `service_role` y HMAC solo en servidor; nunca en el navegador          |
| Límite de abuso     | 120 peticiones/minuto por IP; `429` con `retry-after`                  |
| Tamaño de payload   | Máximo 1 MiB por evento                                                |
| Datos personales    | Nombre, teléfono, ciudad y dirección del comprador (solo lo necesario) |
| Retención           | Eventos crudos 14 días; pedidos y finanzas mientras exista la cuenta   |
| Respaldos           | Exportación diaria de la base (cifrado en reposo del proveedor)        |
| Registro            | Logs de ingesta, procesamiento y errores (`process_error`)             |

**No contamos con certificaciones SOC 2 / ISO 27001.** Si su proceso de autorización las
exige, indíquenlo y evaluamos el camino.

## 4. Formas de conexión

### Opción A — API + webhooks Miru v1 (disponible hoy)

Ustedes envían eventos de pedido a:

```
POST https://api.miruecommerce.pro/webhooks/miru/v1/<connection_id>
x-miru-signature: sha256=<HMAC-SHA256 del body crudo con el secreto del canal>
x-miru-timestamp: <segundos Unix>
Content-Type: application/json
```

- Respuesta `200 accepted` en **< 500 ms**; el trabajo pesado va a la cola.
- `200 duplicate` si se repite el `event_id` (reintentos seguros).
- Contrato completo y ejemplo: se entregan con esta ficha
  (`ESPECIFICACION_MIRU_V1.md` y `ejemplo-order.upserted.json`).
- Si Dropi **no puede emitir webhooks**, nosotros podemos consultar su API (opción C).

### Opción B — Servidor MCP (solo lectura, disponible)

Endpoint: `https://api.miruecommerce.pro/mcp` (Streamable HTTP, autenticación
`Authorization: Bearer <token>`). Expone **solo lectura** de la cuenta conectada:

| Herramienta MCP   | Qué devuelve                            |
| ----------------- | --------------------------------------- |
| `orders_list`     | Pedidos filtrados por estado/plataforma |
| `orders_get`      | Detalle de un pedido por `external_id`  |
| `products_stock`  | Stock y precio por SKU                  |
| `warranties_list` | Garantías por estado                    |
| `finance_summary` | Ventas, fee y utilidad por período      |

- Token revocable por conexión, entregado por canal privado.
- Alcance: **solo lectura**; no escribe pedidos ni expone datos de otros tenants.
- Disponible hoy; se entrega el token al autorizar la conexión.

### Opción C — Consulta a la API de Dropi (si aplica)

Si Dropi expone una API REST de pedidos/stock, Miru puede hacer _pull_ periódico con
credenciales de solo lectura. Necesitamos su documentación y un entorno de pruebas.

## 5. Qué necesitamos de Dropi

| Dato                                            | Para qué                            |
| ----------------------------------------------- | ----------------------------------- |
| Documentación de API (endpoints, auth, límites) | Diseñar el mapeo sin suponer campos |
| Credenciales de sandbox / API key de prueba     | Validar en su entorno               |
| ¿Emiten webhooks? ¿Con firma?                   | Elegir opción A o C                 |
| `connection_id` y secreto HMAC si son emisores  | Configurar el canal                 |
| Contacto técnico y horario                      | Incidentes                          |
| Requisitos de su proceso de autorización        | Completar formularios               |

## 6. Qué entregamos nosotros

- URL del webhook por canal + secreto HMAC (por medio privado).
- Contrato Miru v1, ejemplo de payload y vector de firma para su validación.
- Entorno de pruebas y acompañamiento en la primera integración.
- Logs de eventos aceptados/rechazados y contacto técnico.

## 7. Checklist de autorización

- [ ] Revisaron esta ficha y la especificación del contrato.
- [ ] Confirmaron el modo de conexión (A, B o C).
- [ ] Tienen un contacto técnico de ambas partes.
- [ ] Entienden la regla de idempotencia y el manejo de reintentos.
- [ ] Verificaron que no compartimos su API key con terceros.
