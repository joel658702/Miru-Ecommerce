"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    id: "pedidos",
    label: "Pedidos",
    href: "/pedidos",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
    ),
  },
  {
    id: "garantias",
    label: "Garantías",
    href: "/garantias",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    id: "productos",
    label: "Productos",
    href: "/productos",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    id: "finanzas",
    label: "Finanzas",
    href: "/finanzas",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: "conexiones",
    label: "Conexiones",
    href: "/conexiones",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] transition-[width] duration-200 ${
        collapsed ? "w-[76px]" : "w-[260px]"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-[var(--color-border-subtle)] px-4">
        <Link href="/" className="flex items-center gap-2.5 min-w-0" aria-label="Inicio Miru-Ecommerce">
          <div className="h-9 w-9 shrink-0 relative flex items-center justify-center">
            <Image
              src="/brand/logo-mark.svg"
              alt="Logo Miru"
              width={36}
              height={36}
              priority
              className="object-contain"
            />
          </div>
          {!collapsed && (
            <span className="font-display text-base font-bold tracking-tight text-[var(--color-neutral-900)] whitespace-nowrap truncate">
              Miru<span className="text-[var(--color-primary)]">-Ecommerce</span>
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] cursor-pointer"
        >
          {collapsed ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Nav Links */}
      <nav aria-label="Navegación principal" className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-[var(--color-info-bg)] text-[var(--color-primary-hover)] font-semibold"
                  : "text-[var(--color-neutral-600)] hover:bg-[var(--color-surface-canvas)] hover:text-[var(--color-neutral-900)]"
              } ${collapsed ? "justify-center px-0" : "justify-between"}`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? "text-[var(--color-primary)]" : "text-[var(--color-neutral-500)]"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </span>
              {!collapsed && typeof item.badge === "number" && item.badge > 0 && (
                <span className="text-xs font-semibold tabular-nums text-[var(--color-neutral-500)]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & Login Link */}
      {!collapsed && (
        <div className="border-t border-[var(--color-border-subtle)] p-4 space-y-3">
          <div className="rounded-lg bg-[var(--color-surface-canvas)] p-3 border border-[var(--color-border-subtle)]">
            <p className="text-xs font-semibold text-[var(--color-neutral-900)]">Canales integrados</p>
            <p className="mt-1 text-xs text-[var(--color-neutral-500)]">Dropi · MasterShop · Effi</p>
          </div>

          <Link
            href="/login"
            className="flex min-h-[36px] items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] transition-colors"
          >
            <span>Acceso operadores</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </Link>
        </div>
      )}
    </aside>
  );
}
