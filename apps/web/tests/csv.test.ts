import { describe, expect, it } from "vitest";

import { centsToDecimal, escapeCsvField, toCsv } from "../src/server/csv";

describe("escapeCsvField", () => {
  it("deja intactos los valores simples", () => {
    expect(escapeCsvField("Dropi")).toBe("Dropi");
    expect(escapeCsvField(42)).toBe("42");
  });

  it("entrecomilla cuando hay separador, comillas o saltos", () => {
    expect(escapeCsvField("Bogotá; Medellín")).toBe('"Bogotá; Medellín"');
    expect(escapeCsvField('Cliente "VIP"')).toBe('"Cliente ""VIP"""');
    expect(escapeCsvField("linea1\nlinea2")).toBe('"linea1\nlinea2"');
  });
});

describe("toCsv", () => {
  it("arma encabezados y filas separadas por punto y coma", () => {
    const csv = toCsv(
      ["sku", "venta"],
      [
        ["SKU-1", "168000,00"],
        ["SKU-2", "12999,00"],
      ],
    );

    expect(csv).toBe("sku;venta\r\nSKU-1;168000,00\r\nSKU-2;12999,00\r\n");
  });
});

describe("centsToDecimal", () => {
  it("convierte centavos a pesos con dos decimales", () => {
    expect(centsToDecimal(16_800_000)).toBe("168000,00");
    expect(centsToDecimal(1_299_900)).toBe("12999,00");
    expect(centsToDecimal(15_005)).toBe("150,05");
    expect(centsToDecimal(0)).toBe("0,00");
  });

  it("maneja negativos (utilidad de devueltos)", () => {
    expect(centsToDecimal(-64_995)).toBe("-649,95");
  });
});
