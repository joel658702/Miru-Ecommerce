"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { LiveIndicator } from "@/components/ui/LiveIndicator";

export interface HeaderProps {
  title?: string;
}

export function Header({ title = "Panel Operativo" }: HeaderProps) {
  const [isLive, setIsLive] = useState(true);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]/90 px-4 md:px-6 backdrop-blur-sm">
      {/* Mobile Brand / Desktop View Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/" className="md:hidden flex items-center gap-2" aria-label="Inicio">
          <Image
            src="/brand/logo-mark.svg"
            alt="Miru"
            width={28}
            height={28}
            className="object-contain"
          />
        </Link>
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="font-display text-base md:text-lg font-bold text-[var(--color-neutral-900)] truncate">
            {title}
          </h1>
          <DemoBadge />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        <LiveIndicator
          isLive={isLive}
          lastSyncLabel="hace 2 min"
          onToggle={() => setIsLive(!isLive)}
        />

        <Link
          href="/login"
          className="hidden sm:inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-2.5 py-1 text-xs font-semibold text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent-emerald)]" aria-hidden="true" />
          <span>Operador</span>
        </Link>
      </div>
    </header>
  );
}
