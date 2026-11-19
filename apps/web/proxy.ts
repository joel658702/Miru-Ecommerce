import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./src/lib/supabase/env";

/**
 * Proxy de Next 16 (antes `middleware`): refresca la sesión de Supabase en cada
 * navegación y escribe las cookies renovadas en la respuesta.
 *
 * En modo demo (sin `NEXT_PUBLIC_SUPABASE_*`) no hace nada: el panel sigue
 * siendo navegable con datos ficticios.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  // Refresca el token si expiró. `getClaims()` verifica y, si hace falta,
  // renueva la sesión; el resultado se escribe vía `setAll`.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|brand/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|mp4)$).*)",
  ],
};
