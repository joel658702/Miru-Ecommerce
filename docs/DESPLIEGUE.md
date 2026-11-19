# Despliegue de producción

Objetivo: WebApp pública con HTTPS, dominio y datos reales, con los estándares que las
plataformas de origen exigen para aprobar la integración.

## Estado actual (19-nov-2026)

| Pieza                | Valor                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| WebApp en producción | **https://miruecommerce.pro** (Vercel, team `miru19`) + `miru-ecommerce-12.vercel.app`      |
| Proyecto Vercel      | `miru-ecommerce-12` · root `apps/web` · repo `joel658702/Miru-Ecommerce`                    |
| Base de datos / Auth | Supabase Cloud, ref `zgvfaqhahutkarbbwagi` (us-east-2)                                      |
| Esquema aplicado     | 9 tablas con RLS activo (migración `0001_init.sql`)                                         |
| Auth                 | Site URL `https://miruecommerce.pro` + redirects (www, vercel.app, localhost)               |
| Tenant inicial       | `Miru` con el owner `joe.miranda02z@gmail.com`                                              |
| Variables en Vercel  | Supabase (URL, anon, service_role) + `NEXT_PUBLIC_INGEST_URL=https://api.miruecommerce.pro` |
| Datos                | 90 pedidos demo cargados sobre `Miru` (se borran antes de la integración)                   |
| VPS Contabo          | `86.48.30.152` — `miru-redis`, `miru-ingest` y `miru-worker` corriendo (Docker)             |
| Endpoint de webhooks | **https://api.miruecommerce.pro** (Traefik de Coolify, TLS Let's Encrypt)                   |

### DNS en Hostinger (activo)

| Tipo  | Nombre | Valor                                 |
| ----- | ------ | ------------------------------------- |
| A     | `@`    | `216.198.79.1` + `64.29.17.1`         |
| CNAME | `www`  | `e0d9e1dabdf38a7c.vercel-dns-017.com` |
| A     | `api`  | `86.48.30.152`                        |

`www` redirige con **308** al dominio raíz. Verificado el 19-nov-2026: el panel responde 200 en
`https://miruecommerce.pro/login`, `api.miruecommerce.pro/health` responde `{"ok":true}` y el
certificado de `api.` lo emitió Traefik.

**Ojo con Redis en este VPS:** la ingesta se une a la red `coolify` para que Traefik la publique, y
en esa red existe otro `redis` (el de Coolify, con contraseña). Por eso `REDIS_URL` usa el nombre
explícito `redis://miru-redis:6379`; con `redis://redis:6379` el cliente recibe `NOAUTH`.

Verificado en producción: `/` sin sesión → `/login` (307), login con Supabase Cloud, correo en el
header, **sin badge DEMO**, `/operadores` operativo.

Verificado en el VPS: `/health` responde `{"ok":true}`, el worker escucha la cola y un webhook
firmado de prueba respondió `200 accepted` y se aplicó como pedido (datos de prueba eliminados).

Pendiente para la integración: **publicar el endpoint** (dominio `api.<dominio>` + proxy),
**secreto HMAC por canal** y limpiar los datos demo.

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

## 6. Servicios de integración en el VPS (Contabo)

Vercel solo aloja la WebApp. La ingesta, el worker y Redis van en el VPS con Docker
(`deploy/docker-compose.prod.yml`).

### Estado actual (19-nov-2026)

| Pieza           | Valor                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| Servidor        | Contabo `86.48.30.152` (Ubuntu 24.04, 4 vCPU, 8 GB, Docker 29)              |
| Repo desplegado | `/opt/miru` (clon de GitHub + `deploy/` copiado por `scp`)                  |
| Contenedores    | `miru-redis` (healthy), `miru-ingest`, `miru-worker`                        |
| Variables       | `/opt/miru/deploy/.env.prod` (600) con service_role y HMAC propio           |
| Proxy           | **No se usó Caddy**: el servidor ya corre **Coolify + Traefik** en 80/443   |
| Endpoint        | interno `http://127.0.0.1:3001`; falta publicarlo con el dominio            |
| Smoke test      | webhook firmado → `200 accepted` → worker aplicó el pedido → datos borrados |

> **Importante:** en este VPS el perfil `caddy` del compose está desactivado
> (`profiles: ["caddy"]`). Cuando exista el dominio, se publica con el proxy de Coolify/Traefik
> (o un Caddy en puertos alternos detrás de Traefik). El puerto 3001 **nunca** se abre al público.

### 6.1 Requisitos

- IP pública del VPS y acceso SSH (`root` o usuario con sudo).
- Docker Engine + plugin `docker compose` (v2).
- Un subdominio para la ingesta, p. ej. `api.<dominio>`, con registro **A** apuntando a la IP del
  VPS (se crea en Hostinger). Caddy emite el certificado TLS automáticamente.

### 6.2 Preparar el servidor

```bash
# En el VPS
apt update && apt install -y git curl
curl -fsSL https://get.docker.com | sh
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

git clone https://github.com/joel658702/Miru-Ecommerce.git /opt/miru
cd /opt/miru
cp deploy/env.prod.example deploy/.env.prod
chmod 600 deploy/.env.prod
# Editar deploy/.env.prod: SUPABASE_SERVICE_ROLE_KEY y MIRU_WEBHOOK_HMAC_SECRET
# Editar deploy/Caddyfile: reemplazar api.miru.example por el subdominio real
```

### 6.3 Levantar el stack

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build
docker compose -f deploy/docker-compose.prod.yml ps
docker compose -f deploy/docker-compose.prod.yml logs -f ingest
```

Comprobaciones:

- `curl http://127.0.0.1:3001/health` → `{"ok":true}` (solo desde el propio servidor).
- `curl https://api.<dominio>/health` → `{"ok":true}` (por Caddy y con TLS).
- El puerto 3001 **no** debe estar abierto al público.

### 6.4 Conectar la WebApp

1. En Vercel, agregar `NEXT_PUBLIC_INGEST_URL=https://api.<dominio>` (Production y Preview).
2. Redeploy para que el build la tome (`vercel --prod` o push a `main`).
3. `/conexiones` debe mostrar la URL completa del webhook por canal.

### 6.5 Prueba de humo de la integración

```bash
# Desde tu máquina, con un connection_id real de la tabla connections
pnpm webhook:sign docs/integraciones/ejemplo-order.upserted.json "$MIRU_WEBHOOK_HMAC_SECRET"
# Copiar el curl que imprime el script y apuntarlo a https://api.<dominio>/webhooks/miru/v1/<id>
```

Debe responder `200 accepted`, aparecer la fila en `webhook_events` y el pedido en el panel.

### 6.6 Operación

- **Actualizar:** `cd /opt/miru && git pull && docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build`.
- **Logs:** `docker compose ... logs -f worker` (los rechazos de webhooks se ven en `process_error`).
- **Persistencia:** Redis usa el volumen `redis-data` con AOF; los eventos críticos ya están en
  Supabase, Redis es solo la cola.
- **Reinicio automático:** `restart: unless-stopped` en todos los servicios.
- **Firewall:** solo 22/80/443 públicos; 3001 en `127.0.0.1`.

## 7. Estándares y operación

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
