"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCOP } from "@miru/shared";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { SearchInput } from "@/components/ui/SearchInput";
import { dataSource } from "@/src/data";
import type { DataSourceState, ProductRecord } from "@/src/data/data-source";

function ProductosContent() {
  const searchParams = useSearchParams();
  const stateParam = (searchParams.get("state") as DataSourceState) ?? "data";

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(stateParam === "loading");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadProducts = async (targetState: DataSourceState) => {
    if (targetState === "loading") {
      setLoading(true);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await dataSource.getProducts(targetState);
      setProducts(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar catálogo de productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(stateParam);
  }, [stateParam]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        return p.sku.toLowerCase().includes(query) || p.nombre.toLowerCase().includes(query);
      }
      return true;
    });
  }, [products, search]);

  const columns: Column<ProductRecord>[] = [
    {
      key: "sku",
      header: "SKU",
      render: (p) => (
        <span className="font-mono text-xs font-bold text-[var(--color-neutral-900)]">
          {p.sku}
        </span>
      ),
    },
    {
      key: "nombre",
      header: "Producto",
      render: (p) => (
        <div>
          <p className="text-xs font-semibold text-[var(--color-neutral-900)]">{p.nombre}</p>
          <p className="text-[11px] text-[var(--color-neutral-500)]">{p.id}</p>
        </div>
      ),
    },
    {
      key: "plataformas",
      header: "Canales vinculados",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.plataformas.map((plat) => (
            <StatusChip key={plat} domain="plataforma" status={plat} size="sm" />
          ))}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock Disponible",
      render: (p) => (
        <span className="font-mono text-xs font-semibold tabular-nums text-[var(--color-neutral-800)]">
          {p.stock} un.
        </span>
      ),
    },
    {
      key: "costo",
      header: "Costo Unitario COP",
      render: (p) => (
        <span className="font-display font-medium text-xs text-[var(--color-neutral-600)] tabular-nums">
          {formatCOP(p.costoUnitarioCents)}
        </span>
      ),
    },
    {
      key: "precio",
      header: "Precio Venta COP",
      render: (p) => (
        <span className="font-display font-bold text-xs text-[var(--color-neutral-900)] tabular-nums">
          {formatCOP(p.precioVentaCents)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-neutral-900)]">
            Catálogo de Productos
          </h1>
          <p className="text-xs text-[var(--color-neutral-500)]">
            {filteredProducts.length} referencias sincronizadas con bodegas aliadas
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-level-1)]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por SKU o nombre de producto..."
        />
      </div>

      <DataTable
        columns={columns}
        rows={filteredProducts}
        keyExtractor={(p) => p.id}
        state={loading ? "loading" : error ? "error" : filteredProducts.length === 0 ? "empty" : "data"}
        onRetry={() => loadProducts("data")}
        emptyTitle="Sin productos"
        emptyDescription="No se encontraron referencias que coincidan con la búsqueda."
        emptyActionLabel="Limpiar búsqueda"
        onEmptyAction={() => setSearch("")}
      />
    </div>
  );
}

export default function ProductosPage() {
  return (
    <AppShell title="Productos">
      <Suspense fallback={<div className="h-64 rounded-xl border border-[var(--color-border-subtle)] animate-pulse" />}>
        <ProductosContent />
      </Suspense>
    </AppShell>
  );
}
