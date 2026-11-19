import type { WarrantyStatus } from "@miru/shared";

/**
 * Flujo operativo de una garantía (P9):
 *
 *   solicitada → en_revision → aprobada → reembolsada
 *   solicitada / en_revision → rechazada
 *
 * `rechazada` y `reembolsada` son terminales. La regla de cobro del fee en
 * devoluciones sigue DIFERIDA: cambiar el estado no calcula ni cobra nada.
 */
export const WARRANTY_NEXT_STATUSES: Record<WarrantyStatus, WarrantyStatus[]> = {
  solicitada: ["en_revision", "rechazada"],
  en_revision: ["aprobada", "rechazada"],
  aprobada: ["reembolsada"],
  rechazada: [],
  reembolsada: [],
};

export function nextWarrantyStatuses(from: WarrantyStatus): WarrantyStatus[] {
  return WARRANTY_NEXT_STATUSES[from];
}

export function canTransitionWarranty(from: WarrantyStatus, to: WarrantyStatus): boolean {
  return WARRANTY_NEXT_STATUSES[from].includes(to);
}

/** Un rechazo siempre debe explicar el motivo. */
export function requiresResolutionNote(to: WarrantyStatus): boolean {
  return to === "rechazada";
}
