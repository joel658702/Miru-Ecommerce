import { describe, expect, it } from "vitest";

import { buildServer, isAuthorized } from "../src/app.js";
import { computeFinance, type FinanceRow, type McpRepository } from "../src/repository.js";
import { formatCop, periodStartIso } from "../src/tools.js";

const EMPTY_REPO: McpRepository = {
  listOrders: async () => [],
  getOrder: async () => null,
  listProducts: async () => [],
  listWarranties: async () => [],
  financeRows: async () => [],
};

describe("periodStartIso", () => {
  const now = new Date("2026-11-19T15:00:00.000Z"); // 10:00 en Bogotá

  it("hoy arranca a medianoche de Bogotá", () => {
    expect(periodStartIso("hoy", now)).toBe("2026-11-19T05:00:00.000Z");
  });

  it("la semana cubre 7 días incluido hoy", () => {
    expect(periodStartIso("semana", now)).toBe("2026-11-13T05:00:00.000Z");
  });

  it("el mes cubre 30 días incluido hoy", () => {
    expect(periodStartIso("mes", now)).toBe("2026-10-21T05:00:00.000Z");
  });
});

describe("computeFinance", () => {
  const rows: FinanceRow[] = [
    { estado: "entregado", subtotalCents: 8_400_000, feeCents: 420_000 },
    { estado: "devuelto", subtotalCents: 1_299_900, feeCents: 64_995 },
    { estado: "confirmado", subtotalCents: 500_000, feeCents: 25_000 },
    { estado: "cancelado", subtotalCents: 999_999, feeCents: 49_999 },
  ];

  it("suma ventas y fee de todos los no cancelados", () => {
    const summary = computeFinance(rows);
    expect(summary.ventasCents).toBe(8_400_000 + 1_299_900 + 500_000);
    expect(summary.feeCents).toBe(420_000 + 64_995 + 25_000);
    expect(summary.pedidos).toBe(3);
  });

  it("utilidad = fee de entregados menos fee de devueltos", () => {
    const summary = computeFinance(rows);
    expect(summary.utilidadCents).toBe(420_000 - 64_995);
    expect(summary.entregados).toBe(1);
    expect(summary.devueltos).toBe(1);
  });

  it("sin pedidos devuelve todo en cero", () => {
    expect(computeFinance([])).toEqual({
      ventasCents: 0,
      feeCents: 0,
      utilidadCents: 0,
      pedidos: 0,
      entregados: 0,
      devueltos: 0,
    });
  });
});

describe("formatCop", () => {
  it("convierte centavos a pesos sin float", () => {
    expect(formatCop(1_234_567)).toBe("$12.345,67");
    expect(formatCop(0)).toBe("$0,00");
    expect(formatCop(-64_995)).toBe("-$649,95");
  });
});

describe("isAuthorized", () => {
  it("acepta el token correcto", () => {
    expect(isAuthorized("Bearer secreto", "secreto")).toBe(true);
  });

  it("rechaza token ausente o distinto", () => {
    expect(isAuthorized(undefined, "secreto")).toBe(false);
    expect(isAuthorized("Bearer otro", "secreto")).toBe(false);
    expect(isAuthorized("Basic secreto", "secreto")).toBe(false);
  });
});

describe("buildServer", () => {
  it("expone /health", async () => {
    const app = buildServer(EMPTY_REPO, "token");
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, service: "mcp" });
    await app.close();
  });

  it("rechaza /mcp sin token", async () => {
    const app = buildServer(EMPTY_REPO, "token");
    const response = await app.inject({ method: "POST", url: "/mcp", payload: {} });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
