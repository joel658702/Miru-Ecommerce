import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Cliente de servidor con sesión basada en cookies (`@supabase/ssr`).
 *
 * Crear uno nuevo por render: nunca compartir entre peticiones. Devuelve
 * `null` cuando la WebApp corre en modo demo sin Supabase configurado.
 */
export async function getServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Un Server Component no puede escribir cookies: el refresco de
          // sesión lo cubre `proxy.ts`. Ignorar aquí es seguro.
        }
      },
    },
  });
}
