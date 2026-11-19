import { describe, expect, it } from "vitest";

import { bogotaDayKey, bogotaDayRange, computeDailyTotals } from "../src/metrics.js";

describe("computeDailyTotals", () => {
  it("suma ventas y fee de todos los no cancelados y utilidad de entregados − devueltos", () => {
    const totals = computeDailyTotals([
      { estado: "entregado", subtotalCents: 3_000_000, feeMiruCents: 150_000 },
      { estado: "devuelto", subtotalCents: 1_299_900, feeMiruCents: 64_995 },
      { estado: "pendiente", subtotalCents: 500_000, feeMiruCents: 25_000 },
      { estado: "cancelado", subtotalCents: 900_000, feeMiruCents: 45_000 },
    ]);

    expect(totals.ventasBrutasCents).toBe(3_000_000 + 1_299_900 + 500_000);
    expect(totals.feeMiruCents).toBe(150_000 + 64_995 + 25_000);
    expect(totals.utilidadNetaCents).toBe(150_000 - 64_995);
    expect(totals.pedidosTotal).toBe(4);
    expect(totals.entregados).toBe(1);
    expect(totals.devueltos).toBe(1);
  });

  it("sin pedidos devuelve ceros", () => {
    expect(computeDailyTotals([])).toEqual({
      ventasBrutasCents: 0,
      feeMiruCents: 0,
      utilidadNetaCents: 0,
      pedidosTotal: 0,
      entregados: 0,
      devueltos: 0,
    });
  });
});

describe("bogotaDayKey / bogotaDayRange", () => {
  it("usa el día calendario de Bogotá, no el de UTC", () => {
    // 2026-11-20T02:00Z = 2026-11-19 21:00 en Bogotá
    expect(bogotaDayKey(new Date("2026-11-20T02:00:00Z"))).toBe("2026-11-19");
  });

  it("calcula el rango del día con offset -05:00", () => {
    expect(bogotaDayRange("2026-11-19")).toEqual({
      startIso: "2026-11-19T00:00:00-05:00",
      endIso: "2026-11-20T00:00:00-05:00",
    });
  });

  it("cruza fin de mes correctamente", () => {
    expect(bogotaDayRange("2026-12-31").endIso).toBe("2027-01-01T00:00:00-05:00");
  });
});
