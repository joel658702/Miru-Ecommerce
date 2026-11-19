"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandIntro } from "@/components/brand/BrandIntro";
import { getBrowserClient } from "@/src/lib/supabase/client";
import { isSupabaseConfigured } from "@/src/lib/supabase/env";

/** Traduce los errores de Supabase Auth a mensajes de operador en español. */
function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de ingresar.";
  }
  if (normalized.includes("email rate limit") || normalized.includes("rate limit")) {
    return "Demasiados intentos. Espera un momento y vuelve a intentar.";
  }
  if (normalized.includes("fetch") || normalized.includes("network")) {
    return "No se pudo conectar con el servidor de autenticación.";
  }

  return "No fue posible iniciar sesión. Vuelve a intentarlo.";
}

export default function LoginPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  // Client validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.length >= 6;

  const showEmailError = touched.email && !isEmailValid && email.length > 0;
  const showEmailRequired = touched.email && email.length === 0;
  const showPasswordError = touched.password && !isPasswordValid;
  const canSubmit = configured && !submitting && isEmailValid && isPasswordValid;

  // Sesión ya iniciada (el proxy refresca las cookies en cada navegación).
  useEffect(() => {
    const client = getBrowserClient();
    if (client === null) {
      return;
    }

    let active = true;
    void client.auth.getUser().then(({ data }) => {
      if (active) {
        setSessionEmail(data.user?.email ?? null);
      }
    });

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setSubmitError(null);

    if (!canSubmit) {
      return;
    }

    const client = getBrowserClient();
    if (client === null) {
      return;
    }

    setSubmitting(true);
    const { error } = await client.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) {
      setSubmitError(mapAuthError(error.message));
      return;
    }

    router.replace("/");
    router.refresh();
  }

  async function handleSignOut() {
    const client = getBrowserClient();
    if (client === null) {
      return;
    }

    setSubmitting(true);
    await client.auth.signOut();
    setSubmitting(false);
    setSessionEmail(null);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-canvas)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Brand Animated Intro (runs once per session, max 2s, skippable) */}
      <BrandIntro />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 mb-4 group"
          aria-label="Volver al inicio"
        >
          <div className="h-12 w-12 relative flex items-center justify-center">
            <Image
              src="/brand/logo-mark.svg"
              alt="Logo Miru"
              width={48}
              height={48}
              priority
              className="object-contain transition-transform group-hover:scale-105"
            />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-[var(--color-neutral-900)]">
            Miru<span className="text-[var(--color-primary)]">-Ecommerce</span>
          </span>
        </Link>

        <h1 className="font-display text-xl font-bold text-[var(--color-neutral-900)]">
          Acceso de Operadores
        </h1>
        <p className="mt-1 text-sm text-[var(--color-neutral-600)]">
          Plataforma centralizada de pedidos, garantías y finanzas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-6 sm:p-8 shadow-[var(--shadow-level-2)] space-y-6">
          {sessionEmail !== null && (
            <div
              role="status"
              className="rounded-lg border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-3 text-center space-y-0.5"
            >
              <p className="text-xs font-bold text-[var(--color-success-text)]">Sesión activa</p>
              <p className="text-[11px] text-[var(--color-success-text)]/90 leading-tight break-all">
                {sessionEmail}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Campo Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-[var(--color-neutral-700)]"
              >
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                aria-invalid={showEmailError || showEmailRequired}
                aria-describedby={showEmailError || showEmailRequired ? "email-error" : undefined}
                placeholder="operador@tienda.com"
                className={`w-full min-h-[44px] rounded-lg border px-3.5 text-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] bg-[var(--color-surface-card)] transition-colors focus:outline-none focus:ring-2 ${
                  showEmailError || showEmailRequired
                    ? "border-[var(--color-danger-border)] focus:ring-[var(--color-danger-solid)]/30"
                    : "border-[var(--color-border-subtle)] focus:border-[var(--color-accent-cyan)] focus:ring-[var(--color-accent-cyan)]/30"
                }`}
              />
              {showEmailRequired && (
                <p id="email-error" className="text-xs font-medium text-[var(--color-danger-text)]">
                  El correo electrónico es requerido.
                </p>
              )}
              {showEmailError && (
                <p id="email-error" className="text-xs font-medium text-[var(--color-danger-text)]">
                  Ingresa un correo electrónico válido (ej. usuario@dominio.com).
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[var(--color-neutral-700)]"
                >
                  Contraseña
                </label>
                <span className="text-[11px] text-[var(--color-neutral-500)]">
                  Mínimo 6 caracteres
                </span>
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                aria-invalid={showPasswordError}
                aria-describedby={showPasswordError ? "password-error" : undefined}
                placeholder="••••••••"
                className={`w-full min-h-[44px] rounded-lg border px-3.5 text-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] bg-[var(--color-surface-card)] transition-colors focus:outline-none focus:ring-2 ${
                  showPasswordError
                    ? "border-[var(--color-danger-border)] focus:ring-[var(--color-danger-solid)]/30"
                    : "border-[var(--color-border-subtle)] focus:border-[var(--color-accent-cyan)] focus:ring-[var(--color-accent-cyan)]/30"
                }`}
              />
              {showPasswordError && (
                <p
                  id="password-error"
                  className="text-xs font-medium text-[var(--color-danger-text)]"
                >
                  La contraseña debe tener al menos 6 caracteres.
                </p>
              )}
            </div>

            {submitError !== null && (
              <p
                role="alert"
                className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-3 text-xs font-medium text-[var(--color-danger-text)]"
              >
                {submitError}
              </p>
            )}

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold text-center transition-colors shadow-xs ${
                  canSubmit
                    ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 cursor-pointer"
                    : "bg-[var(--color-neutral-300)] text-[var(--color-neutral-500)] cursor-not-allowed"
                }`}
              >
                {submitting ? "Verificando…" : "Iniciar sesión"}
              </button>

              {configured ? (
                <p className="text-[11px] text-center text-[var(--color-neutral-500)] leading-tight">
                  Sesión gestionada por Supabase Auth. Las credenciales nunca se guardan en el
                  cliente.
                </p>
              ) : (
                <div
                  role="status"
                  className="rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-center space-y-0.5"
                >
                  <p className="text-xs font-bold text-[var(--color-warning-text)]">
                    Conexión pendiente (P8b)
                  </p>
                  <p className="text-[11px] text-[var(--color-warning-text)]/90 leading-tight">
                    Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para habilitar
                    el acceso.
                  </p>
                </div>
              )}
            </div>
          </form>

          <div className="pt-2 border-t border-[var(--color-border-subtle)] text-center space-y-2">
            {sessionEmail !== null && (
              <div className="space-y-2">
                <Link
                  href="/"
                  className="inline-flex w-full min-h-[44px] items-center justify-center rounded-lg bg-[var(--color-neutral-900)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-neutral-800)]"
                >
                  Ir al panel
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={submitting}
                  className="w-full min-h-[44px] rounded-lg border border-[var(--color-border-interactive)] bg-[var(--color-surface-card)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-700)] hover:bg-[var(--color-surface-canvas)] cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            )}

            <Link
              href="/"
              className="text-xs font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
            >
              <span>← Volver al Dashboard (Modo Demo)</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
