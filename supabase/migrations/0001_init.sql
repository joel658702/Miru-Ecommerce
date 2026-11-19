-- Miru-Ecommerce · 0001_init.sql
--
-- Esquema inicial de la base de datos.
--
-- Redactado por el agente el 18-nov-2026 con AUTORIZACIÓN EXPLÍCITA del dueño
-- (excepción puntual a D-06). Queda PENDIENTE de su aprobación final: no debe
-- aplicarse en ningún entorno que no sea el local de desarrollo hasta que el
-- dueño lo confirme.
--
-- Reglas respetadas:
--   D-04  Montos SIEMPRE enteros en centavos (BIGINT). Ningún float/numeric de
--         dinero almacenado; el fee se calcula con aritmética entera.
--   D-05  Fee Miru 5 % calculado en la BD: columna generada por ítem y totalizado
--         por trigger en `orders`. La regla de cobro en devoluciones está
--         DIFERIDA: aquí no existe ninguna columna, trigger ni cálculo para eso.
--   D-06  RLS activo en TODAS las tablas.
--   D-07  Idempotencia por unique(connection_id, external_event_id); el evento
--         crudo se persiste antes de procesar (processed_at nulo hasta el worker).
--   D-08  `dashboard_metrics_daily` (1 fila por día y tenant) publicada en Realtime.
--
-- Decisiones pendientes de confirmar por el dueño (marcadas como POR CONFIRMAR):
--   1. Redondeo del fee por ítem: hoy TRUNCA a centavos (división entera).
--   2. Fórmula de `utilidad_neta_cents`: se almacena en métricas, no se calcula
--      aquí, porque depende de la regla de devoluciones (diferida).

-- ---------------------------------------------------------------------------
-- 0. Utilidades
-- ---------------------------------------------------------------------------

-- Mantiene `updated_at` en el servidor: ningún cliente puede falsearlo.
create function public.touch_updated_at() returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Tenants y miembros (multi-inquilino)
-- ---------------------------------------------------------------------------

create table public.tenants (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (length(btrim(nombre)) > 0),
  created_at timestamptz not null default now()
);

comment on table public.tenants is 'Inquilino (tienda/negocio). Aísla todos los datos.';

create table public.tenant_members (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  rol        text not null default 'operador' check (rol in ('owner', 'operador')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

comment on table public.tenant_members is 'Pertenencia de un usuario de Supabase Auth a un tenant y su rol.';

-- E-01: al sembrar como superusuario, auth.uid() es NULL y violaría el NOT NULL.
-- Solo se crea la fila de owner cuando hay usuario autenticado.
create function public.add_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    insert into tenant_members values (new.id, auth.uid(), 'owner');
  end if;
  return new;
end $$;

create trigger trg_owner
after insert on public.tenants
for each row execute function public.add_owner();

-- ---------------------------------------------------------------------------
-- 2. Integraciones y webhooks (D-07)
-- ---------------------------------------------------------------------------

create table public.connections (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  plataforma        text not null check (plataforma in ('Dropi', 'MasterShop', 'Effi')),
  estado            text not null default 'pausada' check (estado in ('activa', 'pausada', 'error')),
  version_contrato  text not null default 'miru.v1',
  ultimo_evento_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (tenant_id, plataforma)
);

comment on table public.connections is 'Conexión por plataforma de origen (Dropi, MasterShop, Effi). El secreto HMAC vive solo en el servidor (D-09).';

create table public.webhook_events (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  connection_id       uuid not null references public.connections(id) on delete cascade,
  external_event_id   text not null,
  event_type          text not null,
  occurred_at         timestamptz not null,
  external_updated_at timestamptz not null,
  payload             jsonb not null,
  received_at         timestamptz not null default now(),
  processed_at        timestamptz,
  process_error       text,
  -- D-07: idempotencia por conexión + id de evento.
  unique (connection_id, external_event_id)
);

comment on table public.webhook_events is 'Evento crudo persistido ANTES de procesarse (D-07). processed_at lo completa el worker.';

create index webhook_events_recientes_idx
  on public.webhook_events (connection_id, received_at desc);

-- ---------------------------------------------------------------------------
-- 3. Pedidos, ítems y fee Miru (D-04 / D-05)
-- ---------------------------------------------------------------------------

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  connection_id       uuid not null references public.connections(id) on delete restrict,
  external_id         text not null,
  estado              text not null check (
    estado in ('pendiente', 'confirmado', 'en_transito', 'entregado', 'devuelto', 'cancelado', 'novedad')
  ),
  external_created_at timestamptz not null,
  external_updated_at timestamptz not null,
  carrier             text,
  tracking_number     text,
  customer_name       text not null,
  customer_phone      text not null,
  customer_city       text not null,
  customer_address    text,
  shipping_cost_cents bigint not null default 0 check (shipping_cost_cents >= 0),
  gateway_fee_cents   bigint not null default 0 check (gateway_fee_cents >= 0),
  -- Venta bruta del pedido (suma de ítems) y fee total: los mantiene el trigger
  -- de `order_items`, nunca la aplicación (D-05).
  subtotal_cents      bigint not null default 0 check (subtotal_cents >= 0),
  fee_miru_cents      bigint not null default 0 check (fee_miru_cents >= 0),
  novedad_detalle     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (connection_id, external_id)
);

comment on column public.orders.fee_miru_cents is 'Totalizado por trigger desde order_items (D-05). PROHIBIDO recalcularlo en la aplicación.';
comment on column public.orders.subtotal_cents is 'Suma de (unit_price_cents * qty) de los ítems. La mantiene el mismo trigger.';

create index orders_tenant_actualizado_idx
  on public.orders (tenant_id, external_updated_at desc);

create index orders_tenant_estado_idx
  on public.orders (tenant_id, estado);

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  sku               text not null,
  qty               integer not null check (qty > 0),
  unit_price_cents  bigint not null check (unit_price_cents >= 0),
  unit_cost_cents   bigint not null check (unit_cost_cents >= 0),
  -- D-05: fee Miru 5 % por ítem, columna generada, aritmética ENTERA.
  -- POR CONFIRMAR: hoy trunca a centavos (división entera, sin redondeo).
  fee_miru_cents    bigint generated always as (((unit_price_cents * qty) * 5) / 100) stored
);

comment on column public.order_items.fee_miru_cents is 'Fee Miru 5 % calculado por la BD. PROHIBIDO recalcularlo en la aplicación.';

create index order_items_order_idx on public.order_items (order_id);

create function public.sync_order_totals() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  target_order uuid;
begin
  target_order := coalesce(new.order_id, old.order_id);

  update public.orders o
     set subtotal_cents = coalesce(
           (select sum(i.unit_price_cents * i.qty) from public.order_items i where i.order_id = target_order),
           0
         ),
         fee_miru_cents = coalesce(
           (select sum(i.fee_miru_cents) from public.order_items i where i.order_id = target_order),
           0
         )
   where o.id = target_order;

  return null;
end;
$$;

create trigger trg_order_totals
after insert or update of qty, unit_price_cents or delete on public.order_items
for each row execute function public.sync_order_totals();

-- ---------------------------------------------------------------------------
-- 4. Catálogo
-- ---------------------------------------------------------------------------

create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  sku                  text not null,
  nombre               text not null,
  precio_venta_cents   bigint not null default 0 check (precio_venta_cents >= 0),
  costo_unitario_cents bigint not null default 0 check (costo_unitario_cents >= 0),
  stock                integer not null default 0 check (stock >= 0),
  plataformas          text[] not null default '{}'
    check (plataformas <@ array['Dropi', 'MasterShop', 'Effi']::text[]),
  activo               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (tenant_id, sku)
);

-- ---------------------------------------------------------------------------
-- 5. Garantías (la regla de cobro en devoluciones está DIFERIDA: sin fee)
-- ---------------------------------------------------------------------------

create table public.warranties (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references public.tenants(id) on delete cascade,
  order_id                uuid not null references public.orders(id) on delete cascade,
  motivo                  text not null,
  monto_solicitado_cents  bigint not null default 0 check (monto_solicitado_cents >= 0),
  estado                  text not null default 'solicitada' check (
    estado in ('solicitada', 'en_revision', 'aprobada', 'rechazada', 'reembolsada')
  ),
  fecha_solicitud         timestamptz not null default now(),
  resolucion_nota         text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.warranties is 'Garantías. Sin columnas de fee: la regla de cobro en devoluciones está DIFERIDA por el dueño (D-05).';

create index warranties_tenant_estado_idx on public.warranties (tenant_id, estado);

-- ---------------------------------------------------------------------------
-- 6. Métricas diarias para Realtime (D-08)
-- ---------------------------------------------------------------------------

create table public.dashboard_metrics_daily (
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  dia                 date not null,
  ventas_brutas_cents bigint not null default 0 check (ventas_brutas_cents >= 0),
  fee_miru_cents      bigint not null default 0 check (fee_miru_cents >= 0),
  costo_fletes_cents  bigint not null default 0 check (costo_fletes_cents >= 0),
  utilidad_neta_cents bigint not null default 0,
  pedidos_total       integer not null default 0 check (pedidos_total >= 0),
  entregados          integer not null default 0 check (entregados >= 0),
  devueltos           integer not null default 0 check (devueltos >= 0),
  garantias_abiertas  integer not null default 0 check (garantias_abiertas >= 0),
  updated_at          timestamptz not null default now(),
  primary key (tenant_id, dia)
);

comment on table public.dashboard_metrics_daily is 'Una fila por día y tenant: el dashboard se suscribe aquí, no a los pedidos (D-08). La escribe el worker.';
comment on column public.dashboard_metrics_daily.utilidad_neta_cents is 'POR CONFIRMAR: su fórmula depende de la regla de devoluciones (diferida).';

-- ---------------------------------------------------------------------------
-- 7. updated_at en servidor
-- ---------------------------------------------------------------------------

create trigger trg_connections_updated_at
before update on public.connections
for each row execute function public.touch_updated_at();

create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

create trigger trg_products_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

create trigger trg_warranties_updated_at
before update on public.warranties
for each row execute function public.touch_updated_at();

create trigger trg_metrics_updated_at
before update on public.dashboard_metrics_daily
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 8. RLS (D-06): activo en TODAS las tablas
-- ---------------------------------------------------------------------------

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.connections enable row level security;
alter table public.webhook_events enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.products enable row level security;
alter table public.warranties enable row level security;
alter table public.dashboard_metrics_daily enable row level security;

-- Helpers SECURITY DEFINER: evitan recursión de políticas sobre tenant_members
-- y permiten leer el tenant de un pedido sin aplicar la RLS de `orders`.
create function public.is_tenant_member(target_tenant uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.tenant_members m
     where m.tenant_id = target_tenant
       and m.user_id = auth.uid()
  );
$$;

create function public.is_tenant_owner(target_tenant uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.tenant_members m
     where m.tenant_id = target_tenant
       and m.user_id = auth.uid()
       and m.rol = 'owner'
  );
$$;

create function public.order_tenant(target_order uuid) returns uuid
language sql stable security definer set search_path = public
as $$
  select tenant_id from public.orders where id = target_order;
$$;

-- tenants: todos los miembros leen; cualquier autenticado puede crear uno
-- (el trigger trg_owner lo hace owner); solo el owner lo modifica o borra.
create policy tenants_select on public.tenants
for select to authenticated
using (public.is_tenant_member(id));

create policy tenants_insert on public.tenants
for insert to authenticated
with check (auth.uid() is not null);

create policy tenants_update on public.tenants
for update to authenticated
using (public.is_tenant_owner(id))
with check (public.is_tenant_owner(id));

create policy tenants_delete on public.tenants
for delete to authenticated
using (public.is_tenant_owner(id));

-- tenant_members: cada miembro ve los miembros de su tenant. Las altas las hace
-- el trigger trg_owner o el servidor con service_role.
create policy tenant_members_select on public.tenant_members
for select to authenticated
using (public.is_tenant_member(tenant_id));

-- connections / orders / products / warranties / métricas: acceso por pertenencia.
create policy connections_member_all on public.connections
for all to authenticated
using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));

create policy orders_member_all on public.orders
for all to authenticated
using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));

create policy order_items_member_all on public.order_items
for all to authenticated
using (public.is_tenant_member(public.order_tenant(order_id)))
with check (public.is_tenant_member(public.order_tenant(order_id)));

create policy products_member_all on public.products
for all to authenticated
using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));

create policy warranties_member_all on public.warranties
for all to authenticated
using (public.is_tenant_member(tenant_id))
with check (public.is_tenant_member(tenant_id));

-- Métricas: lectura para el dashboard; la escritura es exclusiva del worker.
create policy dashboard_metrics_read on public.dashboard_metrics_daily
for select to authenticated
using (public.is_tenant_member(tenant_id));

-- webhook_events: sin políticas. Solo service_role (servidor) accede.

-- ---------------------------------------------------------------------------
-- 9. Privilegios
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
  on public.tenants, public.tenant_members, public.connections, public.orders,
     public.order_items, public.products, public.warranties
  to authenticated;

grant select on public.dashboard_metrics_daily to authenticated;

grant all privileges
  on public.tenants, public.tenant_members, public.connections, public.webhook_events,
     public.orders, public.order_items, public.products, public.warranties,
     public.dashboard_metrics_daily
  to service_role;

-- ---------------------------------------------------------------------------
-- 10. Realtime (D-08): solo las métricas diarias
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.dashboard_metrics_daily';
  end if;
end $$;
