-- Miru-Ecommerce · seed de DEMOSTRACIÓN (solo entorno local)
--
-- Genera datos ficticios para ver el panel funcionando mientras la plataforma
-- de origen todavía no envía datos reales.
--
-- * NO es esquema: el esquema vive en migrations/0001_init.sql.
-- * Es idempotente: borra los pedidos de demo (prefijo MRU-) y los vuelve a crear.
-- * Los montos van en CENTAVOS y el fee Miru NO se calcula aquí: lo generan las
--   columnas/triggers de la base (D-05).
-- * `supabase db reset` lo aplica automáticamente (config: sql_paths ./seed.sql).
--
-- Para quitar los datos de demo:
--   delete from public.orders where external_id like 'MRU-%';

-- ---------------------------------------------------------------------------
-- 1. Tenant y conexiones
-- ---------------------------------------------------------------------------

insert into public.tenants (id, nombre)
values ('44444444-4444-4444-4444-444444444444', 'Tienda Prueba')
on conflict (id) do nothing;

insert into public.connections (id, tenant_id, plataforma, estado, version_contrato)
values
  ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Dropi', 'activa', 'miru.v1'),
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'MasterShop', 'activa', 'miru.v1'),
  ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'Effi', 'pausada', 'miru.v1')
on conflict (id) do nothing;

-- Los usuarios existentes quedan como owners del tenant de demo (RLS).
insert into public.tenant_members (tenant_id, user_id, rol)
select '44444444-4444-4444-4444-444444444444', u.id, 'owner'
from auth.users u
on conflict (tenant_id, user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Catálogo
-- ---------------------------------------------------------------------------

insert into public.products
  (tenant_id, sku, nombre, precio_venta_cents, costo_unitario_cents, stock, plataformas, activo)
values
  ('44444444-4444-4444-4444-444444444444', 'LAMP-LED-01', 'Lámpara LED Recargable', 8400000, 5000000, 120, array['Dropi','MasterShop'], true),
  ('44444444-4444-4444-4444-444444444444', 'ORG-COC-04', 'Organizador Modular Cocina 4 Niveles', 12999000, 8000000, 80, array['Dropi'], true),
  ('44444444-4444-4444-4444-444444444444', 'AUDI-BT-02', 'Audífonos Bluetooth TWS', 6999000, 4200000, 150, array['MasterShop','Effi'], true),
  ('44444444-4444-4444-4444-444444444444', 'RELOJ-SM-03', 'Reloj Smartwatch Deportivo', 15999000, 10500000, 60, array['Dropi','Effi'], true),
  ('44444444-4444-4444-4444-444444444444', 'MASAJ-EL-05', 'Masajeador Eléctrico Portátil', 9999000, 6000000, 90, array['MasterShop'], true),
  ('44444444-4444-4444-4444-444444444444', 'VENT-USB-06', 'Ventilador USB de Escritorio', 3999000, 2300000, 200, array['Dropi'], true),
  ('44444444-4444-4444-4444-444444444444', 'TERMO-AC-07', 'Termo de Acero 1 L', 5999000, 3500000, 140, array['Effi'], true),
  ('44444444-4444-4444-4444-444444444444', 'ORGAN-PL-08', 'Organizador Plástico Apilable', 4499000, 2600000, 110, array['Dropi','MasterShop','Effi'], true)
on conflict (tenant_id, sku) do update
  set nombre = excluded.nombre,
      precio_venta_cents = excluded.precio_venta_cents,
      costo_unitario_cents = excluded.costo_unitario_cents,
      stock = excluded.stock,
      plataformas = excluded.plataformas,
      activo = excluded.activo;

-- ---------------------------------------------------------------------------
-- 3. Pedidos de demo (90 en los últimos 30 días)
-- ---------------------------------------------------------------------------

delete from public.orders where external_id like 'MRU-%';

with gen as (
  select
    n,
    (n - 1) % 30 as day_offset,
    (abs(('x' || substr(md5('status' || n), 1, 8))::bit(32)::int) % 100) as r_status,
    (abs(('x' || substr(md5('who' || n), 1, 8))::bit(32)::int) % 12) as r_who,
    (abs(('x' || substr(md5('city' || n), 1, 8))::bit(32)::int) % 12) as r_city,
    (abs(('x' || substr(md5('conn' || n), 1, 8))::bit(32)::int) % 3) as r_conn,
    (abs(('x' || substr(md5('carrier' || n), 1, 8))::bit(32)::int) % 4) as r_carrier,
    (abs(('x' || substr(md5('track' || n), 1, 8))::bit(32)::int)) as r_track,
    (abs(('x' || substr(md5('hour' || n), 1, 8))::bit(32)::int) % 8) as r_hour
  from generate_series(1, 90) as s(n)
),
computed as (
  select
    *,
    case
      when r_status < 70 then 'entregado'
      when r_status < 80 then 'en_transito'
      when r_status < 88 then 'pendiente'
      when r_status < 95 then 'devuelto'
      when r_status < 98 then 'novedad'
      else 'cancelado'
    end as estado
  from gen
),
fechas as (
  select
    *,
    (
      ((current_date - day_offset)::timestamp + interval '9 hours' + (r_hour || ' hours')::interval)
      at time zone 'America/Bogota'
    ) as created_at
  from computed
)
insert into public.orders (
  tenant_id, connection_id, external_id, estado,
  external_created_at, external_updated_at,
  carrier, tracking_number,
  customer_name, customer_phone, customer_city, customer_address,
  shipping_cost_cents, gateway_fee_cents, novedad_detalle
)
select
  '44444444-4444-4444-4444-444444444444',
  (array[
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    '77777777-7777-7777-7777-777777777777'
  ])[r_conn + 1]::uuid,
  'MRU-' || lpad(n::text, 4, '0'),
  estado,
  created_at,
  least(
    created_at + case estado
      when 'entregado' then interval '2 days'
      when 'devuelto' then interval '3 days'
      when 'en_transito' then interval '1 day'
      else interval '4 hours'
    end,
    now()
  ),
  (array['Coordinadora', 'Servientrega', 'Interrapidísimo', 'Envía'])[r_carrier + 1],
  'CO-' || lpad((100000000 + r_track % 800000000)::text, 9, '0'),
  (array[
    'Camila Restrepo', 'Andrés Mendoza', 'Laura Gómez', 'Julián Torres',
    'Valentina Ríos', 'Santiago Mejía', 'Daniela Castro', 'Felipe Vargas',
    'Isabela Ramírez', 'Mateo Herrera', 'Paula Ospina', 'Sebastián Ortiz'
  ])[r_who + 1],
  '3' || lpad((10000000 + r_track % 89000000)::text, 8, '0'),
  (array[
    'Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga',
    'Pereira', 'Manizales', 'Cúcuta', 'Ibagué', 'Villavicencio', 'Santa Marta'
  ])[r_city + 1],
  (array['Cra 12 # 45-67', 'Calle 80 # 23-11', 'Av 30 # 5-42', 'Transv 17 # 90-8'])[r_carrier + 1],
  1000000 + r_carrier * 150000,
  0,
  case when estado = 'novedad'
    then (array['Dirección no encontrada', 'Cliente no contesta', 'Zona de difícil acceso'])[(r_status % 3) + 1]
    else null
  end
from fechas;

-- ---------------------------------------------------------------------------
-- 4. Ítems (el fee lo genera la BD)
-- ---------------------------------------------------------------------------

with primario as (
  select o.id as order_id, p.sku, p.precio_venta_cents, p.costo_unitario_cents, o.external_id
  from public.orders o
  join lateral (
    select *
    from public.products p2
    where p2.tenant_id = o.tenant_id
    order by md5(o.external_id || p2.sku)
    limit 1
  ) p on true
  where o.external_id like 'MRU-%'
)
insert into public.order_items (order_id, sku, qty, unit_price_cents, unit_cost_cents)
select
  order_id,
  sku,
  1 + (abs(('x' || substr(md5(external_id || 'qty'), 1, 8))::bit(32)::int) % 2),
  precio_venta_cents,
  costo_unitario_cents
from primario;

with secundario as (
  select o.id as order_id, p.sku, p.precio_venta_cents, p.costo_unitario_cents
  from public.orders o
  join lateral (
    select *
    from public.products p2
    where p2.tenant_id = o.tenant_id
      and p2.sku <> (
        select i.sku from public.order_items i where i.order_id = o.id order by i.sku limit 1
      )
    order by md5(o.external_id || p2.sku || 'x')
    limit 1
  ) p on true
  where o.external_id like 'MRU-%'
    and (abs(('x' || substr(md5(o.external_id || 'second'), 1, 8))::bit(32)::int) % 100) < 35
)
insert into public.order_items (order_id, sku, qty, unit_price_cents, unit_cost_cents)
select order_id, sku, 1, precio_venta_cents, costo_unitario_cents
from secundario;

-- ---------------------------------------------------------------------------
-- 5. Garantías de demo (sobre pedidos entregados)
-- ---------------------------------------------------------------------------

insert into public.warranties (
  tenant_id, order_id, motivo, monto_solicitado_cents, estado, fecha_solicitud, resolucion_nota
)
select
  o.tenant_id,
  o.id,
  (array[
    'Producto llegó defectuoso',
    'No coincide con lo pedido',
    'Llegó incompleto',
    'Daño en el transporte'
  ])[(row_number() over ())::int % 4 + 1],
  o.subtotal_cents,
  (array['solicitada', 'en_revision', 'aprobada'])[(row_number() over ())::int % 3 + 1],
  least(o.external_updated_at + interval '1 day', now()),
  null
from public.orders o
where o.external_id like 'MRU-%'
  and o.estado = 'entregado'
order by o.external_created_at desc
limit 6;

-- ---------------------------------------------------------------------------
-- 6. Métricas diarias (misma regla que la app, sumando lo ya calculado)
-- ---------------------------------------------------------------------------

insert into public.dashboard_metrics_daily (
  tenant_id, dia,
  ventas_brutas_cents, fee_miru_cents, costo_fletes_cents, utilidad_neta_cents,
  pedidos_total, entregados, devueltos, garantias_abiertas
)
select
  o.tenant_id,
  (o.external_created_at at time zone 'America/Bogota')::date as dia,
  coalesce(sum(o.subtotal_cents) filter (where o.estado <> 'cancelado'), 0),
  coalesce(sum(o.fee_miru_cents) filter (where o.estado <> 'cancelado'), 0),
  0,
  coalesce(sum(o.fee_miru_cents) filter (where o.estado = 'entregado'), 0)
    - coalesce(sum(o.fee_miru_cents) filter (where o.estado = 'devuelto'), 0),
  count(*),
  count(*) filter (where o.estado = 'entregado'),
  count(*) filter (where o.estado = 'devuelto'),
  0
from public.orders o
where o.external_id like 'MRU-%'
group by o.tenant_id, dia
on conflict (tenant_id, dia) do update
  set ventas_brutas_cents = excluded.ventas_brutas_cents,
      fee_miru_cents = excluded.fee_miru_cents,
      costo_fletes_cents = excluded.costo_fletes_cents,
      utilidad_neta_cents = excluded.utilidad_neta_cents,
      pedidos_total = excluded.pedidos_total,
      entregados = excluded.entregados,
      devueltos = excluded.devueltos,
      garantias_abiertas = excluded.garantias_abiertas,
      updated_at = now();
