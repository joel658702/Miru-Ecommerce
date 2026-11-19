import type { FinancePeriod } from "@/src/data/data-source";

const TIME_ZONE = "America/Bogota";

const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Días hacia atrás (además de hoy) que abarca cada período. */
const DAYS_BACK: Record<FinancePeriod, number> = {
  hoy: 0,
  semana: 6,
  mes: 29,
};

function addDays(dayKey: string, delta: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + delta));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

/**
 * Inicio del período en hora de Bogotá, listo para comparar con
 * `external_created_at`. "hoy" = el día calendario actual; "semana" = 7 días
 * contando hoy; "mes" = 30 días contando hoy.
 */
export function periodStartIso(period: FinancePeriod, now: Date = new Date()): string {
  const today = DAY_KEY_FORMAT.format(now);
  const start = addDays(today, -DAYS_BACK[period]);

  return `${start}T00:00:00-05:00`;
}

export function isFinancePeriod(value: string | null): value is FinancePeriod {
  return value === "hoy" || value === "semana" || value === "mes";
}
