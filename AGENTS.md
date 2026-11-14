# Miru-Ecommerce — Instrucciones para agentes

Este archivo contiene las **decisiones bloqueadas** del proyecto. Todo agente (humano o IA)
debe leerlo antes de tocar código. Su contenido es normativo: **no se modifica, no se
reinterpreta y no admite alternativas**. Cualquier cambio requiere aprobación explícita del
dueño del proyecto.

Contexto ampliado: [`docs/CONTEXT.md`](docs/CONTEXT.md).

---

## 1. Producto

Plataforma **centralizada de pedidos, garantías, transportadoras y finanzas** para
dropshipping (Dropi, MasterShop, Effi). WebApp **responsiva** para PC y móvil.
**UI en español.**

## 2. Monorepo (pnpm)

```
apps/web      Next.js (App Router) + TypeScript + Tailwind
apps/ingest   Fastify + TypeScript
apps/worker   BullMQ + TypeScript
packages/shared  Zod + utilidades
supabase/     migraciones y configuración local
scripts/      automatizaciones
docs/         documentación del proyecto
```

Gestor de paquetes: **pnpm**. No introducir otros gestores ni workspaces paralelos.

## 3. Entornos

- **Local-first**: desarrollo con **Supabase CLI (Docker) + Redis (Docker)**.
- **Sin despliegues a nube todavía.**
- **Excepción de demo**: hay un despliegue **DEMO** en Vercel para revisar la UI; no es
  producción y no se conecta a Supabase.
- Producción futura: **VPS Contabo + Cloudflare**.
- **Vercel está descartado.**

## 4. Dinero — regla absoluta

- Los montos son **SIEMPRE enteros en centavos** (`BIGINT`).
- **Prohibido `float`** para montos, en cualquier capa (BD, API, cálculo, UI, logs).

## 5. Fee Miru 5%

- El fee **ya está calculado en la BD**: columna generada por ítem y totalizado por trigger.
- **PROHIBIDO recalcularlo en la aplicación.** No duplicar la fórmula en TS, SQL de cliente
  ni en el worker.
- La regla de cobro en **devoluciones está DIFERIDA** por el dueño del proyecto.
  **No implementar nada sobre eso.**

## 6. Base de datos

- Esquema definido en `supabase/migrations/0001_init.sql`. **El humano lo pega** con el SQL
  aprobado.
- **Ningún agente puede reescribir ese esquema.** Ni crear, ni alterar, ni "corregir"
  migraciones por iniciativa propia.
- **RLS activo en todas las tablas.**

## 7. Webhooks

- Contrato canónico: **Miru v1**.
- Validación **HMAC-SHA256 del body crudo** + **ventana de timestamp ±5 min**.
- Idempotencia por `unique(connection_id, external_event_id)`.
- Orden: **solo aplicar si `external_updated_at` entrante > almacenado**.
- **Persistir el evento crudo antes de procesar.**
- **ACK 200 en <500 ms**; el trabajo pesado va **async en el worker**.

## 8. Realtime

- El dashboard se suscribe a **`dashboard_metrics_daily`** (1 fila/día/tenant),
  **no a miles de pedidos**.
- **Canales privados + RLS.**
- **Pausar la suscripción con la pestaña oculta.**

## 9. Secretos

- `service_role` key y secretos HMAC **solo en servidor**.
- En el cliente únicamente `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `.env` en `.gitignore`.

## 10. Datos y IA

- **Sin PII hacia servicios de IA gratuitos**; solo agregados anonimizados.

## 11. Cero alucinaciones

- Si no se conoce una API o librería: **detenerse y preguntar**.
- **No inventar endpoints ni payloads nativos** de Dropi, MasterShop o Effi.

## 12. Flujo de trabajo

- **Una tarea por sesión.**
- **Un commit por tarea.**
- **No avanzar sin criterios de aceptación** definidos y explícitos para esa tarea.

---

## Protocolo para agentes

1. Leer `AGENTS.md` y `docs/CONTEXT.md` antes de cualquier cambio.
2. Verificar que la tarea tenga criterios de aceptación; si no los tiene, pedirlos y detenerse.
3. Trabajar una sola tarea; no refactorizar ni agregar features fuera de alcance.
4. No tocar `supabase/migrations/0001_init.sql` ni el esquema.
5. No recalcular el fee Miru; consumir los valores de la BD.
6. No exponer secretos al cliente ni enviar PII a servicios de IA.
7. Detenerse y preguntar ante cualquier API, endpoint o payload desconocido.
8. Un commit al cerrar la tarea.
