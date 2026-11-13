import { describe, expect, it } from "vitest";

import { isTimestampFresh, sign, TIMESTAMP_WINDOW_SECONDS, verifySignature } from "../src/hmac.js";

const SECRET = "test-secret";
const BODY = Buffer.from('{"a":1}', "utf8");
const EXPECTED_HEX = "179bf20a8b9040a32368814a68b0dc270823b5968498e0a73796c4202708ed8d";

describe("sign", () => {
  it("devuelve sha256= + HMAC-SHA256 hex del body crudo", () => {
    expect(sign(BODY, SECRET)).toBe(`sha256=${EXPECTED_HEX}`);
  });

  it("es determinista para el mismo body y secreto", () => {
    expect(sign(BODY, SECRET)).toBe(sign(Buffer.from('{"a":1}', "utf8"), SECRET));
  });
});

describe("verifySignature", () => {
  it("acepta una firma válida", () => {
    expect(verifySignature(BODY, SECRET, sign(BODY, SECRET))).toBe(true);
  });

  it("rechaza una firma alterada", () => {
    expect(verifySignature(BODY, SECRET, `sha256=${"0".repeat(64)}`)).toBe(false);
  });

  it("rechaza un header de longitud distinta sin lanzar", () => {
    expect(() => verifySignature(BODY, SECRET, "sha256=abc")).not.toThrow();
    expect(verifySignature(BODY, SECRET, "sha256=abc")).toBe(false);
  });

  it("rechaza un body modificado con la firma original", () => {
    const originalSignature = sign(BODY, SECRET);
    expect(verifySignature(Buffer.from('{"a":2}', "utf8"), SECRET, originalSignature)).toBe(false);
  });

  it("rechaza un header vacío", () => {
    expect(verifySignature(BODY, SECRET, "")).toBe(false);
  });
});

describe("isTimestampFresh", () => {
  const now = 1_700_000_000;

  it("acepta el instante actual", () => {
    expect(isTimestampFresh(String(now), now)).toBe(true);
  });

  it("acepta justo el borde de la ventana", () => {
    expect(isTimestampFresh(String(now - TIMESTAMP_WINDOW_SECONDS), now)).toBe(true);
    expect(isTimestampFresh(String(now + TIMESTAMP_WINDOW_SECONDS), now)).toBe(true);
  });

  it("rechaza fuera de la ventana", () => {
    expect(isTimestampFresh(String(now - TIMESTAMP_WINDOW_SECONDS - 1), now)).toBe(false);
    expect(isTimestampFresh(String(now + TIMESTAMP_WINDOW_SECONDS + 1), now)).toBe(false);
  });

  it("rechaza un timestamp no numérico", () => {
    expect(isTimestampFresh("no-es-un-timestamp", now)).toBe(false);
  });
});
