import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Helpers de firma para los webhooks Miru v1.
 *
 * Solo servidor: usa `node:crypto`. No exportar desde el índice del paquete
 * (ver el subpath `@miru/shared/hmac`).
 */

/** Ventana de tolerancia del timestamp: ±5 minutos. */
export const TIMESTAMP_WINDOW_SECONDS = 300;

/**
 * Firma HMAC-SHA256 del body CRUDO (sin parsear ni re-serializar).
 * Devuelve `sha256=<hex>`.
 */
export function sign(rawBody: Buffer, secret: string): string {
  const hex = createHmac("sha256", secret).update(rawBody).digest("hex");
  return `sha256=${hex}`;
}

/**
 * Compara la firma recibida contra la esperada en tiempo constante.
 * Valida la longitud antes de `timingSafeEqual` (lanza si difieren).
 */
export function verifySignature(rawBody: Buffer, secret: string, header: string): boolean {
  if (typeof header !== "string" || header.length === 0) {
    return false;
  }

  const provided = Buffer.from(header, "utf8");
  const expected = Buffer.from(sign(rawBody, secret), "utf8");

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

/**
 * Verifica que el timestamp (segundos epoch, string) esté dentro de ±300s
 * respecto de `nowSeconds`.
 */
export function isTimestampFresh(
  ts: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  if (typeof ts !== "string" || !/^\d+$/.test(ts)) {
    return false;
  }

  const seconds = Number(ts);
  if (!Number.isSafeInteger(seconds)) {
    return false;
  }

  return Math.abs(nowSeconds - seconds) <= TIMESTAMP_WINDOW_SECONDS;
}
