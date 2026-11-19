import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./src/lib/supabase/env";

/** Rutas que no exigen sesión (el resto del panel redirige a /login). */
const PUBLIC_PATHS = new Set(["/login"]);
/** La API responde 401 por sí misma: no se redirige a HTML. */
const API_PREFIX = "/api/";

/**
 * Proxy de Next 16 (antes `middleware`): refresca la sesión de Supabase,
 * protege las rutas del panel y escribe las cookies renovadas en la respuesta.
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
  const { data } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;

  // La API no se redirige: responde 401 y la WebApp muestra el error.
  if (pathname.startsWith(API_PREFIX)) {
    return response;
  }

  const authenticated = data?.claims !== undefined && data.claims !== null;

  if (!authenticated && !PUBLIC_PATHS.has(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  if (authenticated && pathname === "/login") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  // Excluye TODO `/_next` (incluido el WebSocket de HMR: si el proxy lo
  // intercepta, el handshake falla y la página no hidrata en desarrollo).
  matcher: ["/((?!_next/|brand/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|mp4)$).*)"],
};
