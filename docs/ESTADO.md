# Miru-Ecommerce — Estado del proyecto

Registro **vivo** del avance por fases. Las decisiones no se repiten aquí: viven en
[`../AGENTS.md`](../AGENTS.md) y [`CONTEXT.md`](CONTEXT.md) y son normativas.

Última verificación: **18 de noviembre de 2026**.

---

## 1. Verificación ejecutada en esta fecha

| Comprobación                       | Resultado                                                        |
| ---------------------------------- | ---------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`   | OK                                                               |
| `pnpm typecheck`                   | OK (4 proyectos)                                                 |
| `pnpm lint`                        | OK                                                               |
| `pnpm test`                        | 43 pruebas verdes (`packages/shared`)                            |
| `pnpm build`                       | OK — 9 rutas estáticas + `ƒ Proxy`                               |
| `pnpm dev`                         | web `:3000` (200), ingest `:3001/health` (`{"ok":true}`)         |
| Supabase local                     | API `:54321` arriba, GoTrue `v2.192.0` healthy                   |
| Login vía API de Auth              | `grant_type=password` → 200 con `access_token`; clave mala → 400 |
| Login en navegador (Edge headless) | Entra a `/`, escribe la cookie de sesión y «Salir» la elimina    |

## 2. Fases

Los identificadores `P3`, `P8a`, `P8b` y `P9` son los que ya usa el repositorio. El resto se
nombra por frente para no inventar una numeración que el dueño no ha fijado.

| Frente                                     | Alcance                                                                                              | Estado                     | Depende de |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------- | ---------- |
| Contrato canónico (`P3`)                   | Zod del evento `order.upserted`, dinero en centavos, HMAC-SHA256, ventana ±300 s                     | **Hecho**                  | —          |
| Shell demo (`P8a`)                         | 7 rutas, datos ficticios tras `DataSource`, sistema de diseño                                        | **Hecho**                  | —          |
| Toolchain y CI                             | TS 5.9.3, pnpm 11.28.5, ESLint 10.14.0, Next 16.4.6, GitHub Actions                                  | **Hecho**                  | —          |
| Supabase local + Auth real (`P8b`, 1/2)    | `supabase start`, `/login` contra Supabase Auth, sesión en cookies, `proxy.ts` que refresca el token | **Hecho** (18-nov-2026)    | —          |
| Esquema de base de datos (`0001_init.sql`) | Tablas, RLS, fee Miru generado por columna + trigger                                                 | **Bloqueado por el dueño** | —          |
| Ingesta de webhooks (`apps/ingest`)        | HMAC del body crudo, ±5 min, idempotencia, evento crudo persistido antes de procesar, ACK < 500 ms   | Bloqueado                  | Esquema    |
| Worker de colas (`apps/worker`)            | BullMQ sobre Redis (`docker-compose.yml` ya lo define)                                               | Bloqueado                  | Ingesta    |
| DataSource real + Realtime (`P8b`, 2/2)    | Consultas con RLS y suscripción a `dashboard_metrics_daily`                                          | Bloqueado                  | Esquema    |
| Features (`P9`)                            | Rotación A/B/C, períodos en Finanzas, cambios de estado de garantías                                 | Bloqueado                  | DataSource |
| Fee en devoluciones                        | Regla de cobro del 5 % en devoluciones/cancelaciones                                                 | **Diferido por el dueño**  | —          |

## 3. Bloqueo principal

`supabase/migrations/0001_init.sql` es un **placeholder con solo comentarios** (5 líneas). Por
D-06 ningún agente lo escribe: lo pega el dueño con el SQL aprobado y la enmienda E-01 de
[`ARQUITECTURA.md`](ARQUITECTURA.md#6-enmiendas-al-esquema-aprobado).

Sin tablas no hay pedidos, ni garantías, ni `webhook_events`, ni `dashboard_metrics_daily`. Por
eso los tres frentes siguientes quedan bloqueados aunque la infraestructura local ya funcione.

Cuando el SQL esté pegado, la secuencia es:

1. `supabase db reset` (aplica `0001_init.sql`).
2. Ingesta Miru v1 en `apps/ingest` (persistir crudo → encolar → ACK).
3. Worker BullMQ en `apps/worker`.
4. `DataSource` real en `apps/web` + Realtime del dashboard.

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

- **Operador local de prueba**: se crea contra el Auth local (por ejemplo con la pestaña de
  registro del Studio o `POST /auth/v1/signup`). Las credenciales no se commitean.

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
