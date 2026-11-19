import { isSupabaseConfigured } from "@/src/lib/supabase/env";

import { apiDataSource } from "./api-data-source";
import { demoDataSource } from "./demo-data-source";
import type { DataSource } from "./data-source";

/**
 * Origen de datos de la WebApp.
 *
 * - Con Supabase configurado: datos reales vía `/api/data/*` (sesión + RLS).
 * - Sin Supabase (p. ej. el despliegue DEMO): fixtures de `demo-data-source`.
 */
export const dataSource: DataSource = isSupabaseConfigured() ? apiDataSource : demoDataSource;
