# Despliegue de producción

Objetivo: WebApp pública con HTTPS, dominio y datos reales, con los estándares que las
plataformas de origen exigen para aprobar la integración.

## Estado actual (19-nov-2026)

| Pieza                | Valor                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------- |
| WebApp en producción | **https://miru-ecommerce-12.vercel.app** (Vercel, team `miru19`)                         |
| Proyecto Vercel      | `miru-ecommerce-12` · root `apps/web` · repo `joel658702/Miru-Ecommerce`                 |
| Base de datos / Auth | Supabase Cloud, ref `zgvfaqhahutkarbbwagi` (us-east-2)                                   |
| Esquema aplicado     | 9 tablas con RLS activo (migración `0001_init.sql`)                                      |
| Auth                 | Site URL y redirects apuntando al dominio de Vercel                                      |
| Tenant inicial       | `Miru` con el owner `joe.miranda02z@gmail.com`                                           |
| Variables en Vercel  | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Datos                | **Vacíos** (producción limpia; el seed demo no se cargó)                                 |

Verificado en producción: `/` sin sesión → `/login` (307), login con Supabase Cloud, correo en el
header, **sin badge DEMO**, `/operadores` operativo.

Pendiente para la integración: **host público de ingesta + worker + Redis** (Vercel no ejecuta
procesos de larga vida) y **dominio propio** si se quiere dejar de usar `*.vercel.app`.

## 0. Antes de empezar: una decisión que hay que registrar

`AGENTS.md` (D-03) dice: **«Vercel está descartado»** para producción; la topología objetivo es
**VPS Contabo + Cloudflare**. El dueño pidió el 19-nov-2026 desplegar la WebApp en **Vercel** y el
despliegue se hizo con su autorización. Falta que esa decisión se refleje en `AGENTS.md` /
`docs/CONTEXT.md` (documentos bloqueados, los edita el dueño); mientras tanto, este runbook es la
referencia operativa de lo desplegado.

Consecuencia técnica de Vercel: **solo puede vivir la WebApp**. La ingesta (`apps/ingest`) y el
worker (`apps/worker`) son procesos de larga vida y **no corren en Vercel**; necesitan un host con
procesos persistentes (VPS Contabo, Render, Fly.io, Railway) y un Redis (Upstash o el del VPS).

## 1. Lo que hace falta

| Recurso                                | Estado    | Nota                                                 |
| -------------------------------------- | --------- | ---------------------------------------------------- |
| Proyecto **Supabase Cloud** (free)     | ✅ Hecho  | ref `zgvfaqhahutkarbbwagi`, esquema y RLS aplicados  |
| Cuenta **Vercel**                      | ✅ Hecho  | proyecto `miru-ecommerce-12`, dominio `*.vercel.app` |
| Variables de entorno en Vercel         | ✅ Hecho  | URL + anon + service_role                            |
| **Dominio propio**                     | Pendiente | Opcional: hoy se usa `miru-ecommerce-12.vercel.app`  |
| Host para **ingesta + worker + Redis** | Pendiente | Necesario para recibir webhooks en producción        |
| **Secreto HMAC** por canal             | Pendiente | Lo define el dueño con cada plataforma               |

Con Supabase Cloud el panel ya funciona con datos reales; lo que falta para la **integración** es
el endpoint público de webhooks (host de ingesta) y los secretos por canal.

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
