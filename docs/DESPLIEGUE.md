# Despliegue de producción

Objetivo: WebApp pública con HTTPS, dominio y datos reales, con los estándares que las
plataformas de origen exigen para aprobar la integración.

## 0. Antes de empezar: una decisión que hay que registrar

`AGENTS.md` (D-03) dice: **«Vercel está descartado»** para producción; la topología objetivo es
**VPS Contabo + Cloudflare**. El dueño pidió el 19-nov-2026 desplegar la WebApp en **Vercel**.
Mientras esa decisión no se refleje en `AGENTS.md` / `docs/CONTEXT.md` (documentos bloqueados,
los edita el dueño), este runbook queda como **propuesta autorizada verbalmente**.

Consecuencia técnica de Vercel: **solo puede vivir la WebApp**. La ingesta (`apps/ingest`) y el
worker (`apps/worker`) son procesos de larga vida y **no corren en Vercel**; necesitan un host con
procesos persistentes (VPS Contabo, Render, Fly.io, Railway) y un Redis (Upstash o el del VPS).

## 1. Lo que hace falta (lo aporta el dueño)

| Recurso                                | Para qué                                         | Quién                           |
| -------------------------------------- | ------------------------------------------------ | ------------------------------- |
| Proyecto **Supabase Cloud** (free)     | Base, Auth y Realtime de producción              | Dueño (crear cuenta y proyecto) |
| Cuenta **Vercel**                      | Hosting de la WebApp                             | Ya hay sesión (`joel658702`)    |
| **Dominio**                            | URL pública (o subdominio `*.vercel.app` gratis) | Dueño                           |
| Host para **ingesta + worker + Redis** | Recibir webhooks y procesar pedidos              | Dueño (fase posterior)          |
| **Secreto HMAC** por canal             | Firmar los webhooks                              | Dueño + plataforma              |

Sin el proyecto de Supabase no se puede publicar con datos reales: la app apunta hoy a
`http://127.0.0.1:54321`, que Vercel no puede alcanzar.

## 2. Supabase Cloud

1. Crear el proyecto y guardar: **Project URL**, **anon key**, **service_role key** y la
   contraseña de la base.
2. Aplicar el esquema (una sola vez):
   - Opción A (recomendada): `supabase link --project-ref <ref>` y `supabase db push`.
   - Opción B: pegar `supabase/migrations/0001_init.sql` en el SQL Editor.
3. **No** cargar `supabase/seed.sql` en producción (es demo, solo local).
4. Authentication → URL Configuration:
   - **Site URL**: `https://<tu-dominio>`.
   - **Redirect URLs**: `https://<tu-dominio>/**`.
   - Email confirmations: dejar activado.
5. Bootstrap del primer tenant + owner (SQL Editor, como `postgres`):

   ```sql
   insert into public.tenants (id, nombre)
   values (gen_random_uuid(), 'Mi tienda')
   returning id;  -- copiar el id

   -- Después de crear el usuario en Authentication → Users:
   insert into public.tenant_members (tenant_id, user_id, rol)
   values ('<tenant-id>', '<user-id>', 'owner');
   ```

   (El trigger `add_owner()` no corre en el SQL Editor porque no hay `auth.uid()`.)

6. Verificar RLS: en Table Editor, todas las tablas de `public` deben tener RLS activo.

## 3. Vercel (WebApp)

1. Importar el repositorio en Vercel.
2. **Root Directory**: `apps/web`.
3. Activar **«Include source files outside of the Root Directory in the Build Step»** (para que
   `packages/shared` exista en el build).
4. Variables de entorno (Production y Preview):

   | Variable                        | Valor                                                 |
   | ------------------------------- | ----------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://<ref>.supabase.co`                           |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key del proyecto                                 |
   | `SUPABASE_SERVICE_ROLE_KEY`     | service_role (solo servidor)                          |
   | `NEXT_PUBLIC_INGEST_URL`        | `https://api.<tu-dominio>` (cuando exista la ingesta) |

5. Build: `vercel.json` ya fija `framework: nextjs` y `buildCommand: pnpm run build`
   (construye `@miru/shared` antes de Next).
6. Dominio: agregar el dominio en Vercel y apuntar el DNS (A/CNAME según indique Vercel).
   Para salir rápido: usar el subdominio `*.vercel.app` y migrar el dominio después.

## 4. Ingesta + worker (fase aparte)

Vercel no ejecuta procesos persistentes. Opciones:

- **VPS Contabo + Cloudflare** (topología prevista en `docs/ARQUITECTURA.md`): Docker con
  `apps/ingest`, `apps/worker` y Redis.
- Alternativa provisional: Render/Fly para ambos procesos + Upstash Redis.

Variables de esos servicios: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`MIRU_WEBHOOK_HMAC_SECRET`, `REDIS_URL`, `MIRU_WEBHOOK_QUEUE`.

El endpoint público de webhooks (`https://api.<dominio>/webhooks/miru/v1/:connectionId`) se
entrega a las plataformas junto con el secreto HMAC ([`integraciones/MIRU_V1_TRANSPORTE.md`](integraciones/MIRU_V1_TRANSPORTE.md)).

## 5. Checklist de publicación

- [ ] `https://<dominio>/login` responde 200 y redirige a `/` con sesión.
- [ ] `/` sin sesión → 307 a `/login`; `/api/data/kpis` sin cookie → 401.
- [ ] El owner ve sus datos y puede crear un operador en `/operadores`.
- [ ] Exportar CSV de pedidos y finanzas descarga el archivo.
- [ ] `service_role` **no** aparece en el bundle del cliente (solo `NEXT_PUBLIC_*` llegan).
- [ ] `robots.txt` bloquea indexación (panel privado).
- [ ] Cabeceras de seguridad activas (`X-Content-Type-Options`, `Referrer-Policy`, etc.).
- [ ] Dominio con HTTPS válido y HSTS de Vercel.

## 6. Estándares y operación

- **Secretos:** solo en variables de entorno; rotar el HMAC por canal cada 90 días o ante
  cualquier sospecha. `service_role` nunca se comparte con la plataforma de origen.
- **Backups:** plan gratuito de Supabase no incluye backups; programar `pg_dump` cifrado (VPS o
  cron externo) antes de tener datos reales.
- **Purga de eventos:** `webhook_events` debe limpiarse a 14 días (plan gratuito) — pendiente de
  implementar como tarea del worker.
- **Rate limiting** en el endpoint de webhooks (pendiente; el ACK es rápido pero conviene limitar
  por IP/conexión).
- **Observabilidad:** logs de ingesta/worker y alertas de cola; sin esto no se detectan webhooks
  rechazados.
- **Correo:** Supabase Cloud usa su SMTP limitado; configurar SMTP propio antes de invitar
  operadores a producción.

## 7. Qué queda bloqueado y por qué

| Bloqueo                                           | Necesita                                                    |
| ------------------------------------------------- | ----------------------------------------------------------- |
| Publicar con datos reales                         | Proyecto Supabase Cloud (URL + keys)                        |
| Endpoint público de webhooks para las plataformas | Host de ingesta/worker + dominio `api.`                     |
| Aprobar la integración con Dropi/MasterShop/Effi  | Contrato y secreto por canal + su documentación de payloads |
| Dominio propio                                    | Acceso al DNS del dominio                                   |
