import { describe, expect, it } from "vitest";

import { assertCents, formatCOP, pesosToCents } from "../src/money.js";

describe("pesosToCents", () => {
  it.each([
    ["89900", 8990000],
    ["1.234.567", 123456700],
    ["89900,5", 8990050],
    ["1.234,56", 123456],
  ])("acepta %s y devuelve %i centavos", (input, expected) => {
    expect(pesosToCents(input)).toBe(expected);
  });

  it.each([
    "89900.50", // punto decimal: ambiguo con separador de miles
    "1,234", // coma con 3 dígitos: decimal de más de 2
    "89900,555", // más de 2 decimales
    "1.2345,6", // grupos de miles mal formados
    "-1", // negativo
    "-1.000", // negativo con separador
    "", // vacío
    "abc", // no numérico
    "1.234.567.890.123.456.789", // excede MAX_SAFE_INTEGER
  ])("rechaza %j lanzando RangeError", (input) => {
    expect(() => pesosToCents(input)).toThrow(RangeError);
  });
});

describe("assertCents", () => {
  it("acepta enteros de centavos válidos", () => {
    expect(() => assertCents(0)).not.toThrow();
    expect(() => assertCents(8990000)).not.toThrow();
    expect(() => assertCents(Number.MAX_SAFE_INTEGER)).not.toThrow();
  });

  it.each([
    ["1.5", 1.5],
    ["-1", -1],
    ["NaN", Number.NaN],
    ["MAX_SAFE_INTEGER + 1", Number.MAX_SAFE_INTEGER + 1],
  ])("rechaza %s lanzando RangeError", (_label, value) => {
    expect(() => assertCents(value)).toThrow(RangeError);
  });
});

describe("formatCOP", () => {
  it("omite decimales cuando el monto es múltiplo de 100 centavos", () => {
    const formatted = formatCOP(8990000);
    expect(formatted).toContain("89.900");
    expect(formatted).not.toContain(",");
  });

  it("muestra 2 decimales cuando hay centavos", () => {
    expect(formatCOP(8990050)).toContain("89.900,50");
    expect(formatCOP(1)).toContain("0,01");
  });

  it("formatea cero", () => {
    expect(formatCOP(0)).toContain("0");
  });
});
