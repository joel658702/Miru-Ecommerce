/**
 * Dinero en centavos enteros.
 *
 * Regla absoluta del proyecto: los montos son enteros en centavos (BIGINT en
 * la base de datos). Prohibido `float` para montos, y prohibido convertir el
 * string completo con `parseFloat` / `Number(...) * 100`.
 */

/**
 * Pesos aceptados: separador de miles con punto (grupos de 3) y decimales con
 * coma (1 o 2 dígitos). El punto decimal queda prohibido a propósito porque es
 * ambiguo con el separador de miles.
 */
const PESOS_PATTERN = /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

/** Cantidad de dígitos de un entero representable con precisión exacta en JS. */
const MAX_SAFE_DIGITS = String(Number.MAX_SAFE_INTEGER).length;

const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Garantiza que el valor sea un entero de centavos válido (seguro y no negativo).
 * Lanza `RangeError` en lugar de redondear o coercionar en silencio.
 */
export function assertCents(value: unknown): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      `Monto inválido: se esperaba un entero de centavos >= 0 y se recibió ${String(value)}.`,
    );
  }
}

/**
 * Convierte pesos (string) a centavos enteros mediante manipulación de string.
 * Cualquier formato fuera de contrato lanza `RangeError`: nunca se redondea.
 */
export function pesosToCents(input: string): number {
  if (typeof input !== "string") {
    throw new TypeError("pesosToCents espera un string.");
  }

  const match = PESOS_PATTERN.exec(input);
  if (match === null) {
    throw new RangeError(`Formato de pesos inválido: ${JSON.stringify(input)}.`);
  }

  const decimals = match[1] ?? "";
  const commaIndex = input.indexOf(",");
  const integerPart = commaIndex === -1 ? input : input.slice(0, commaIndex);
  const centsDigits = integerPart.replaceAll(".", "") + decimals.padEnd(2, "0");

  if (centsDigits.replace(/^0+(?=\d)/, "").length > MAX_SAFE_DIGITS) {
    throw new RangeError(`El monto ${JSON.stringify(input)} excede Number.MAX_SAFE_INTEGER.`);
  }

  const cents = Number(centsDigits);
  assertCents(cents);
  return cents;
}

/**
 * Formatea centavos como pesos colombianos. Sin decimales cuando el monto es
 * múltiplo de 100 centavos; con 2 decimales en caso contrario.
 */
export function formatCOP(cents: number): string {
  assertCents(cents);

  const remainder = cents % 100;
  const wholePesos = (cents - remainder) / 100;
  const formatted = COP_FORMATTER.format(wholePesos);

  return remainder === 0 ? formatted : `${formatted},${String(remainder).padStart(2, "0")}`;
}
