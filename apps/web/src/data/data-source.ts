import type { OrderStatus, WarrantyStatus } from "@miru/shared";

export type { OrderStatus, WarrantyStatus } from "@miru/shared";

export type Plataforma = "Dropi" | "MasterShop" | "Effi";

export type DataSourceState = "data" | "empty" | "loading" | "error";

export interface OrderItemRecord {
  sku: string;
  nombre: string;
  unidades: number;
  precioUnitarioCents: number;
}

export interface OrderHistoryRecord {
  timestamp: string;
  titulo: string;
  ubicacion: string;
}

export interface OrderRecord {
  id: string;
  externalId: string;
  guia: string;
  cliente: string;
  telefono: string;
  ciudad: string;
  producto: string;
  unidades: number;
  plataforma: Plataforma;
  transportadora: string;
  valorTotalCents: number;
  costoFleteCents: number;
  utilidadNetaCents: number;
  estado: OrderStatus;
  fechaCreacion: string;
  novedadDetalle?: string;
  items: OrderItemRecord[];
  historial: OrderHistoryRecord[];
}

export interface WarrantyRecord {
  id: string;
  pedidoId: string;
  cliente: string;
  telefono: string;
  ciudad: string;
  producto: string;
  plataforma: Plataforma;
  montoSolicitadoCents: number;
  motivo: string;
  estado: WarrantyStatus;
  fechaSolicitud: string;
  resolucionNota?: string;
}

export interface ProductRecord {
  id: string;
  sku: string;
  nombre: string;
  precioVentaCents: number;
  costoUnitarioCents: number;
  stock: number;
  plataformas: Plataforma[];
  activo: boolean;
}

export interface ChartDayRecord {
  dia: string;
  despachados: number;
  entregados: number;
}

export interface PlatformShareRecord {
  plataforma: Plataforma;
  pedidos: number;
  porcentaje: number;
}

export interface KpiSummary {
  ventasBrutasCents: number;
  feeMiruCents: number | null; // En demo: null (muestra "—", prohibido calcular en cliente)
  costoFletesCents: number;
  utilidadNetaCents: number; // Sin palabra "estimada"
  pedidosTotal: number;
  entregados: number;
  devueltos: number;
  garantiasAbiertas: number;
  tasaEntregaEfectiva: number | null; // En demo: null (muestra "—")
  despachosVsEntregados7d: ChartDayRecord[];
  participacionPlataforma: PlatformShareRecord[];
  pedidosRequierenGestion: OrderRecord[];
}

export interface PlatformFinanceBreakdown {
  plataforma: Plataforma;
  ventasCents: number;
  fletesCents: number;
  pedidos: number;
  /** Fee Miru sumado de la BD; `null` en el modo demo. */
  feeMiruCents?: number | null;
}

/** Período del balance financiero (P9): hoy, últimos 7 días o últimos 30. */
export type FinancePeriod = "hoy" | "semana" | "mes";

export const FINANCE_PERIODS: { value: FinancePeriod; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "7 días" },
  { value: "mes", label: "30 días" },
];

export interface FinanceSummary {
  ventasBrutasCents: number;
  costoFletesCents: number;
  utilidadNetaCents: number;
  feeMiruCents: number | null;
  desglosePlataforma: PlatformFinanceBreakdown[];
}

export interface ConnectionRecord {
  id: string;
  plataforma: Plataforma;
  estado: "activa" | "pausada" | "error";
  ultimoEvento: string;
  eventosHoy: number;
  webhookUrl: string;
  versionContrato: string;
}

/**
 * Interfaz unificada de acceso a datos para Miru-Ecommerce (Punto de intercambio para P8b).
 */
export interface DataSource {
  getKpis(state?: DataSourceState): Promise<KpiSummary>;
  getOrders(state?: DataSourceState): Promise<OrderRecord[]>;
  getWarranties(state?: DataSourceState): Promise<WarrantyRecord[]>;
  getProducts(state?: DataSourceState): Promise<ProductRecord[]>;
  getFinanceSummary(state?: DataSourceState, period?: FinancePeriod): Promise<FinanceSummary>;
  getConnections(state?: DataSourceState): Promise<ConnectionRecord[]>;
  /** Cambia el estado de una garantía (el flujo válido lo valida el servidor). */
  updateWarrantyStatus(id: string, estado: WarrantyStatus, nota?: string): Promise<WarrantyRecord>;
}
