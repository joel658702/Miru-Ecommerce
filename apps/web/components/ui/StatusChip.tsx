import React from "react";
import type { OrderStatus, WarrantyStatus } from "@miru/shared";
import type { Plataforma } from "@/src/data/data-source";

export type StatusChipDomain = "pedido" | "garantia" | "plataforma";

interface PedidoConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const PEDIDO_CONFIG: Record<OrderStatus, PedidoConfig> = {
  pendiente: {
    label: "Pendiente",
    bg: "bg-[var(--color-pedido-pendiente-bg)]",
    text: "text-[var(--color-pedido-pendiente-text)]",
    border: "border-[var(--color-pedido-pendiente-border)]",
    dot: "bg-[var(--color-pedido-pendiente-dot)]",
  },
  confirmado: {
    label: "Confirmado",
    bg: "bg-[var(--color-pedido-confirmado-bg)]",
    text: "text-[var(--color-pedido-confirmado-text)]",
    border: "border-[var(--color-pedido-confirmado-border)]",
    dot: "bg-[var(--color-pedido-confirmado-dot)]",
  },
  en_transito: {
    label: "En tránsito",
    bg: "bg-[var(--color-pedido-en-transito-bg)]",
    text: "text-[var(--color-pedido-en-transito-text)]",
    border: "border-[var(--color-pedido-en-transito-border)]",
    dot: "bg-[var(--color-pedido-en-transito-dot)]",
  },
  entregado: {
    label: "Entregado",
    bg: "bg-[var(--color-pedido-entregado-bg)]",
    text: "text-[var(--color-pedido-entregado-text)]",
    border: "border-[var(--color-pedido-entregado-border)]",
    dot: "bg-[var(--color-pedido-entregado-dot)]",
  },
  devuelto: {
    label: "Devuelto",
    bg: "bg-[var(--color-pedido-devuelto-bg)]",
    text: "text-[var(--color-pedido-devuelto-text)]",
    border: "border-[var(--color-pedido-devuelto-border)]",
    dot: "bg-[var(--color-pedido-devuelto-dot)]",
  },
  cancelado: {
    label: "Cancelado",
    bg: "bg-[var(--color-pedido-cancelado-bg)]",
    text: "text-[var(--color-pedido-cancelado-text)]",
    border: "border-[var(--color-pedido-cancelado-border)]",
    dot: "bg-[var(--color-pedido-cancelado-dot)]",
  },
  novedad: {
    label: "Novedad",
    bg: "bg-[var(--color-pedido-novedad-bg)]",
    text: "text-[var(--color-pedido-novedad-text)]",
    border: "border-[var(--color-pedido-novedad-border)]",
    dot: "bg-[var(--color-pedido-novedad-dot)]",
  },
};

const GARANTIA_CONFIG: Record<WarrantyStatus, PedidoConfig> = {
  solicitada: {
    label: "Solicitada",
    bg: "bg-[var(--color-garantia-solicitada-bg)]",
    text: "text-[var(--color-garantia-solicitada-text)]",
    border: "border-[var(--color-garantia-solicitada-border)]",
    dot: "bg-[var(--color-garantia-solicitada-dot)]",
  },
  en_revision: {
    label: "En revisión",
    bg: "bg-[var(--color-garantia-en-revision-bg)]",
    text: "text-[var(--color-garantia-en-revision-text)]",
    border: "border-[var(--color-garantia-en-revision-border)]",
    dot: "bg-[var(--color-garantia-en-revision-dot)]",
  },
  aprobada: {
    label: "Aprobada",
    bg: "bg-[var(--color-garantia-aprobada-bg)]",
    text: "text-[var(--color-garantia-aprobada-text)]",
    border: "border-[var(--color-garantia-aprobada-border)]",
    dot: "bg-[var(--color-garantia-aprobada-dot)]",
  },
  rechazada: {
    label: "Rechazada",
    bg: "bg-[var(--color-garantia-rechazada-bg)]",
    text: "text-[var(--color-garantia-rechazada-text)]",
    border: "border-[var(--color-garantia-rechazada-border)]",
    dot: "bg-[var(--color-garantia-rechazada-dot)]",
  },
  reembolsada: {
    label: "Reembolsada",
    bg: "bg-[var(--color-garantia-reembolsada-bg)]",
    text: "text-[var(--color-garantia-reembolsada-text)]",
    border: "border-[var(--color-garantia-reembolsada-border)]",
    dot: "bg-[var(--color-garantia-reembolsada-dot)]",
  },
};

const PLATAFORMA_CONFIG: Record<Plataforma, PedidoConfig> = {
  Dropi: {
    label: "Dropi",
    bg: "bg-[var(--color-plataforma-dropi-bg)]",
    text: "text-[var(--color-plataforma-dropi-text)]",
    border: "border-[var(--color-plataforma-dropi-border)]",
    dot: "bg-[var(--color-plataforma-dropi-dot)]",
  },
  MasterShop: {
    label: "MasterShop",
    bg: "bg-[var(--color-plataforma-mastershop-bg)]",
    text: "text-[var(--color-plataforma-mastershop-text)]",
    border: "border-[var(--color-plataforma-mastershop-border)]",
    dot: "bg-[var(--color-plataforma-mastershop-dot)]",
  },
  Effi: {
    label: "Effi",
    bg: "bg-[var(--color-plataforma-effi-bg)]",
    text: "text-[var(--color-plataforma-effi-text)]",
    border: "border-[var(--color-plataforma-effi-border)]",
    dot: "bg-[var(--color-plataforma-effi-dot)]",
  },
};

export interface StatusChipProps {
  domain: StatusChipDomain;
  status: OrderStatus | WarrantyStatus | Plataforma;
  size?: "sm" | "md";
}

export function StatusChip({ domain, status, size = "md" }: StatusChipProps) {
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] leading-[14px]"
      : "px-2.5 py-1 text-xs leading-4";

  if (domain === "pedido") {
    const config = PEDIDO_CONFIG[status as OrderStatus] ?? {
      label: String(status),
      bg: "bg-[var(--color-neutral-100)]",
      text: "text-[var(--color-neutral-700)]",
      border: "border-[var(--color-neutral-300)]",
      dot: "bg-[var(--color-neutral-500)]",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap shrink-0 ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
        <span>{config.label}</span>
      </span>
    );
  }

  if (domain === "garantia") {
    const config = GARANTIA_CONFIG[status as WarrantyStatus] ?? {
      label: String(status),
      bg: "bg-[var(--color-neutral-100)]",
      text: "text-[var(--color-neutral-700)]",
      border: "border-[var(--color-neutral-300)]",
      dot: "bg-[var(--color-neutral-500)]",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap shrink-0 ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
        <span>{config.label}</span>
      </span>
    );
  }

  const config = PLATAFORMA_CONFIG[status as Plataforma] ?? {
    label: String(status),
    bg: "bg-[var(--color-neutral-100)]",
    text: "text-[var(--color-neutral-700)]",
    border: "border-[var(--color-neutral-300)]",
    dot: "bg-[var(--color-neutral-500)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold whitespace-nowrap shrink-0 ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
