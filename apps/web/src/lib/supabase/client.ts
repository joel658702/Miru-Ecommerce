import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

let browserClient: SupabaseClient | null = null;

/**
 * Cliente de navegador (singleton por pestaña). Devuelve `null` cuando la
 * WebApp corre en modo demo sin Supabase configurado.
 */
export function getBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (browserClient === null) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return browserClient;
}
