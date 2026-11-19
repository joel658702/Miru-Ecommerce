/**
 * Rotación A/B/C por unidades vendidas (análisis ABC tipo Pareto):
 *
 *   A → el grupo que acumula hasta el 80 % de las unidades
 *   B → el siguiente tramo hasta el 95 %
 *   C → el resto (cola de baja rotación)
 *
 * Se clasifica por unidades, no por dinero: la rotación mide movimiento.
 * Las unidades llegan de `order_items` de pedidos no cancelados del período.
 */

import type { RotationClass } from "@/src/data/data-source";

export interface RotationInput {
  sku: string;
  units: number;
}

export function classifyRotation(rows: RotationInput[]): Map<string, RotationClass> {
  const result = new Map<string, RotationClass>();
  const total = rows.reduce((sum, row) => sum + row.units, 0);

  if (total <= 0) {
    return result;
  }

  const sorted = [...rows].sort((a, b) => b.units - a.units || a.sku.localeCompare(b.sku));

  let cumulative = 0;

  for (const row of sorted) {
    const before = cumulative / total;
    cumulative += row.units;

    const rotation: RotationClass = before < 0.8 ? "A" : before < 0.95 ? "B" : "C";
    result.set(row.sku, rotation);
  }

  return result;
}
