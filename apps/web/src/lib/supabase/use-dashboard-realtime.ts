"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { getBrowserClient } from "./client";

/**
 * Suscripción del dashboard a `dashboard_metrics_daily` (D-08): una fila por
 * día y tenant, nunca a los pedidos.
 *
 * Se pausa cuando la pestaña queda oculta y se reanuda (con re-sincronización)
 * al volver. Sin Supabase configurado no hace nada.
 */
export function useDashboardRealtime(onChange: () => void): void {
  const callback = useRef(onChange);
  callback.current = onChange;

  useEffect(() => {
    const client = getBrowserClient();
    if (client === null) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    const subscribe = () => {
      if (channel !== null) {
        return;
      }

      channel = client
        .channel("dashboard_metrics")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "dashboard_metrics_daily" },
          () => callback.current(),
        )
        .subscribe();
    };

    const unsubscribe = () => {
      if (channel === null) {
        return;
      }
      void client.removeChannel(channel);
      channel = null;
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        subscribe();
        callback.current();
      } else {
        unsubscribe();
      }
    };

    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      unsubscribe();
    };
  }, []);
}
