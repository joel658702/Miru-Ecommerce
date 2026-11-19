import { describe, expect, it } from "vitest";

import { computeChart, computeFinance, computeShare, computeTotals } from "../src/server/aggregate";
import type { OrderFacts } from "../src/server/aggregate";

function facts(overrides: Partial<OrderFacts> = {}): OrderFacts {
  return {
    estado: "entregado",
    subtotalCents: 16_800_000,
    feeMiruCents: 840_000,
    plataforma: "Dropi",
    createdAt: "2026-11-19T09:00:00-05:00",
    updatedAt: "2026-11-19T12:00:00-05:00",
    ...overrides,
  };
}

describe("computeTotals", () => {
  it("ventas y fee de todos los no cancelados; utilidad solo de entregados − devueltos", () => {
    const totals = computeTotals([
      facts(),
      facts({ estado: "devuelto", subtotalCents: 1_299_900, feeMiruCents: 64_995 }),
      facts({ estado: "pendiente", subtotalCents: 3_000_000, feeMiruCents: 150_000 }),
      facts({ estado: "cancelado", subtotalCents: 999, feeMiruCents: 50 }),
    ]);

    expect(totals.ventasBrutasCents).toBe(16_800_000 + 1_299_900 + 3_000_000);
    expect(totals.feeMiruCents).toBe(840_000 + 64_995 + 150_000);
    expect(totals.utilidadNetaCents).toBe(840_000 - 64_995);
    expect(totals.costoFletesCents).toBe(0);
    expect(totals.pedidosTotal).toBe(4);
    expect(totals.entregados).toBe(1);
    expect(totals.devueltos).toBe(1);
    expect(totals.tasaEntregaEfectiva).toBe(50);
  });

  it("sin pedidos finalizados no inventa una tasa", () => {
    const totals = computeTotals([facts({ estado: "pendiente", feeMiruCents: 10 })]);

    expect(totals.tasaEntregaEfectiva).toBeNull();
    expect(totals.ventasBrutasCents).toBe(16_800_000);
    expect(totals.utilidadNetaCents).toBe(0);
  });
});

describe("computeChart", () => {
  it("agrupa los últimos 7 días en hora de Colombia", () => {
    const now = new Date("2026-11-19T15:00:00Z"); // 10:00 en Bogotá
    const chart = computeChart(
      [
        facts({ createdAt: "2026-11-19T09:00:00-05:00", updatedAt: "2026-11-19T12:00:00-05:00" }),
        facts({ createdAt: "2026-11-13T09:00:00-05:00", updatedAt: "2026-11-18T12:00:00-05:00" }),
        facts({ estado: "devuelto", createdAt: "2026-11-19T08:00:00-05:00" }),
      ],
      now,
    );

    expect(chart).toHaveLength(7);
    expect(chart[6]?.despachados).toBe(2);
    expect(chart[6]?.entregados).toBe(1);
    expect(chart[5]?.entregados).toBe(1);
  });
});

describe("computeShare", () => {
  it("reparte por plataforma y omite las que no tienen pedidos", () => {
    const share = computeShare([facts(), facts(), facts({ plataforma: "Effi" })]);

    expect(share).toEqual([
      { plataforma: "Dropi", pedidos: 2, porcentaje: 67 },
      { plataforma: "Effi", pedidos: 1, porcentaje: 33 },
    ]);
  });
});

describe("computeFinance", () => {
  it("muestra ventas y fee de todos los no cancelados, utilidad de entregados y sin fletes", () => {
    const finance = computeFinance([
      facts(),
      facts({ estado: "devuelto", feeMiruCents: 64_995, subtotalCents: 1_299_900 }),
    ]);

    expect(finance.ventasBrutasCents).toBe(16_800_000 + 1_299_900);
    expect(finance.feeMiruCents).toBe(840_000 + 64_995);
    expect(finance.utilidadNetaCents).toBe(775_005);
    expect(finance.costoFletesCents).toBe(0);
    expect(finance.desglosePlataforma).toEqual([
      { plataforma: "Dropi", ventasCents: 18_099_900, fletesCents: 0, pedidos: 2 },
    ]);
  });
});
