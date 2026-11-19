"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { getBrowserClient } from "@/src/lib/supabase/client";
import { isSupabaseConfigured } from "@/src/lib/supabase/env";

export interface HeaderProps {
  title?: string;
}

export function Header({ title = "Panel Operativo" }: HeaderProps) {
  const router = useRouter();
  const [isLive, setIsLive] = useState(true);
  const [operatorEmail, setOperatorEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Sesión de operador (null en modo demo sin Supabase).
  useEffect(() => {
    const client = getBrowserClient();
    if (client === null) {
      return;
    }

    let active = true;
    void client.auth.getUser().then(({ data }) => {
      if (active) {
        setOperatorEmail(data.user?.email ?? null);
      }
    });

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setOperatorEmail(session?.user.email ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const client = getBrowserClient();
    if (client === null) {
      return;
    }

    setSigningOut(true);
    await client.auth.signOut();
    setSigningOut(false);
    setOperatorEmail(null);
    router.refresh();
  }

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
          {!isSupabaseConfigured() && <DemoBadge />}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        <LiveIndicator
          isLive={isLive}
          lastSyncLabel="hace 2 min"
          onToggle={() => setIsLive(!isLive)}
        />

        {operatorEmail !== null ? (
          <div className="inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-2.5 py-1 text-xs font-semibold text-[var(--color-neutral-700)]">
            <span
              className="h-2 w-2 rounded-full bg-[var(--color-accent-emerald)]"
              aria-hidden="true"
            />
            <span className="hidden sm:inline max-w-[160px] truncate" title={operatorEmail}>
              {operatorEmail}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-neutral-100)] cursor-pointer disabled:cursor-not-allowed"
            >
              Salir
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="hidden sm:inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-2.5 py-1 text-xs font-semibold text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)] transition-colors"
          >
            <span
              className="h-2 w-2 rounded-full bg-[var(--color-accent-emerald)]"
              aria-hidden="true"
            />
            <span>Operador</span>
          </Link>
        )}
      </div>
    </header>
  );
}
