/**
 * Utilidades de exportación CSV.
 *
 * Formato pensado para Excel en Colombia: separador `;`, codificación UTF-8 con
 * BOM (lo agrega la ruta) y montos en pesos con coma decimal.
 */

/** Escapa un campo: comillas dobles si contiene el separador, comillas o saltos. */
export function escapeCsvField(value: string | number): string {
  const text = String(value);

  if (!/[;"\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly (string | number)[])[],
): string {
  const lines = [headers.map(escapeCsvField).join(";")];

  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(";"));
  }

  return `${lines.join("\r\n")}\r\n`;
}

/**
 * Centavos enteros → pesos con dos decimales ("168000,00"), sin float.
 */
export function centsToDecimal(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / 100);
  const fraction = absolute % 100;

  return `${sign}${whole},${String(fraction).padStart(2, "0")}`;
}
