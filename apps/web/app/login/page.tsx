"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandIntro } from "@/components/brand/BrandIntro";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  // Client validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.length >= 6;

  const showEmailError = touched.email && !isEmailValid && email.length > 0;
  const showEmailRequired = touched.email && email.length === 0;
  const showPasswordError = touched.password && !isPasswordValid;

  return (
    <div className="min-h-screen bg-[var(--color-surface-canvas)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Brand Animated Intro (runs once per session, max 2s, skippable) */}
      <BrandIntro />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group" aria-label="Volver al inicio">
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
          <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-5">
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
                <p id="password-error" className="text-xs font-medium text-[var(--color-danger-text)]">
                  La contraseña debe tener al menos 6 caracteres.
                </p>
              )}
            </div>

            {/* Submit Button (DISABLED per requirement 9) */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled
                className="w-full min-h-[44px] rounded-lg bg-[var(--color-neutral-300)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-500)] cursor-not-allowed text-center transition-colors shadow-xs"
              >
                Iniciar sesión
              </button>

              {/* Notice "Conexión pendiente (P8b)" */}
              <div
                role="status"
                className="rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-center space-y-0.5"
              >
                <p className="text-xs font-bold text-[var(--color-warning-text)]">
                  Conexión pendiente (P8b)
                </p>
                <p className="text-[11px] text-[var(--color-warning-text)]/90 leading-tight">
                  La autenticación con Supabase Auth será implementada en la tarea P8b.
                </p>
              </div>
            </div>
          </form>

          <div className="pt-2 border-t border-[var(--color-border-subtle)] text-center">
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
