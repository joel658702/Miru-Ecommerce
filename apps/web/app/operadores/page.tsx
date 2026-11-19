"use client";

import React, { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Toast, type ToastItem } from "@/components/ui/Toast";
import { dataSource } from "@/src/data";
import { getBrowserClient } from "@/src/lib/supabase/client";
import type { OperatorRecord, OperatorRole } from "@/src/data/data-source";

const MIN_PASSWORD_LENGTH = 8;

function OperadoresContent() {
  const [operators, setOperators] = useState<OperatorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<OperatorRole>("operador");
  const [creating, setCreating] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    titulo: string,
    descripcion?: string,
    tone?: "success" | "info" | "warning" | "danger",
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, titulo, descripcion, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 3500);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setOperators(await dataSource.getOperators());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los operadores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const client = getBrowserClient();
    if (client !== null) {
      void client.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
    }
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      addToast(
        "Contraseña corta",
        `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        "warning",
      );
      return;
    }

    setCreating(true);
    try {
      const created = await dataSource.createOperator({ email, password, rol });
      setOperators((prev) => [...prev, created]);
      setEmail("");
      setPassword("");
      setRol("operador");
      addToast("Operador creado", `${created.email} ya puede iniciar sesión.`, "success");
    } catch (err) {
      addToast(
        "No se pudo crear",
        err instanceof Error ? err.message : "Intenta de nuevo.",
        "danger",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (operator: OperatorRecord) => {
    setRemoving(operator.userId);
    try {
      await dataSource.removeOperator(operator.userId);
      setOperators((prev) => prev.filter((item) => item.userId !== operator.userId));
      addToast("Acceso revocado", `${operator.email} ya no pertenece al tenant.`, "success");
    } catch (err) {
      addToast(
        "No se pudo revocar",
        err instanceof Error ? err.message : "Intenta de nuevo.",
        "danger",
      );
    } finally {
      setRemoving(null);
      setPendingRemove(null);
    }
  };

  const columns: Column<OperatorRecord>[] = [
    {
      key: "email",
      header: "Correo",
      render: (operator) => (
        <span className="text-xs font-semibold text-[var(--color-neutral-900)]">
          {operator.email}
          {operator.userId === currentUserId && (
            <span className="ml-2 rounded-md bg-[var(--color-surface-canvas)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-neutral-500)]">
              tú
            </span>
          )}
        </span>
      ),
    },
    {
      key: "rol",
      header: "Rol",
      render: (operator) => (
        <span className="text-xs font-semibold text-[var(--color-neutral-700)]">
          {operator.rol === "owner" ? "Owner" : "Operador"}
        </span>
      ),
    },
    {
      key: "desde",
      header: "Alta",
      render: (operator) => (
        <span className="font-mono text-[11px] text-[var(--color-neutral-600)]">
          {new Date(operator.desde).toLocaleDateString("es-CO")}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "",
      render: (operator) => {
        const isSelf = operator.userId === currentUserId;
        const confirming = pendingRemove === operator.userId;

        return (
          <div className="flex justify-end gap-2">
            {confirming ? (
              <>
                <button
                  type="button"
                  onClick={() => setPendingRemove(null)}
                  className="min-h-[32px] rounded-md border border-[var(--color-border-interactive)] px-2.5 text-[11px] font-semibold text-[var(--color-neutral-700)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemove(operator)}
                  disabled={removing === operator.userId}
                  className="min-h-[32px] rounded-md bg-[var(--color-danger-solid)] px-2.5 text-[11px] font-semibold text-white cursor-pointer"
                >
                  {removing === operator.userId ? "Revocando…" : "Confirmar"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setPendingRemove(operator.userId)}
                disabled={isSelf}
                title={isSelf ? "No puedes revocar tu propio acceso" : undefined}
                className={`min-h-[32px] rounded-md border px-2.5 text-[11px] font-semibold ${
                  isSelf
                    ? "border-[var(--color-border-subtle)] text-[var(--color-neutral-400)] cursor-not-allowed"
                    : "border-[var(--color-danger-border)] text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)] cursor-pointer"
                }`}
              >
                Revocar
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <Toast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-neutral-900)]">
          Operadores del tenant
        </h1>
        <p className="text-xs text-[var(--color-neutral-500)]">
          Solo un owner puede crear cuentas o revocar accesos.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-level-1)]"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label
              htmlFor="operator-email"
              className="block text-xs font-semibold text-[var(--color-neutral-700)]"
            >
              Correo
            </label>
            <input
              id="operator-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="operador@tienda.com"
              className="mt-1 w-full min-h-[44px] rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] px-3 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="operator-password"
              className="block text-xs font-semibold text-[var(--color-neutral-700)]"
            >
              Contraseña
            </label>
            <input
              id="operator-password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={`Mínimo ${MIN_PASSWORD_LENGTH}`}
              className="mt-1 w-full min-h-[44px] rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] px-3 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="operator-role"
              className="block text-xs font-semibold text-[var(--color-neutral-700)]"
            >
              Rol
            </label>
            <select
              id="operator-role"
              value={rol}
              onChange={(event) => setRol(event.target.value as OperatorRole)}
              className="mt-1 w-full min-h-[44px] rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] px-3 text-sm"
            >
              <option value="operador">Operador</option>
              <option value="owner">Owner</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className={`min-h-[44px] rounded-lg px-4 text-sm font-semibold text-white ${
              creating
                ? "bg-[var(--color-neutral-300)] text-[var(--color-neutral-500)] cursor-not-allowed"
                : "bg-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-800)] cursor-pointer"
            }`}
          >
            {creating ? "Creando…" : "Crear operador"}
          </button>
        </div>
      </form>

      {loading ? (
        <Skeleton variant="table" rows={4} />
      ) : error ? (
        <ErrorState
          title="No pudimos cargar los operadores"
          description={error}
          onRetry={() => void load()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={operators}
          keyExtractor={(operator) => operator.userId}
          state={operators.length === 0 ? "empty" : "data"}
          emptyTitle="Sin operadores"
          emptyDescription="Crea la primera cuenta para que alguien más pueda entrar al panel."
        />
      )}
    </div>
  );
}

export default function OperadoresPage() {
  return (
    <AppShell title="Operadores">
      <Suspense
        fallback={
          <div className="h-64 rounded-xl border border-[var(--color-border-subtle)] animate-pulse" />
        }
      >
        <OperadoresContent />
      </Suspense>
    </AppShell>
  );
}
