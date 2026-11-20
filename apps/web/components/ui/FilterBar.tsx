import React from "react";
import type { Plataforma } from "@/src/data/data-source";

export interface FilterBarProps {
  selectedPlatforms: Plataforma[];
  onTogglePlatform: (p: Plataforma) => void;
  selectedStatus: string;
  onChangeStatus: (s: string) => void;
  statusOptions: Array<{ value: string; label: string }>;
  onClear: () => void;
  hasActiveFilters?: boolean;
}

const PLATFORMS: Plataforma[] = ["Dropi", "MasterShop", "Effi"];

export function FilterBar({
  selectedPlatforms,
  onTogglePlatform,
  selectedStatus,
  onChangeStatus,
  statusOptions,
  onClear,
  hasActiveFilters = false,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Platform Multi-select Buttons */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Filtrar por plataforma"
      >
        {PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform);
          return (
            <button
              key={platform}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onTogglePlatform(platform)}
              className={`inline-flex min-h-[44px] md:min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isSelected
                    ? "bg-white"
                    : platform === "Dropi"
                      ? "bg-[var(--color-plataforma-dropi-dot)]"
                      : platform === "MasterShop"
                        ? "bg-[#059669]"
                        : "bg-[#0284C7]"
                }`}
                aria-hidden="true"
              />
              <span>{platform}</span>
            </button>
          );
        })}
      </div>

      {/* Status Dropdown */}
      <div className="relative">
        <label htmlFor="miru-status-filter" className="sr-only">
          Filtrar por estado
        </label>
        <select
          id="miru-status-filter"
          value={selectedStatus}
          onChange={(e) => onChangeStatus(e.target.value)}
          className="min-h-[44px] md:min-h-[36px] rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-neutral-900)] focus:border-[var(--color-accent-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)]/30 cursor-pointer"
        >
          <option value="todos">Todos los estados</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-[44px] md:min-h-[36px] items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] cursor-pointer transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span>Limpiar filtros</span>
        </button>
      )}
    </div>
  );
}
