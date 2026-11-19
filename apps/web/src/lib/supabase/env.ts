/**
 * Configuración pública de Supabase (D-09).
 *
 * Solo llegan al cliente las dos variables `NEXT_PUBLIC_*`. La `service_role`
 * key y los secretos HMAC viven únicamente en el servidor (apps/ingest).
 *
 * Si las variables no existen (por ejemplo, el despliegue DEMO de Vercel sin
 * Supabase), la WebApp funciona en modo demo y `/login` muestra el aviso de
 * «Conexión pendiente».
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** `true` cuando la WebApp está conectada a Supabase (local o remoto). */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
