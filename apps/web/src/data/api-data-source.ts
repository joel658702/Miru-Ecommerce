import type {
  ConnectionRecord,
  DataSource,
  DataSourceState,
  FinancePeriod,
  FinanceSummary,
  KpiSummary,
  OrderRecord,
  ProductRecord,
  WarrantyRecord,
} from "./data-source";

const EMPTY_KPIS: KpiSummary = {
  ventasBrutasCents: 0,
  feeMiruCents: 0,
  costoFletesCents: 0,
  utilidadNetaCents: 0,
  pedidosTotal: 0,
  entregados: 0,
  devueltos: 0,
  garantiasAbiertas: 0,
  tasaEntregaEfectiva: null,
  despachosVsEntregados7d: [],
  participacionPlataforma: [],
  pedidosRequierenGestion: [],
};

const EMPTY_FINANCE: FinanceSummary = {
  ventasBrutasCents: 0,
  costoFletesCents: 0,
  utilidadNetaCents: 0,
  feeMiruCents: 0,
  desglosePlataforma: [],
};

function messageForStatus(status: number): string {
  if (status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  if (status === 503) return "La base de datos no está configurada.";
  return "No se pudieron cargar los datos.";
}

/**
 * Origen de datos real: consulta `/api/data/*`, que responde con la sesión del
 * operador y aplica RLS. Mantiene la misma interfaz `DataSource` que el demo.
 */
export class ApiDataSource implements DataSource {
  private async request<T>(resource: string, query?: string): Promise<T> {
    const url = query === undefined ? `/api/data/${resource}` : `/api/data/${resource}?${query}`;
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(messageForStatus(response.status));
    }

    return (await response.json()) as T;
  }

  private static checkState(state?: DataSourceState): boolean {
    if (state === "error") {
      throw new Error("No fue posible consultar los datos. Reintenta en un momento.");
    }
    return state === "empty";
  }

  async getKpis(state?: DataSourceState): Promise<KpiSummary> {
    if (ApiDataSource.checkState(state)) return EMPTY_KPIS;
    return this.request<KpiSummary>("kpis");
  }

  async getOrders(state?: DataSourceState): Promise<OrderRecord[]> {
    if (ApiDataSource.checkState(state)) return [];
    return this.request<OrderRecord[]>("orders");
  }

  async getWarranties(state?: DataSourceState): Promise<WarrantyRecord[]> {
    if (ApiDataSource.checkState(state)) return [];
    return this.request<WarrantyRecord[]>("warranties");
  }

  async getProducts(state?: DataSourceState): Promise<ProductRecord[]> {
    if (ApiDataSource.checkState(state)) return [];
    return this.request<ProductRecord[]>("products");
  }

  async getFinanceSummary(
    state?: DataSourceState,
    period: FinancePeriod = "mes",
  ): Promise<FinanceSummary> {
    if (ApiDataSource.checkState(state)) return EMPTY_FINANCE;
    return this.request<FinanceSummary>("finance", `periodo=${period}`);
  }

  async getConnections(state?: DataSourceState): Promise<ConnectionRecord[]> {
    if (ApiDataSource.checkState(state)) return [];
    return this.request<ConnectionRecord[]>("connections");
  }
}

export const apiDataSource = new ApiDataSource();
