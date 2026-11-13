/**
 * Estados del contrato canónico Miru v1.
 * Los valores son exactamente los del dominio: no traducir ni renombrar.
 */

export const ORDER_STATUSES = [
  "pendiente",
  "confirmado",
  "en_transito",
  "entregado",
  "devuelto",
  "cancelado",
  "novedad",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const WARRANTY_STATUSES = [
  "solicitada",
  "en_revision",
  "aprobada",
  "rechazada",
  "reembolsada",
] as const;

export type WarrantyStatus = (typeof WARRANTY_STATUSES)[number];
