import { describe, expect, it } from "vitest";

import { classifyRotation } from "../src/server/rotation";

describe("classifyRotation (ABC por Pareto)", () => {
  it("sin ventas no clasifica nada", () => {
    expect(classifyRotation([]).size).toBe(0);
    expect(classifyRotation([{ sku: "A", units: 0 }]).size).toBe(0);
  });

  it("un único producto con ventas es A", () => {
    const result = classifyRotation([{ sku: "UNICO", units: 40 }]);
    expect(result.get("UNICO")).toBe("A");
  });

  it("reparte 80 / 15 / 5 por unidades acumuladas", () => {
    const result = classifyRotation([
      { sku: "P1", units: 50 },
      { sku: "P2", units: 30 },
      { sku: "P3", units: 15 },
      { sku: "P4", units: 5 },
    ]);

    expect(result.get("P1")).toBe("A");
    expect(result.get("P2")).toBe("A");
    expect(result.get("P3")).toBe("B");
    expect(result.get("P4")).toBe("C");
  });

  it("pone los productos sin ventas en C", () => {
    const result = classifyRotation([
      { sku: "P1", units: 9 },
      { sku: "P2", units: 1 },
      { sku: "P3", units: 0 },
    ]);

    expect(result.get("P1")).toBe("A");
    expect(result.get("P2")).toBe("B");
    expect(result.get("P3")).toBe("C");
  });

  it("es determinista con empates", () => {
    const rows = [
      { sku: "B", units: 10 },
      { sku: "A", units: 10 },
    ];

    // Ambos son el 50 % de las unidades: los dos son A, en orden alfabético.
    expect([...classifyRotation(rows).entries()]).toEqual([
      ["A", "A"],
      ["B", "A"],
    ]);
  });
});
