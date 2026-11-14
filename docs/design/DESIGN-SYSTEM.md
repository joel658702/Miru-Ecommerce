# Miru-Ecommerce — Sistema de diseño

Documento de referencia del lenguaje visual implementado en `apps/web`.
**Fuente de verdad**: [`apps/web/app/globals.css`](../../apps/web/app/globals.css). Los tokens
exportados viven en [`tokens.json`](tokens.json) y [`theme.css`](theme.css).

Estado: **demo (P8a)**. Todavía no hay datos reales ni autenticación.

## 1. Principios

1. **Claridad operativa**: la pantalla responde «¿qué pasa hoy y qué requiere acción?» antes
   que «¿qué se puede hacer?».
2. **Densidad útil**: mucha información por pantalla, pero con jerarquía (cifra → delta →
   contexto). Nunca densidad a costa de legibilidad.
3. **Estados explícitos**: cada vista tiene `loading`, `empty`, `error` y `data`. Nada de
   pantallas en blanco.
4. **Español de Colombia**: toda la UI, incluidos los estados vacíos y los errores.
5. **Accesible por defecto**: foco visible, objetivos táctiles ≥ 44 px, `aria-label` en
   controles icónicos y respeto por `prefers-reduced-motion`.

## 2. Color

Todos los colores se consumen como variables CSS (`var(--color-…)`). **Prohibido hardcodear
hex en componentes**: si falta un token, se agrega al bloque `@theme`.

### Marca

| Token                       | Valor     | Uso                                  |
| --------------------------- | --------- | ------------------------------------ |
| `--color-primary`           | `#006A6A` | Acciones principales, enlaces        |
| `--color-primary-hover`     | `#005556` | Hover de acciones                    |
| `--color-primary-container` | `#00D2D3` | Énfasis, contenedores                |
| `--color-primary-bright`    | `#0891B2` | Series de gráficos (despachados)     |
| `--color-accent-emerald`    | `#10B981` | Positivo, entregas, estado «en vivo» |
| `--color-accent-amber`      | `#F59E0B` | Advertencia, novedades               |

### Neutrales y superficies

Escala `neutral-50…900` (slate). Superficies: `surface-canvas` (fondo), `surface-card`
(tarjetas), `surface-subdued`, `surface-inverse`. Bordes: `border-subtle` (reposo),
`border-interactive` (controles).

### Semánticos

Cada estado tiene `bg`, `text`, `border` y `solid`: `success`, `warning`, `danger`, `info`.

### Estados de dominio

- **Pedido** (7): `pendiente`, `confirmado`, `en_transito`, `entregado`, `devuelto`,
  `cancelado`, `novedad`.
- **Garantía** (5): `solicitada`, `en_revision`, `aprobada`, `rechazada`, `reembolsada`.
- **Plataforma** (3): `dropi`, `mastershop`, `effi`.

Cada uno trae `bg`, `text`, `border` y `dot`. El punto (`dot`) es la señal redundante de
estado: nunca se comunica estado solo por color.

## 3. Tipografía

| Rol     | Familia           | Uso                                         |
| ------- | ----------------- | ------------------------------------------- |
| Display | Plus Jakarta Sans | Títulos, cifras KPI, nombre de marca        |
| Texto   | DM Sans           | Cuerpo, etiquetas, tablas                   |
| Mono    | JetBrains Mono    | Timestamps, datos técnicos (URL de webhook) |

Escala: `headline-xl` 36/44 · `headline-lg` 30/36 · `headline-md` 24/32 · `headline-sm` 20/28 ·
`currency-stat` 28/32 · `body-lg` 16/24 · `body-md` 14/20 · `body-sm` 12/16 · `label-sm` 11/14.

Reglas:

- Cifras monetarias y contadores siempre con `tabular-nums` (alineación vertical).
- Cifras KPI en `font-display` con `tracking-[-0.03em]` y `truncate`.
- Etiquetas de KPI en 12 px `font-semibold` color `neutral-500`.
- Las fuentes se cargan por `<link>` de Google Fonts en `app/layout.tsx` (no `next/font`).

## 4. Espaciado, radios y elevación

- **Espaciado**: base 4 px (1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64).
- **Radios**: `sm` 4 · `md` 8 · `lg` 12 · `xl` 16 · `2xl` 24 · `full`.
- **Sombras**: `level-1` tarjetas en reposo · `level-2` menús/paneles · `level-3` modales ·
  `focus-ring` para foco compuesto.
- Contenedor principal: `max-w-[1440px]`, padding `p-4 md:p-6`, `pb-24` en móvil para dejar
  espacio a la barra inferior.

## 5. Componentes

| Componente      | Archivo                           | Propósito                                                                       |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| `AppShell`      | `components/layout/AppShell.tsx`  | Layout: sidebar + header + main + bottom nav                                    |
| `Sidebar`       | `components/layout/Sidebar.tsx`   | Navegación de escritorio, colapsable                                            |
| `BottomNav`     | `components/layout/BottomNav.tsx` | Navegación móvil (4 destinos + «Más»: Finanzas y Conexiones)                    |
| `Header`        | `components/layout/Header.tsx`    | Título, badge DEMO, indicador en vivo, operador                                 |
| `KpiCard`       | `components/ui/KpiCard.tsx`       | Métrica: `label`, `value`, `delta`, `deltaTone`, `helperText`, `icon`, `accent` |
| `StatusChip`    | `components/ui/StatusChip.tsx`    | Estado: `domain` (`pedido`/`garantia`/`plataforma`), `status`, `size`           |
| `DataTable`     | `components/ui/DataTable.tsx`     | Tabla genérica: `columns`, `rows`, `state`, `onSelectRow`, `renderMobileCard`   |
| `FilterBar`     | `components/ui/FilterBar.tsx`     | Filtros por plataforma/estado                                                   |
| `SearchInput`   | `components/ui/SearchInput.tsx`   | Búsqueda con limpieza                                                           |
| `EmptyState`    | `components/ui/EmptyState.tsx`    | Sin datos + acción opcional                                                     |
| `ErrorState`    | `components/ui/ErrorState.tsx`    | Error + reintento (`role="alert"`)                                              |
| `Skeleton`      | `components/ui/Skeleton.tsx`      | Carga: `variant` (`table`/`card`/`kpi`), `rows`                                 |
| `LiveIndicator` | `components/ui/LiveIndicator.tsx` | «En vivo»/«Pausado» + última sincronización                                     |
| `Toast`         | `components/ui/Toast.tsx`         | Notificaciones transitorias                                                     |
| `KanbanCard`    | `components/ui/KanbanCard.tsx`    | Tarjeta de garantía en tablero                                                  |
| `DemoBadge`     | `components/ui/DemoBadge.tsx`     | Marca el entorno de demostración                                                |
| `BrandIntro`    | `components/brand/BrandIntro.tsx` | Intro de marca (video) en el primer render                                      |

### Patrón de estados (obligatorio en listas)

`DataTable` recibe `state: "data" | "loading" | "empty" | "error"` y renderiza
`Skeleton` / `EmptyState` / `ErrorState` / filas. Cualquier tabla nueva debe reutilizar ese
contrato en vez de inventar estados locales.

## 6. Movimiento

- Intro de marca: video de **10 s**, 24 fps, 960×540, sin audio, `muted`/`playsInline`,
  poster estático. Se cierra con `Esc`, clic o el botón «Omitir»; además hay un temporizador
  de **2 s**.
- Con `prefers-reduced-motion: reduce` se muestra el póster (`logo-poster.svg`) y todas las
  animaciones/transiciones se reducen a `0.01ms` (regla global en `globals.css`).
- El indicador en vivo usa `animate-ping` con `motion-reduce:hidden`.

> Nota abierta: el video dura 10 s pero el temporizador lo cierra a los 2 s (ver UX-SPEC §9).

### 6.1 Asset de la intro

`apps/web/public/brand/logo-animated.mp4`: 960×540, H.264, 24 fps, 10 s, sin pista de audio,
`faststart` (659 KB). El master es 1920×1080 con audio y vive fuera del repo.

Para regenerar el asset web desde el master:

```bash
ffmpeg -i master-1080p.mp4 \
  -vf "scale=960:-2" \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p \
  -an -movflags +faststart \
  apps/web/public/brand/logo-animated.mp4
```

## 7. Accesibilidad

- `:focus-visible` global con outline de 2 px cian y offset 2 px.
- Objetivos táctiles mínimos: 44×44 px en botones primarios y 32×32 px en iconos compactos.
- Iconografía decorativa con `aria-hidden="true"`; los controles icónicos llevan `aria-label`.
- Paneles laterales con `role="dialog"`, `aria-modal` y título asociado (`aria-labelledby`).
- La tabla expone `role="region"` con `aria-label` y `tabIndex={0}` para scroll por teclado.
- Contraste: texto principal `neutral-900` sobre `surface-card`; textos secundarios
  `neutral-500` (usar `neutral-600` sobre fondos tintados).

## 8. Reglas duras

1. **Nunca** colores hex en componentes: solo `var(--color-…)`.
2. **Nunca** calcular dinero en el cliente: `feeMiruCents` llega `null` en demo y se muestra
   «—»; el fee vive en la base de datos (D-05).
3. Montos siempre con `formatCOP` de `@miru/shared` (centavos → string).
4. Estados de dominio siempre con `StatusChip` (no spans ad-hoc).
5. Cada lista nueva implementa los 4 estados de `DataTable`.
