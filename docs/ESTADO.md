# Miru-Ecommerce — Estado del proyecto

Registro **vivo** del avance por fases. Las decisiones no se repiten aquí: viven en
[`../AGENTS.md`](../AGENTS.md) y [`CONTEXT.md`](CONTEXT.md) y son normativas.

Última verificación: **18 de noviembre de 2026**.

---

## 1. Verificación ejecutada en esta fecha

| Comprobación                       | Resultado                                                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`   | OK                                                                                                              |
| `pnpm typecheck`                   | OK (4 proyectos)                                                                                                |
| `pnpm lint`                        | OK                                                                                                              |
| `pnpm test`                        | 43 pruebas verdes (`packages/shared`)                                                                           |
| `pnpm build`                       | OK — 9 rutas estáticas + `ƒ Proxy`                                                                              |
| `pnpm dev`                         | web `:3000` (200), ingest `:3001/health` (`{"ok":true}`)                                                        |
| Supabase local                     | API `:54321` arriba, GoTrue `v2.192.0` healthy                                                                  |
| Login vía API de Auth              | `grant_type=password` → 200 con `access_token`; clave mala → 400                                                |
| Login en navegador (Edge headless) | Entra a `/`, escribe la cookie de sesión y «Salir» la elimina                                                   |
| `supabase db reset`                | Aplica `0001_init.sql`: 9 tablas, RLS en todas, Realtime publicado                                              |
| Fee Miru en BD                     | 2 × 8.400.000 + 999 → fee 840.050; al borrar uno → 840.000                                                      |
| Redondeo del fee                   | 9c→0, 10c→1, 99c→5, 999c→50 (mitad hacia arriba, entero)                                                        |
| Idempotencia de webhooks           | Duplicado `(connection_id, external_event_id)` → rechazado                                                      |
| RLS                                | `authenticated` sin membresía → 0 pedidos visibles                                                              |
| Ingesta: evento válido             | `200 accepted` en **38 ms** en caliente (630 ms en arranque frío)                                               |
| Ingesta: duplicado                 | `200 duplicate`                                                                                                 |
| Ingesta: rechazos                  | `401` firma / `401` timestamp / `422` payload / `404` conexión                                                  |
| Ingesta: persistencia y cola       | 4 filas en `webhook_events` (sin procesar) + 4 jobs en Redis                                                    |
| Worker: 4 eventos pendientes       | 4 pedidos creados; fee 840.000 y 3 × 64.995, cola vacía                                                         |
| Worker: orden D-07                 | evento viejo → `stale`; evento nuevo → aplicado (3.000.000/150.000)                                             |
| Worker: idempotencia               | evento ya procesado → `already-processed`, no reaplica                                                          |
| Datos reales en la UI              | `/pedidos` 6 órdenes, `/conexiones` Dropi (10 eventos hoy)                                                      |
| KPIs con regla del dueño           | ventas de todos los no cancelados; utilidad 85.005; fletes 0                                                    |
| API de datos                       | `/api/data/*` 200 con sesión; **401** sin cookie                                                                |
| Protección de rutas                | `/` sin sesión → **307** a `/login`; API sin cookie → 401                                                       |
| Métricas diarias                   | Fila del día actualizada por el worker tras cada evento                                                         |
| Realtime en el dashboard           | Sin recargar: ventas $78.997 → **$98.997** al entrar un pedido                                                  |
| Pruebas del proyecto               | **102** verdes (43 shared, 12 ingesta, 16 worker, 31 web)                                                       |
| Período en Finanzas                | Hoy $458.967 · 7 días $3.032.737 · 30 días $13.751.727                                                          |
| Garantías con cambio de estado     | PATCH 200 y persistido; transición inválida → **409**; rechazo sin nota → **422**                               |
| Rotación A/B/C                     | 10 productos → A: 6, B: 2, C: 2 (los inactivos sin ventas)                                                      |
| Alta de operadores                 | Owner crea (201); el operador ve los datos; crear sin ser owner → **403**; revocar → **204**                    |
| Exportar CSV                       | Pedidos 96 filas + cabecera; finanzas con fila TOTAL; sin sesión → **401**                                      |
| Paquete de integración             | Contrato + payload de ejemplo (567 B) + vector HMAC + `pnpm webhook:sign`                                       |
| Cabeceras y robots                 | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`; `robots.txt` bloquea todo |
| Producción verificada              | `https://miru-ecommerce-12.vercel.app`: sin sesión → `/login`; login con Supabase Cloud; **sin badge DEMO**     |
| VPS operativo                      | `miru-redis` healthy, `/health` OK, worker aplicó un webhook firmado (200) y se limpió el dato de prueba        |
| Datos demo en producción           | 90 pedidos sobre el tenant `Miru`; se borran con `delete from orders where external_id like 'MRU-%'`            |

## 2. Fases

Los identificadores `P3`, `P8a`, `P8b` y `P9` son los que ya usa el repositorio. El resto se
nombra por frente para no inventar una numeración que el dueño no ha fijado.

| Frente                                     | Alcance                                                                                              | Estado                           | Depende de |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------- | ---------- |
| Contrato canónico (`P3`)                   | Zod del evento `order.upserted`, dinero en centavos, HMAC-SHA256, ventana ±300 s                     | **Hecho**                        | —          |
| Shell demo (`P8a`)                         | 7 rutas, datos ficticios tras `DataSource`, sistema de diseño                                        | **Hecho**                        | —          |
| Toolchain y CI                             | TS 5.9.3, pnpm 11.28.5, ESLint 10.14.0, Next 16.4.6, GitHub Actions                                  | **Hecho**                        | —          |
| Supabase local + Auth real (`P8b`, 1/2)    | `supabase start`, `/login` contra Supabase Auth, sesión en cookies, `proxy.ts` que refresca el token | **Hecho** (18-nov-2026)          | —          |
| Esquema de base de datos (`0001_init.sql`) | Tablas, RLS, fee Miru generado por columna + trigger                                                 | **Hecho** (aprobado 18-nov-2026) | —          |
| Ingesta de webhooks (`apps/ingest`)        | HMAC del body crudo, ±5 min, idempotencia, evento crudo persistido antes de procesar, ACK < 500 ms   | **Hecho** (19-nov-2026)          | Esquema    |
| Worker de colas (`apps/worker`)            | BullMQ sobre Redis (`docker-compose.yml` ya lo define)                                               | **Hecho** (19-nov-2026)          | Ingesta    |
| DataSource real (`P8b`, 2/3)               | `/api/data/*` con sesión y RLS, seis pantallas con datos reales, badge DEMO solo en demo             | **Hecho** (19-nov-2026)          | Esquema    |
| Realtime + métricas (`P8b`, 3/3)           | Worker llena `dashboard_metrics_daily`; el dashboard se suscribe y pausa con la pestaña oculta       | **Hecho** (19-nov-2026)          | DataSource |
| Protección de rutas                        | `proxy.ts` redirige a `/login` sin sesión y saca de `/login` con sesión                              | **Hecho** (19-nov-2026)          | Auth       |
| Features (`P9`)                            | Período en Finanzas, cambio de estado de garantías y rotación A/B/C                                  | **Hecho** (19-nov-2026)          | DataSource |
| Alta de operadores                         | `/operadores`: owner crea cuentas (Auth + membresía) y revoca accesos; la lista la ve el tenant      | **Hecho** (19-nov-2026)          | Auth       |
| Exportar CSV                               | Pedidos y finanzas (según período) con sesión y RLS; UTF-8 con BOM y separador `;`                   | **Hecho** (19-nov-2026)          | DataSource |
| Paquete para plataformas                   | Contrato, payload de ejemplo, vector de firma y script `webhook:sign`                                | **Preparado** (19-nov-2026)      | —          |
| Producción (Vercel)                        | **https://miruecommerce.pro** con TLS; `www` redirige 308; login y datos verificados                 | **Hecho** (19-nov-2026)          | —          |
| Ingesta + worker en VPS                    | Contabo `86.48.30.152`: redis, ingest y worker corriendo; webhook firmado probado y limpiado         | **Hecho** (19-nov-2026)          | —          |
| Publicar endpoint de webhooks              | **https://api.miruecommerce.pro** con TLS; webhook firmado → 200 y `duplicate` al repetir            | **Hecho** (19-nov-2026)          | —          |
| Fee en devoluciones                        | Regla de cobro del 5 % en devoluciones/cancelaciones                                                 | **Diferido por el dueño**        | —          |

## 3. Esquema de base de datos

El dueño autorizó al agente a redactarlo y lo **aprobó el 18-nov-2026**. Vive en
[`../supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) y es el esquema
definitivo: `supabase db reset` lo aplica desde cero.

Contenido: `tenants` + `tenant_members` con `add_owner()` (enmienda E-01), `connections`,
`webhook_events` (idempotencia D-07), `orders` + `order_items` con el fee generado en BD (D-05),
`products`, `warranties` sin fee (devoluciones diferidas), `dashboard_metrics_daily` (D-08) y RLS
con políticas por tenant en las 9 tablas.

Decisiones del fee y de la utilidad:

- **Fee (resuelto):** 5 % por ítem, redondeado al centavo más cercano con mitad hacia arriba, en
  aritmética entera: `((precio × cantidad) × 5 + 50) / 100`. Casos: 999c → 50; 10c → 1; 9c → 0.
- **Ventas brutas y fee (regla del dueño, 19-nov-2026):** suman **todos los pedidos no
  cancelados**; los entregados son los que reflejan la ganancia.
- **Utilidad (regla del dueño, 19-nov-2026):** es el **5 % neto sobre la venta de los pedidos
  ENTREGADOS**; los **DEVUELTOS descuentan** su fee del saldo. Los **fletes no se cuentan**: los
  paga el dropshipper. Implementado en [`apps/web/src/server/aggregate.ts`](../apps/web/src/server/aggregate.ts)
  y replicado para las métricas diarias en [`apps/worker/src/metrics.ts`](../apps/worker/src/metrics.ts),
  ambos con pruebas.
- **Fuera de alcance:** el detalle de liquidación/cobro del fee a la plataforma (D-05) sigue
  diferido; aquí solo se calcula el saldo del panel.

Secuencia siguiente (una fase por sesión):

1. Features de `P9` (rotación A/B/C, períodos en Finanzas, cambios de estado de garantías).

## 4. Entorno local (notas reales de esta máquina)

- **WebApp**: Next solo lee `.env*` desde `apps/web`. Ahí van las dos públicas
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), la de servidor
  `SUPABASE_SERVICE_ROLE_KEY` (solo para contadores que la RLS no expone) y
  `NEXT_PUBLIC_INGEST_URL` (URL que muestra Conexiones). Sin las públicas, la app entra en
  **modo demo**.
- **Orígenes de desarrollo**: `next.config.ts` declara `allowedDevOrigins` con `localhost` y
  `127.0.0.1`; sin eso Next bloquea `/_next/hmr`, la página **no hidrata** y el login parece
  «muerto» en desarrollo.
- **Membresía del operador**: con RLS activo, un usuario sin fila en `tenant_members` no ve
  pedidos. El trigger `add_owner()` solo la crea si hay `auth.uid()`, así que los tenants
  sembrados por SQL necesitan la membresía a mano.
- **Ingesta**: lee `.env` de la raíz del repo (o de `apps/ingest`). Necesita Redis
  (`docker compose up -d redis`) y arranca con `pnpm --filter @miru/ingest dev`. El transporte
  está documentado en [`integraciones/MIRU_V1_TRANSPORTE.md`](integraciones/MIRU_V1_TRANSPORTE.md).
- **Worker**: usa el mismo `.env` y arranca con `pnpm --filter @miru/worker dev`. Consume la cola
  `miru-webhooks` con **concurrencia 1** para que la regla de orden (D-07) no dependa de carreras,
  y tras cada evento recalcula la fila del día en `dashboard_metrics_daily` (señal de Realtime).
  Al arrancar deja las métricas del día listas.
- **Datos de demostración** (`supabase/seed.sql`): 90 pedidos repartidos en 30 días (64 entregados,
  9 en tránsito, 7 devueltos, 5 pendientes, 3 novedad, 2 cancelados), 8 productos, 6 garantías y 30
  filas de métricas diarias. El fee no se escribe: lo generan las columnas/triggers de la BD. Es
  idempotente (borra y recrea los pedidos `MRU-%`) y `supabase db reset` lo aplica solo. Para
  quitarlo: `delete from public.orders where external_id like 'MRU-%';`.
- **Los datos reales no vienen de este seed**: entran por la ingesta (`apps/ingest`) desde la
  plataforma de origen, con el transporte documentado en
  [`integraciones/MIRU_V1_TRANSPORTE.md`](integraciones/MIRU_V1_TRANSPORTE.md).
- **CLI de Supabase**: el shim `C:\Users\joe\AppData\Roaming\npm\supabase.ps1` **se cuelga** al
  invocarlo (`supabase --version` no responde). Mientras se actualice el CLI (hay v3.x
  disponible), se usa el binario directo:

  ```powershell
  & "$env:APPDATA\npm\node_modules\@supabase\cli-windows-x64\bin\supabase.exe" status -o env
  ```

- **Servicios con healthcheck fallido**: `analytics`, `storage`, `postgres-meta`, `studio` y
  `vector` no pasan el health check en esta máquina, y `supabase start` aborta. El stack que sí
  levanta —suficiente para Auth, REST y Realtime— se arranca así:

  ```powershell
  supabase start -x logflare,storage-api,postgres-meta,studio,vector
  ```

  Esto es una **limitación de entorno**, no una decisión de arquitectura: cuando se necesiten
  Storage o Studio hay que resolver primero esos health checks.

- **Operador local de prueba**: se crea contra el Auth local (`POST /auth/v1/signup` con la anon
  key; confirmaciones de email desactivadas). Las credenciales no se commitean.
- **`supabase db reset`**: la primera ejecución puede fallar en «Initialising schema» por un
  tenant residual de Realtime (`tenants_external_id_index`). Reintentar el comando lo resuelve;
  si persiste, `supabase stop` y volver a arrancar. Después del reset hay que **volver a crear el
  operador** (el reset vacía `auth.users`).

## 5. Cómo verificar rápido

```powershell
pnpm typecheck; if ($LASTEXITCODE -ne 0) { throw "typecheck" }
pnpm lint;      if ($LASTEXITCODE -ne 0) { throw "lint" }
pnpm test;      if ($LASTEXITCODE -ne 0) { throw "test" }
pnpm build;     if ($LASTEXITCODE -ne 0) { throw "build" }
```

```powershell
Invoke-WebRequest http://127.0.0.1:54321/auth/v1/health   # GoTrue arriba
Invoke-WebRequest http://127.0.0.1:3001/health            # ingest arriba
```
