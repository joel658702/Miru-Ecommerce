# Miru-Ecommerce — Estado del proyecto

Registro **vivo** del avance por fases. Las decisiones no se repiten aquí: viven en
[`../AGENTS.md`](../AGENTS.md) y [`CONTEXT.md`](CONTEXT.md) y son normativas.

Última verificación: **18 de noviembre de 2026**.

---

## 1. Verificación ejecutada en esta fecha

| Comprobación                       | Resultado                                                          |
| ---------------------------------- | ------------------------------------------------------------------ |
| `pnpm install --frozen-lockfile`   | OK                                                                 |
| `pnpm typecheck`                   | OK (4 proyectos)                                                   |
| `pnpm lint`                        | OK                                                                 |
| `pnpm test`                        | 43 pruebas verdes (`packages/shared`)                              |
| `pnpm build`                       | OK — 9 rutas estáticas + `ƒ Proxy`                                 |
| `pnpm dev`                         | web `:3000` (200), ingest `:3001/health` (`{"ok":true}`)           |
| Supabase local                     | API `:54321` arriba, GoTrue `v2.192.0` healthy                     |
| Login vía API de Auth              | `grant_type=password` → 200 con `access_token`; clave mala → 400   |
| Login en navegador (Edge headless) | Entra a `/`, escribe la cookie de sesión y «Salir» la elimina      |
| `supabase db reset`                | Aplica `0001_init.sql`: 9 tablas, RLS en todas, Realtime publicado |
| Fee Miru en BD                     | 2 × 8.400.000 + 999 → fee 840.050; al borrar uno → 840.000         |
| Redondeo del fee                   | 9c→0, 10c→1, 99c→5, 999c→50 (mitad hacia arriba, entero)           |
| Idempotencia de webhooks           | Duplicado `(connection_id, external_event_id)` → rechazado         |
| RLS                                | `authenticated` sin membresía → 0 pedidos visibles                 |

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
| Ingesta de webhooks (`apps/ingest`)        | HMAC del body crudo, ±5 min, idempotencia, evento crudo persistido antes de procesar, ACK < 500 ms   | Listo para empezar               | Esquema    |
| Worker de colas (`apps/worker`)            | BullMQ sobre Redis (`docker-compose.yml` ya lo define)                                               | Listo para empezar               | Ingesta    |
| DataSource real + Realtime (`P8b`, 2/2)    | Consultas con RLS y suscripción a `dashboard_metrics_daily`                                          | Listo para empezar               | Esquema    |
| Features (`P9`)                            | Rotación A/B/C, períodos en Finanzas, cambios de estado de garantías                                 | Pendiente                        | DataSource |
| Fee en devoluciones                        | Regla de cobro del 5 % en devoluciones/cancelaciones                                                 | **Diferido por el dueño**        | —          |

## 3. Esquema de base de datos

El dueño autorizó al agente a redactarlo y lo **aprobó el 18-nov-2026**. Vive en
[`../supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) y es el esquema
definitivo: `supabase db reset` lo aplica desde cero.

Contenido: `tenants` + `tenant_members` con `add_owner()` (enmienda E-01), `connections`,
`webhook_events` (idempotencia D-07), `orders` + `order_items` con el fee generado en BD (D-05),
`products`, `warranties` sin fee (devoluciones diferidas), `dashboard_metrics_daily` (D-08) y RLS
con políticas por tenant en las 9 tablas.

Decisiones del fee:

- **Resuelto:** 5 % por ítem, redondeado al centavo más cercano con mitad hacia arriba, en
  aritmética entera: `((precio × cantidad) × 5 + 50) / 100`. Casos: 999c → 50; 10c → 1; 9c → 0.
- **Diferido:** la regla de cobro del fee en devoluciones sigue sin implementarse (D-05). Por eso
  `utilidad_neta_cents` se almacena en las métricas diarias y su fórmula queda POR CONFIRMAR.

Secuencia siguiente (una fase por sesión):

1. Ingesta Miru v1 en `apps/ingest` (persistir crudo → encolar → ACK < 500 ms).
2. Worker BullMQ en `apps/worker`.
3. `DataSource` real en `apps/web` + Realtime del dashboard.

## 4. Entorno local (notas reales de esta máquina)

- **WebApp**: Next solo lee `.env*` desde `apps/web`. Las dos variables públicas
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) se copian a
  `apps/web/.env.local`, que está en `.gitignore`. Sin ellas la app entra en **modo demo** y
  `/login` muestra «Conexión pendiente».
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
