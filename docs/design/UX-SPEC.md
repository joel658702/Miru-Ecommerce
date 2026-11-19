# Miru-Ecommerce — Especificación de UX

Alcance: WebApp responsiva (PC/móvil), UI en español, **estado actual = demo (P8a)**.
Los datos son ficticios y no hay autenticación. Lo que cambia con datos reales se marca como
**P8b** / **P9**.

## 1. Modelo de navegación

| Viewport | Navegación                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| ≥ 768 px | Sidebar fija a la izquierda (colapsable), 6 destinos: Dashboard, Pedidos, Garantías, Productos, Finanzas, Conexiones |
| < 768 px | Barra inferior fija con 5 ranuras: Dashboard, Pedidos, Garantías, Productos y **Más** (abre Finanzas y Conexiones)   |

- El destino activo se marca con color `primary` y `aria-current="page"`.
- El header es `sticky` y muestra: título de la vista, badge **DEMO**, indicador en vivo y
  acceso «Operador» → `/login`.
- El contenido respeta `max-w-[1440px]` y deja `pb-24` en móvil para no quedar bajo la barra.

## 2. Mapa de rutas

| Ruta          | Título               | Propósito                                      | Estado          |
| ------------- | -------------------- | ---------------------------------------------- | --------------- |
| `/`           | Dashboard General    | Salud operativa y financiera del día           | Real            |
| `/pedidos`    | Pedidos              | Listado, búsqueda, filtros y detalle de pedido | Real            |
| `/garantias`  | Garantías            | Tablero de garantías por estado y detalle      | Real            |
| `/productos`  | Productos            | Catálogo con stock, costo y plataformas        | Real            |
| `/finanzas`   | Finanzas             | Ventas, fee, fletes y desglose por plataforma  | Real            |
| `/conexiones` | Conexiones           | Estado de integraciones y endpoints de webhook | Real            |
| `/login`      | Acceso de Operadores | Entrada al panel                               | Auth real (P8b) |

## 3. Pantallas

### 3.1 Dashboard `/`

1. **8 KPI** en grilla 1/2/4 columnas: Ventas brutas, Fee Miru 5 %, Costo de fletes,
   Utilidad neta, Pedidos totales, Entregados, Devueltos, Garantías abiertas.
2. **Flujo logístico — últimos 7 días**: barras SVG (despachados vs entregados) con leyenda.
3. **Participación por plataforma**: barra segmentada + leyenda con `StatusChip` de plataforma.
4. **Pedidos que requieren gestión**: lista corta + enlace «Ver todos los pedidos (n)».
5. **Nota de sincronización**: explica que la ingesta canónica valida HMAC en < 500 ms.

Regla de dinero: el fee se muestra como «—» cuando es `null` (demo). **Nunca** se calcula en
el cliente (D-05).

### 3.2 Pedidos `/pedidos`

- Tabla con búsqueda (`SearchInput`) y filtros (`FilterBar`), estados de pedido con `StatusChip`.
- Selección de fila abre **panel de detalle** (`role="dialog"`, `aria-labelledby`): datos del
  cliente, transportadora, guía, ítems e historial.
- En móvil, las filas se convierten en tarjetas (`renderMobileCard`).
- Estados: `loading` (skeleton), `empty` (sin resultados para el filtro), `error` (reintento).

### 3.3 Garantías `/garantias`

- Tablero por estado (solicitada → en revisión → aprobada/rechazada → reembolsada) con
  `KanbanCard`.
- Panel de detalle con monto solicitado, motivo y resolución.
- **P9**: los cambios de estado reales (con RLS de operador) llegan cuando exista backend.

### 3.4 Productos `/productos`

- Listado con SKU, precio de venta, costo unitario, stock y plataformas (`StatusChip`).
- **P9**: clasificación A/B/C (rotación) se agrega cuando exista el job de analítica.

### 3.5 Finanzas `/finanzas`

- KPI de ventas brutas, Fee Miru 5 % («—» en demo), costo de fletes y utilidad neta.
- Tabla de desglose por plataforma con columna «Fee Miru (5 %)».
- **P9**: selección de período (hoy/semana/mes) sobre `dashboard_metrics_daily`.

### 3.6 Conexiones `/conexiones`

- Tarjeta por plataforma (Dropi, MasterShop, Effi) con estado (activa/pausada/error), último
  evento, eventos de hoy, URL de webhook (mono) y versión de contrato.

### 3.7 Login `/login`

- Formulario (correo, contraseña con mínimo 6) con validación en cliente y errores accesibles
  (`role="alert"`, mensajes en español).
- **Con Supabase configurado**: `signInWithPassword` real; al entrar redirige a `/` y la sesión
  queda en cookies. Si ya hay sesión se muestra el correo y las acciones «Ir al panel» y
  «Cerrar sesión».
- **Sin Supabase configurado** (modo demo): el submit queda deshabilitado y aparece el aviso
  «Conexión pendiente (P8b)».
- Enlace «Volver al Dashboard (Modo Demo)».
- **P8b (pendiente)**: protección de rutas y RLS aplicado cuando existan las tablas.

## 4. Estados y retroalimentación

| Estado   | Componente             | Regla                                            |
| -------- | ---------------------- | ------------------------------------------------ |
| Cargando | `Skeleton`             | Un bloque por fila/tarjeta; nunca spinner suelto |
| Vacío    | `EmptyState`           | Título + descripción + acción opcional           |
| Error    | `ErrorState`           | `role="alert"` + «Reintentar»                    |
| Datos    | `DataTable` / tarjetas | Orden estable y `keyExtractor`                   |

- Los avisos transitorios usan `Toast`.
- El indicador en vivo (`LiveIndicator`) alterna «En vivo» / «Pausado»; el texto de última
  sincronización hoy es fijo («hace 2 min») y **debe** venir del backend en P8b.
- El badge **DEMO** solo aparece cuando la WebApp no tiene Supabase configurado (origen de datos
  de demo). Con datos reales desaparece.

## 5. Responsive

- Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- `< 768`: una columna, tarjetas en listas, barra inferior; sidebar oculta.
- `768–1023`: dos columnas de KPI, sidebar visible.
- `≥ 1024`: dashboard en 12 columnas (gráfico 7 / participación 5), KPIs en 4 columnas.
- Nunca hay scroll horizontal de página; las tablas anchas hacen scroll dentro de su región.

## 6. Contenido y formato

- Idioma: español de Colombia; tuteo neutral; sin jerga técnica en la UI de operador.
- Moneda: `formatCOP` de `@miru/shared` (`$ 1.234,56`), enteros en centavos.
- Cantidades y cifras: `tabular-nums`.
- Fechas relativas («hace 2 min») y absolutas en `es-CO`.
- Estados de dominio siempre con su etiqueta capitalizada («En tránsito», «En revisión»).
- Términos prohibidos en UI: cálculos de fee propios, «estimado» para utilidad neta.

## 7. Accesibilidad

- Foco visible global (outline cian 2 px).
- Todo control icónico con `aria-label`; iconos decorativos con `aria-hidden`.
- Paneles de detalle: `role="dialog"`, `aria-modal`, cierre con `Esc` y botón explícito.
- Barra inferior con `aria-label="Navegación móvil"`; «Más» con `aria-expanded`.
- Tablas con `role="region"`, `aria-label` y foco por teclado.
- `prefers-reduced-motion`: sin animaciones y póster estático en la intro.

## 8. Deuda conocida

| Tema           | Estado                          | Nota                                                     |
| -------------- | ------------------------------- | -------------------------------------------------------- |
| Intro de marca | 10 s de video, cierre a los 2 s | Decidir: alargar el temporizador o recortar el video     |
| «hace 2 min»   | Texto fijo                      | Debe venir de la última sincronización real              |
| Login          | Auth real (18-nov)              | Falta proteger rutas (RLS ya aplica en los datos)        |
| Datos          | Reales vía `/api/data`          | Sustituido en P8b (19-nov-2026); sin sesión → 401        |
| Realtime       | No implementado                 | Suscripción a `dashboard_metrics_daily` (siguiente fase) |
| Fee Miru       | Calculado en BD                 | Se muestra tal cual llega; la app nunca lo recalcula     |

## 9. Criterios de aceptación sugeridos para P8b

1. `/login` autentica contra Supabase Auth y persiste la sesión; credenciales inválidas
   muestran error accesible (no un alert).
2. El `DataSource` real sustituye al demo detrás de la misma interfaz, sin tocar pantallas.
3. El dashboard se suscribe a **`dashboard_metrics_daily`** por canal privado; la suscripción
   se pausa con la pestaña oculta y se re-sincroniza con un snapshot al volver.
4. Los 4 estados (`data`, `loading`, `empty`, `error`) se ven con datos reales, incluidos
   períodos sin pedidos.
5. Ningún componente calcula fee ni utilidad: solo formatea lo que llega de la BD.
6. `pnpm typecheck`, `pnpm lint`, `pnpm build` y los tests siguen en verde.
