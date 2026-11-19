import type {
  ConnectionRecord,
  DataSource,
  DataSourceState,
  FinanceSummary,
  KpiSummary,
  OrderRecord,
  ProductRecord,
  WarrantyRecord,
} from "./data-source";

/**
 * Fixtures DEMO estáticos para desarrollo y pruebas visuales (Punto de intercambio P8b).
 * Todos los importes están estrictamente en CENTAVOS ENTEROS (COP * 100).
 * REGLA ABSOLUTA: Prohibido calcular el fee Miru, la utilidad neta o tasas en el cliente.
 */

export const DEMO_ORDERS: OrderRecord[] = [
  {
    id: "MRU-8421",
    externalId: "DP-104921",
    guia: "CO-994120581",
    cliente: "Camila Restrepo",
    telefono: "310 555 0142",
    ciudad: "Medellín",
    producto: "Lámpara Escritorio LED Recargable",
    unidades: 2,
    plataforma: "Dropi",
    transportadora: "Coordinadora",
    valorTotalCents: 16800000, // $168.000 COP
    costoFleteCents: 1450000,  // $14.500 COP
    utilidadNetaCents: 6150000, // $61.500 COP (Estático, no calculado)
    estado: "en_transito",
    fechaCreacion: "2026-11-13T11:20:00-05:00",
    items: [
      {
        sku: "LAMP-LED-01",
        nombre: "Lámpara Escritorio LED Recargable",
        unidades: 2,
        precioUnitarioCents: 8400000,
      },
    ],
    historial: [
      { timestamp: "13 nov · 11:20", titulo: "Pedido sincronizado desde Dropi", ubicacion: "Bogotá D.C." },
      { timestamp: "13 nov · 13:05", titulo: "Despachado en bodega central", ubicacion: "Funza, Cundinamarca" },
      { timestamp: "13 nov · 16:40", titulo: "En ruta hacia centro de distribución", ubicacion: "Medellín, Antioquia" },
    ],
  },
  {
    id: "MRU-8422",
    externalId: "MS-883109",
    guia: "MS-773104920",
    cliente: "Andrés Mendoza",
    telefono: "320 555 0198",
    ciudad: "Bogotá D.C.",
    producto: "Organizador Modular Cocina 4 Niveles",
    unidades: 1,
    plataforma: "MasterShop",
    transportadora: "Servientrega",
    valorTotalCents: 12990000, // $129.900 COP
    costoFleteCents: 1180000,  // $11.800 COP
    utilidadNetaCents: 4810000, // $48.100 COP (Estático)
    estado: "entregado",
    fechaCreacion: "2026-11-12T09:45:00-05:00",
    items: [
      {
        sku: "ORG-COC-04",
        nombre: "Organizador Modular Cocina 4 Niveles",
        unidades: 1,
        precioUnitarioCents: 12990000,
      },
    ],
    historial: [
      { timestamp: "12 nov · 09:45", titulo: "Pedido creado en MasterShop", ubicacion: "Bogotá D.C." },
      { timestamp: "12 nov · 14:10", titulo: "En camino al destino final", ubicacion: "Bogotá D.C." },
      { timestamp: "13 nov · 10:15", titulo: "Entregado a satisfacción", ubicacion: "Bogotá D.C." },
    ],
  },
  {
    id: "MRU-8423",
    externalId: "EF-449120",
    guia: "EF-551029411",
    cliente: "Valentina Rojas",
    telefono: "315 555 0833",
    ciudad: "Cali",
    producto: "Set Masajeador Percusión Portátil",
    unidades: 1,
    plataforma: "Effi",
    transportadora: "Interrapidísimo",
    valorTotalCents: 18500000, // $185.000 COP
    costoFleteCents: 1620000,  // $16.200 COP
    utilidadNetaCents: 7200000, // $72.000 COP (Estático)
    estado: "novedad",
    fechaCreacion: "2026-11-13T08:15:00-05:00",
    novedadDetalle: "Dirección incompleta según la transportadora. Cliente pendiente de confirmar datos de nomenclatura.",
    items: [
      {
        sku: "MAS-PORT-01",
        nombre: "Set Masajeador Percusión Portátil",
        unidades: 1,
        precioUnitarioCents: 18500000,
      },
    ],
    historial: [
      { timestamp: "13 nov · 08:15", titulo: "Orden recibida vía webhook Effi", ubicacion: "Cali, Valle" },
      { timestamp: "13 nov · 11:50", titulo: "Primer intento de entrega fallido", ubicacion: "Cali, Valle" },
      { timestamp: "13 nov · 14:00", titulo: "Novedad registrada: nomenclatura incompleta", ubicacion: "Cali, Valle" },
    ],
  },
  {
    id: "MRU-8424",
    externalId: "DP-104922",
    guia: "CO-994120599",
    cliente: "Juan Pablo Gómez",
    telefono: "301 555 0772",
    ciudad: "Barranquilla",
    producto: "Mini Proyector Cine en Casa Full HD",
    unidades: 1,
    plataforma: "Dropi",
    transportadora: "Envía",
    valorTotalCents: 34000000, // $340.000 COP
    costoFleteCents: 1850000,  // $18.500 COP
    utilidadNetaCents: 12800000, // $128.000 COP (Estático)
    estado: "confirmado",
    fechaCreacion: "2026-11-13T14:30:00-05:00",
    items: [
      {
        sku: "PROY-FHD-02",
        nombre: "Mini Proyector Cine en Casa Full HD",
        unidades: 1,
        precioUnitarioCents: 34000000,
      },
    ],
    historial: [
      { timestamp: "13 nov · 14:30", titulo: "Pago anticipado validado", ubicacion: "Barranquilla, Atlántico" },
      { timestamp: "13 nov · 15:10", titulo: "Rotulado e ingresado a zona de empaque", ubicacion: "Barranquilla, Atlántico" },
    ],
  },
  {
    id: "MRU-8425",
    externalId: "MS-883110",
    guia: "MS-773104955",
    cliente: "Daniela Castro",
    telefono: "317 555 0311",
    ciudad: "Bucaramanga",
    producto: "Dispensador Automático Mascotas Smart",
    unidades: 1,
    plataforma: "MasterShop",
    transportadora: "Servientrega",
    valorTotalCents: 21500000, // $215.000 COP
    costoFleteCents: 1540000,  // $15.400 COP
    utilidadNetaCents: 8120000, // $81.200 COP (Estático)
    estado: "pendiente",
    fechaCreacion: "2026-11-13T15:05:00-05:00",
    items: [
      {
        sku: "DISP-PET-01",
        nombre: "Dispensador Automático Mascotas Smart",
        unidades: 1,
        precioUnitarioCents: 21500000,
      },
    ],
    historial: [
      { timestamp: "13 nov · 15:05", titulo: "Pedido registrado por el cliente", ubicacion: "Bucaramanga, Santander" },
    ],
  },
  {
    id: "MRU-8426",
    externalId: "EF-449121",
    guia: "EF-551029480",
    cliente: "Sebastián Beltrán",
    telefono: "311 555 0644",
    ciudad: "Pereira",
    producto: "Kit Pulido y Cuidado Automotriz",
    unidades: 1,
    plataforma: "Effi",
    transportadora: "Coordinadora",
    valorTotalCents: 11000000, // $110.000 COP
    costoFleteCents: 1320000,  // $13.200 COP
    utilidadNetaCents: 3950000, // $39.500 COP (Estático)
    estado: "devuelto",
    fechaCreacion: "2026-11-10T10:00:00-05:00",
    novedadDetalle: "Devuelto por desistimiento del comprador en el momento de la entrega.",
    items: [
      {
        sku: "KIT-AUTO-03",
        nombre: "Kit Pulido y Cuidado Automotriz",
        unidades: 1,
        precioUnitarioCents: 11000000,
      },
    ],
    historial: [
      { timestamp: "10 nov · 10:00", titulo: "Despacho creado en Effi", ubicacion: "Pereira, Risaralda" },
      { timestamp: "12 nov · 15:40", titulo: "Cliente rechaza el paquete", ubicacion: "Pereira, Risaralda" },
      { timestamp: "13 nov · 09:20", titulo: "En proceso de retorno a origen", ubicacion: "Pereira, Risaralda" },
    ],
  },
  {
    id: "MRU-8427",
    externalId: "DP-104923",
    guia: "CO-994120612",
    cliente: "Paola Andrea Cruz",
    telefono: "318 555 0955",
    ciudad: "Cartagena",
    producto: "Depiladora Láser IPL Doméstica",
    unidades: 1,
    plataforma: "Dropi",
    transportadora: "Interrapidísimo",
    valorTotalCents: 24500000, // $245.000 COP
    costoFleteCents: 1780000,  // $17.800 COP
    utilidadNetaCents: 9600000, // $96.000 COP (Estático)
    estado: "cancelado",
    fechaCreacion: "2026-11-11T12:00:00-05:00",
    novedadDetalle: "Cancelado por el cliente antes de generación de guía.",
    items: [
      {
        sku: "DEP-IPL-01",
        nombre: "Depiladora Láser IPL Doméstica",
        unidades: 1,
        precioUnitarioCents: 24500000,
      },
    ],
    historial: [
      { timestamp: "11 nov · 12:00", titulo: "Orden registrada", ubicacion: "Cartagena, Bolívar" },
      { timestamp: "11 nov · 12:45", titulo: "Cancelación solicitada por usuario", ubicacion: "Cartagena, Bolívar" },
    ],
  },
];

export const DEMO_WARRANTIES: WarrantyRecord[] = [
  {
    id: "GAR-201",
    pedidoId: "MRU-8419",
    cliente: "Felipe Serrano",
    telefono: "313 555 0212",
    ciudad: "Manizales",
    producto: "Audífonos Inalámbricos Cancelación de Ruido",
    plataforma: "Dropi",
    montoSolicitadoCents: 14900000, // $149.000 COP
    motivo: "El auricular izquierdo no carga en el estuche tras 3 días de uso.",
    estado: "solicitada",
    fechaSolicitud: "2026-11-13T09:10:00-05:00",
    resolucionNota: "Evidencia fotográfica adjunta en solicitud inicial.",
  },
  {
    id: "GAR-202",
    pedidoId: "MRU-8415",
    cliente: "Mariana Duarte",
    telefono: "300 555 0891",
    ciudad: "Bogotá D.C.",
    producto: "Humidificador Ultrasónico Aromaterapia",
    plataforma: "MasterShop",
    montoSolicitadoCents: 8990000, // $89.900 COP
    motivo: "Fuga de agua por la base del tanque durante el primer encendido.",
    estado: "en_revision",
    fechaSolicitud: "2026-11-12T14:30:00-05:00",
    resolucionNota: "En validación con el área técnica de MasterShop.",
  },
  {
    id: "GAR-203",
    pedidoId: "MRU-8408",
    cliente: "Carlos Henao",
    telefono: "316 555 0456",
    ciudad: "Medellín",
    producto: "Reloj Inteligente Deportivo Pro 5",
    plataforma: "Effi",
    montoSolicitadoCents: 19500000, // $195.000 COP
    motivo: "Pantalla táctil no responde después de actualización.",
    estado: "aprobada",
    fechaSolicitud: "2026-11-11T16:00:00-05:00",
    resolucionNota: "Aprobado reemplazo de unidad física por defecto de fábrica.",
  },
  {
    id: "GAR-204",
    pedidoId: "MRU-8395",
    cliente: "Lorena Pinzón",
    telefono: "312 555 0732",
    ciudad: "Ibagué",
    producto: "Batidora Portátil Recargable USB",
    plataforma: "Dropi",
    montoSolicitadoCents: 7500000, // $75.000 COP
    motivo: "Golpe visible en la estructura por caída accidental del cliente.",
    estado: "rechazada",
    fechaSolicitud: "2026-11-09T11:20:00-05:00",
    resolucionNota: "Garantía rechazada: daño físico no cubierto por garantía del fabricante.",
  },
  {
    id: "GAR-205",
    pedidoId: "MRU-8390",
    cliente: "Guillermo Pardo",
    telefono: "314 555 0918",
    ciudad: "Villavicencio",
    producto: "Cámara de Seguridad WiFi Exterior 360",
    plataforma: "MasterShop",
    montoSolicitadoCents: 16500000, // $165.000 COP
    motivo: "Falla eléctrica del sensor nocturno confirmada por bodega.",
    estado: "reembolsada",
    fechaSolicitud: "2026-11-08T10:15:00-05:00",
    resolucionNota: "Reembolso procesado a través de saldo en cuenta de MasterShop.",
  },
];

export const DEMO_PRODUCTS: ProductRecord[] = [
  {
    id: "PRD-01",
    sku: "LAMP-LED-01",
    nombre: "Lámpara Escritorio LED Recargable",
    precioVentaCents: 8400000, // $84.000 COP
    costoUnitarioCents: 3800000, // $38.000 COP
    stock: 84,
    plataformas: ["Dropi", "MasterShop"],
    activo: true,
  },
  {
    id: "PRD-02",
    sku: "ORG-COC-04",
    nombre: "Organizador Modular Cocina 4 Niveles",
    precioVentaCents: 12990000, // $129.900 COP
    costoUnitarioCents: 6200000, // $62.000 COP
    stock: 42,
    plataformas: ["MasterShop"],
    activo: true,
  },
  {
    id: "PRD-03",
    sku: "MAS-PORT-01",
    nombre: "Set Masajeador Percusión Portátil",
    precioVentaCents: 18500000, // $185.000 COP
    costoUnitarioCents: 8900000, // $89.000 COP
    stock: 29,
    plataformas: ["Effi", "Dropi"],
    activo: true,
  },
  {
    id: "PRD-04",
    sku: "PROY-FHD-02",
    nombre: "Mini Proyector Cine en Casa Full HD",
    precioVentaCents: 34000000, // $340.000 COP
    costoUnitarioCents: 17500000, // $175.000 COP
    stock: 16,
    plataformas: ["Dropi", "MasterShop", "Effi"],
    activo: true,
  },
  {
    id: "PRD-05",
    sku: "DISP-PET-01",
    nombre: "Dispensador Automático Mascotas Smart",
    precioVentaCents: 21500000, // $215.000 COP
    costoUnitarioCents: 10500000, // $105.000 COP
    stock: 31,
    plataformas: ["MasterShop"],
    activo: true,
  },
];

export const DEMO_CONNECTIONS: ConnectionRecord[] = [
  {
    id: "conn-dropi",
    plataforma: "Dropi",
    estado: "activa",
    ultimoEvento: "Hace 4 minutos",
    eventosHoy: 142,
    webhookUrl: "https://api.miru.local/webhooks/dropi",
    versionContrato: "v1.0",
  },
  {
    id: "conn-mastershop",
    plataforma: "MasterShop",
    estado: "activa",
    ultimoEvento: "Hace 12 minutos",
    eventosHoy: 89,
    webhookUrl: "https://api.miru.local/webhooks/mastershop",
    versionContrato: "v1.0",
  },
  {
    id: "conn-effi",
    plataforma: "Effi",
    estado: "activa",
    ultimoEvento: "Hace 18 minutos",
    eventosHoy: 64,
    webhookUrl: "https://api.miru.local/webhooks/effi",
    versionContrato: "v1.0",
  },
];

export const DEMO_KPIS: KpiSummary = {
  ventasBrutasCents: 428900000, // $4.289.000 COP
  feeMiruCents: null,           // OBLIGATORIO: null en demo, se muestra como "—"
  costoFletesCents: 38240000,   // $382.400 COP
  utilidadNetaCents: 184210000, // $1.842.100 COP (Sin palabra "estimada")
  pedidosTotal: 142,
  entregados: 118,
  devueltos: 9,
  garantiasAbiertas: 5,
  tasaEntregaEfectiva: null,    // OBLIGATORIO: null en demo, se muestra como "—"
  despachosVsEntregados7d: [
    { dia: "Lun", despachados: 18, entregados: 15 },
    { dia: "Mar", despachados: 22, entregados: 19 },
    { dia: "Mié", despachados: 25, entregados: 21 },
    { dia: "Jue", despachados: 20, entregados: 18 },
    { dia: "Vie", despachados: 28, entregados: 24 },
    { dia: "Sáb", despachados: 16, entregados: 14 },
    { dia: "Dom", despachados: 13, entregados: 7 },
  ],
  participacionPlataforma: [
    { plataforma: "Dropi", pedidos: 68, porcentaje: 48 },
    { plataforma: "MasterShop", pedidos: 46, porcentaje: 32 },
    { plataforma: "Effi", pedidos: 28, porcentaje: 20 },
  ],
  pedidosRequierenGestion: DEMO_ORDERS.filter(
    (o) => o.estado === "novedad" || o.estado === "pendiente",
  ),
};

export const DEMO_FINANCE: FinanceSummary = {
  ventasBrutasCents: 428900000,
  costoFletesCents: 38240000,
  utilidadNetaCents: 184210000,
  feeMiruCents: null,
  desglosePlataforma: [
    { plataforma: "Dropi", ventasCents: 205872000, fletesCents: 18355200, pedidos: 68 },
    { plataforma: "MasterShop", ventasCents: 137248000, fletesCents: 12236800, pedidos: 46 },
    { plataforma: "Effi", ventasCents: 85780000, fletesCents: 7648000, pedidos: 28 },
  ],
};

function handleStateCheck(state?: DataSourceState): void {
  if (state === "error") {
    throw new Error("Fallo de demostración: error forzado mediante ?state=error.");
  }
}

export class DemoDataSource implements DataSource {
  async getKpis(state?: DataSourceState): Promise<KpiSummary> {
    handleStateCheck(state);
    if (state === "empty") {
      return {
        ventasBrutasCents: 0,
        feeMiruCents: null,
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
    }
    return DEMO_KPIS;
  }

  async getOrders(state?: DataSourceState): Promise<OrderRecord[]> {
    handleStateCheck(state);
    if (state === "empty") {
      return [];
    }
    return DEMO_ORDERS;
  }

  async getWarranties(state?: DataSourceState): Promise<WarrantyRecord[]> {
    handleStateCheck(state);
    if (state === "empty") {
      return [];
    }
    return DEMO_WARRANTIES;
  }

  async getProducts(state?: DataSourceState): Promise<ProductRecord[]> {
    handleStateCheck(state);
    if (state === "empty") {
      return [];
    }
    return DEMO_PRODUCTS;
  }

  async getFinanceSummary(state?: DataSourceState): Promise<FinanceSummary> {
    handleStateCheck(state);
    if (state === "empty") {
      return {
        ventasBrutasCents: 0,
        costoFletesCents: 0,
        utilidadNetaCents: 0,
        feeMiruCents: null,
        desglosePlataforma: [],
      };
    }
    return DEMO_FINANCE;
  }

  async getConnections(state?: DataSourceState): Promise<ConnectionRecord[]> {
    handleStateCheck(state);
    if (state === "empty") {
      return [];
    }
    return DEMO_CONNECTIONS;
  }
}

export const demoDataSource = new DemoDataSource();
