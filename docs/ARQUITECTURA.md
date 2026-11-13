# Miru-Ecommerce — Arquitectura

## 1. Sistema

Plataforma centralizada de pedidos, garantías, transportadoras y finanzas para dropshipping
(Dropi, MasterShop, Effi). WebApp responsiva PC/móvil, UI en español.

## 2. Topología

Internet → Cloudflare Free (DNS/CDN/TLS/WAF) → VPS Contabo (Docker: Caddy, Next.js
standalone, ingesta Fastify, Redis+worker, cron de backups) → Supabase (PostgreSQL + Auth +
Realtime). GitHub para código y CI. Google AI Studio solo con agregados anonimizados. Vercel
descartado para producción (plan Hobby prohíbe uso comercial).

Fase actual: LOCAL-FIRST. Supabase CLI + Redis en Docker del desarrollador. Sin cuentas nube
creadas todavía.

## 3. Decisiones bloqueadas

Ver AGENTS.md (reglas operativas) y docs/CONTEXT.md (registro de decisiones). No duplicar aquí.

## 4. Mitigaciones del plan gratuito

- BD 500 MB: montos en BIGINT centavos, purga de webhook_events a 14 días, auditoría solo de
  cambios sensibles.
- Realtime (200 conexiones / cuota mensual de mensajes): suscripción a
  dashboard_metrics_daily (1 fila/día/tenant), pausa con pestaña oculta, debounce.
- Sin backups automáticos: cron en VPS con pg_dump cifrado → Cloudflare R2.
- Pausa por inactividad a 7 días: tráfico de webhooks + cron diario.
- IA gratuita entrena con datos: prohibido enviar PII o datos financieros.

## 5. Contrato canónico Miru v1

Se implementa en packages/shared (tarea P3). Validación HMAC-SHA256 sobre body crudo, ventana
de timestamp ±300s, idempotencia por unique(connection_id, external_event_id), orden por
external_updated_at.

Los payloads nativos de Dropi/MasterShop/Effi son DESCONOCIDOS: prohibido inventarlos; se
requieren sus documentos oficiales.

## 6. Enmiendas al esquema aprobado

### E-01 — guarda NULL en add_owner()

Motivo: al sembrar como superusuario, auth.uid() es NULL y viola el NOT NULL de
tenant_members. Reemplazar la función add_owner() por:

```sql
create function public.add_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    insert into tenant_members values (new.id, auth.uid(), 'owner');
  end if;
  return new;
end $$;
```

El resto del esquema permanece idéntico. El trigger trg_owner no cambia.

## 7. Diferidos (no implementar)

- Regla de cobro del 5% en devoluciones/cancelaciones: decisión del dueño, llegará como orden
  individual. El cálculo actual (5% por item sobre venta bruta, totalizado) permanece.
- Creación de cuentas nube y despliegue a VPS.

## 8. Esquema de base de datos

El SQL aprobado lo pega el humano en supabase/migrations/0001_init.sql, aplicando la enmienda
E-01. Ningún agente lo reescribe.
