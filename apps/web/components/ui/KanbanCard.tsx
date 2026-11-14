import React from "react";
import { formatCOP } from "@miru/shared";
import type { OrderStatus, WarrantyStatus } from "@miru/shared";
import type { Plataforma } from "@/src/data/data-source";
import { StatusChip } from "./StatusChip";

export interface KanbanCardProps {
  id: string;
  title: string;
  subtitle?: string;
  metaLine?: string;
  amountCents: number;
  plataforma?: Plataforma;
  status: OrderStatus | WarrantyStatus;
  domain: "pedido" | "garantia";
  onInspect: () => void;
  quickActionLabel?: string;
  onQuickAction?: () => void;
}

export function KanbanCard({
  id,
  title,
  subtitle,
  metaLine,
  amountCents,
  plataforma,
  status,
  domain,
  onInspect,
  quickActionLabel,
  onQuickAction,
}: KanbanCardProps) {
  return (
    <article className="group rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-3.5 shadow-[var(--shadow-level-1)] space-y-2.5 transition-all hover:border-[var(--color-border-interactive)] hover:shadow-[var(--shadow-level-2)]">
      {/* Top Header: ID & Chips */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onInspect}
          className="font-mono text-xs font-semibold text-[var(--color-neutral-600)] hover:text-[var(--color-primary)] hover:underline cursor-pointer"
        >
          {id}
        </button>
        <div className="flex items-center gap-1.5">
          {plataforma && <StatusChip domain="plataforma" status={plataforma} size="sm" />}
          <StatusChip domain={domain} status={status} size="sm" />
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="cursor-pointer" onClick={onInspect}>
        <h4 className="text-sm font-semibold text-[var(--color-neutral-900)] leading-tight group-hover:text-[var(--color-primary)] transition-colors">
          {title}
        </h4>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[var(--color-neutral-600)] truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* MetaLine (e.g. City · Carrier) */}
      {metaLine && (
        <p className="text-xs text-[var(--color-neutral-500)] flex items-center gap-1">
          <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{metaLine}</span>
        </p>
      )}

      {/* Bottom Footer: Amount & Quick Action */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--color-neutral-100)]">
        <div>
          <span className="text-[10px] uppercase font-semibold text-[var(--color-neutral-400)] tracking-wider">
            Total COP
          </span>
          <p className="font-display text-sm font-bold text-[var(--color-neutral-900)] tabular-nums">
            {formatCOP(amountCents)}
          </p>
        </div>

        {quickActionLabel && onQuickAction && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction();
            }}
            className="inline-flex min-h-[36px] items-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-subdued)] px-2.5 py-1 text-xs font-semibold text-[var(--color-neutral-800)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer"
          >
            {quickActionLabel}
          </button>
        )}
      </div>
    </article>
  );
}
