import React from "react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar por pedido, guía o cliente...",
  ariaLabel = "Buscar pedidos o registros",
  disabled = false,
}: SearchInputProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-neutral-400)]"
        aria-hidden="true"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="w-full min-h-[44px] md:min-h-[40px] rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] pl-9 pr-10 text-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-500)] focus:border-[var(--color-accent-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)]/30 disabled:cursor-not-allowed disabled:bg-[var(--color-neutral-100)] transition-colors"
      />

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-900)] cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
