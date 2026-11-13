# Miru-Ecommerce — Contexto del proyecto

Documento de contexto y registro de decisiones **bloqueadas**. Es la fuente de verdad para
cualquier persona o agente que trabaje en el repositorio. Las decisiones aquí registradas
**no se modifican, no se reinterpretan y no admiten alternativas** sin aprobación explícita
del dueño del proyecto.

Reglas operativas para agentes: [`../AGENTS.md`](../AGENTS.md).

---

## 0. Resumen

| Aspecto           | Decisión                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Producto          | Plataforma centralizada de pedidos, garantías, transportadoras y finanzas para dropshipping (Dropi, MasterShop, Effi) |
| Cliente           | WebApp responsiva PC/móvil, UI en español                                                                             |
| Arquitectura      | Monorepo pnpm                                                                                                         |
| Entorno           | Local-first (Supabase CLI + Redis en Docker); sin nube todavía                                                        |
| Producción futura | VPS Contabo + Cloudflare (Vercel descartado)                                                                          |
| Dinero            | Enteros en centavos (`BIGINT`); prohibido `float`                                                                     |
| Fee Miru          | 5%, calculado en BD; prohibido recalcular en la app                                                                   |
| Devoluciones      | Regla de cobro DIFERIDA; no implementar nada                                                                          |
| Base de datos     | `supabase/migrations/0001_init.sql` lo pega el humano; esquema intocable por agentes; RLS en todas las tablas         |
| Webhooks          | Contrato Miru v1, HMAC-SHA256 del body crudo, ventana ±5 min, ACK <500 ms                                             |
| Realtime          | Suscripción a `dashboard_metrics_daily`, canales privados + RLS                                                       |
| Secretos          | `service_role` y HMAC solo en servidor; `.env` en `.gitignore`                                                        |
| IA                | Sin PII hacia servicios gratuitos; solo agregados anonimizados                                                        |
| Proceso           | Una tarea por sesión, un commit por tarea, criterios de aceptación obligatorios                                       |
| Toolchain         | TS 5.9.3, pnpm 11.28.5, ESLint 10.14.0, Next 16.4.6, Node 22.22.2; reproducibilidad > novedad                         |
| Entorno           | Windows + PowerShell; verificaciones secuenciales con `$LASTEXITCODE`; prohibido bash                                 |

---

## 1. D-01 · Producto

Plataforma **centralizada de pedidos, garantías, transportadoras y finanzas** para
dropshipping, integrando **Dropi, MasterShop y Effi**. WebApp **responsiva** para PC y
móvil. La **UI está en español**.

## 2. D-02 · Monorepo

Monorepo gestionado con **pnpm**:

```
apps/web         Next.js (App Router) + TypeScript + Tailwind
apps/ingest      Fastify + TypeScript
apps/worker      BullMQ + TypeScript
packages/shared  Zod + utilidades
supabase/        migraciones y configuración local
scripts/         automatizaciones
docs/            documentación
```

## 3. D-03 · Entornos

- **Local-first**: desarrollo con **Supabase CLI (Docker) + Redis (Docker)**.
- **Sin despliegues a nube todavía.**
- Producción futura: **VPS Contabo + Cloudflare**.
- **Vercel descartado.**

## 4. D-04 · Dinero

- Montos **siempre enteros en centavos**, almacenados como `BIGINT`.
- **Prohibido `float`** para montos en cualquier capa.

## 5. D-05 · Fee Miru 5%

- El fee **ya está calculado en la BD**: columna generada por ítem, totalizada por trigger.
- **Prohibido recalcularlo en la aplicación.**
- La **regla de cobro en devoluciones está DIFERIDA** por el dueño; **no implementar nada
  sobre eso**.

## 6. D-06 · Esquema de base de datos

- El esquema vive en `supabase/migrations/0001_init.sql`; **el humano lo pega** con el SQL
  aprobado.
- **Ningún agente puede reescribir ese esquema.**
- **RLS activo en todas las tablas.**

## 7. D-07 · Webhooks

- Contrato canónico **Miru v1**.
- **HMAC-SHA256 del body crudo** + **ventana de timestamp ±5 min**.
- **Idempotencia** por `unique(connection_id, external_event_id)`.
- **Orden**: solo aplicar si `external_updated_at` entrante > almacenado.
- **Persistir el evento crudo antes de procesar.**
- **ACK 200 en <500 ms**; el trabajo pesado ocurre **async en el worker**.

## 8. D-08 · Realtime

- El dashboard se suscribe a **`dashboard_metrics_daily`** (1 fila/día/tenant), **no** a
  miles de pedidos.
- **Canales privados + RLS.**
- **Pausar la suscripción cuando la pestaña está oculta.**

## 9. D-09 · Secretos

- `service_role` key y secretos HMAC **solo en servidor**.
- En el cliente, únicamente `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **`.env` en `.gitignore`.**

## 10. D-10 · Datos e IA

- **Sin PII hacia servicios de IA gratuitos**; solo **agregados anonimizados**.

## 11. D-11 · Cero alucinaciones

- Si no se conoce una API o librería: **detenerse y preguntar**.
- **No inventar endpoints ni payloads nativos** de Dropi, MasterShop ni Effi.

## 12. D-12 · Flujo de trabajo

- **Una tarea por sesión.**
- **Un commit por tarea.**
- **No avanzar sin criterios de aceptación.**

## 13. D-13 · Toolchain fijado

- **TypeScript 5.9.3** (typescript-eslint 8.72.2 exige `<6.1.0`).
- **pnpm 11.28.5**.
- **ESLint 10.14.0**.
- **Next 16.4.6**.
- **Node 22.22.2**.
- **Reproducibilidad > novedad.** Prohibido subir versiones sin aprobación.

## 14. D-14 · Entorno

- **Windows + PowerShell.**
- **Verificaciones secuenciales con `$LASTEXITCODE`.**
- **Prohibido bash (`&&`, `$?`) en los prompts del proyecto.**

---

## 15. Diferidos explícitos

| Tema                                        | Estado                                                            |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Regla de cobro del fee Miru en devoluciones | **DIFERIDA** por el dueño — no diseñar, no implementar, no asumir |

---

## 16. Límites de alcance

Este documento **no** define funcionalidades adicionales, integraciones nuevas ni
arquitecturas alternativas. Cualquier propuesta fuera de las decisiones anteriores requiere
aprobación explícita del dueño antes de escribirse en código.
