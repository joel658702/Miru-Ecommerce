"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isMoreActive =
    pathname.startsWith("/finanzas") ||
    pathname.startsWith("/conexiones") ||
    pathname.startsWith("/login");

  return (
    <>
      {/* "Más" Drawer Overlay */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 bg-[var(--color-surface-inverse)]/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="absolute bottom-16 inset-x-0 rounded-t-2xl border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-level-3)] space-y-2 animate-in slide-in-from-bottom-2 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-neutral-500)]">
                Más opciones
              </span>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                aria-label="Cerrar menú adicional"
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1">
              <Link
                href="/finanzas"
                onClick={() => setShowMoreMenu(false)}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname.startsWith("/finanzas")
                    ? "bg-[var(--color-info-bg)] text-[var(--color-primary)]"
                    : "text-[var(--color-neutral-800)] hover:bg-[var(--color-surface-canvas)]"
                }`}
              >
                <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Finanzas y Liquidación</span>
              </Link>

              <Link
                href="/conexiones"
                onClick={() => setShowMoreMenu(false)}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname.startsWith("/conexiones")
                    ? "bg-[var(--color-info-bg)] text-[var(--color-primary)]"
                    : "text-[var(--color-neutral-800)] hover:bg-[var(--color-surface-canvas)]"
                }`}
              >
                <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Conexiones y Webhooks</span>
              </Link>

              <Link
                href="/login"
                onClick={() => setShowMoreMenu(false)}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname === "/login"
                    ? "bg-[var(--color-info-bg)] text-[var(--color-primary)]"
                    : "text-[var(--color-neutral-800)] hover:bg-[var(--color-surface-canvas)]"
                }`}
              >
                <svg className="h-5 w-5 text-[var(--color-neutral-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Acceso Operadores (/login)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Fixed 5-Icon Bottom Nav */}
      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]/95 backdrop-blur-sm md:hidden"
      >
        <div className="grid grid-cols-5">
          {/* 1. Dashboard */}
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
              pathname === "/"
                ? "text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-900)]"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="truncate max-w-full">Dashboard</span>
          </Link>

          {/* 2. Pedidos */}
          <Link
            href="/pedidos"
            aria-current={pathname.startsWith("/pedidos") ? "page" : undefined}
            className={`flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
              pathname.startsWith("/pedidos")
                ? "text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-900)]"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="truncate max-w-full">Pedidos</span>
          </Link>

          {/* 3. Garantías */}
          <Link
            href="/garantias"
            aria-current={pathname.startsWith("/garantias") ? "page" : undefined}
            className={`flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
              pathname.startsWith("/garantias")
                ? "text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-900)]"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="truncate max-w-full">Garantías</span>
          </Link>

          {/* 4. Productos */}
          <Link
            href="/productos"
            aria-current={pathname.startsWith("/productos") ? "page" : undefined}
            className={`flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
              pathname.startsWith("/productos")
                ? "text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-900)]"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="truncate max-w-full">Productos</span>
          </Link>

          {/* 5. Más */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            aria-expanded={showMoreMenu}
            aria-label="Abrir más destinos"
            className={`flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              isMoreActive || showMoreMenu
                ? "text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-900)]"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="truncate max-w-full">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}
