import { describe, expect, it } from "vitest";

import { MIN_PASSWORD_LENGTH, validateOperatorInput } from "../src/server/operators";

describe("validateOperatorInput", () => {
  it("acepta un correo válido y contraseña suficiente", () => {
    const result = validateOperatorInput({
      email: "  Operador@Tienda.COM ",
      password: "secreto123",
      rol: "operador",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("operador@tienda.com");
      expect(result.value.rol).toBe("operador");
    }
  });

  it("normaliza un rol desconocido a operador", () => {
    const result = validateOperatorInput({
      email: "a@b.co",
      password: "12345678",
      rol: "admin",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rol).toBe("operador");
    }
  });

  it("rechaza correos inválidos", () => {
    const result = validateOperatorInput({ email: "sin-arroba", password: "12345678" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("correo");
  });

  it("rechaza contraseñas cortas", () => {
    const result = validateOperatorInput({ email: "a@b.co", password: "1234567" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(String(MIN_PASSWORD_LENGTH));
  });

  it("acepta exactamente el mínimo", () => {
    const result = validateOperatorInput({
      email: "a@b.co",
      password: "x".repeat(MIN_PASSWORD_LENGTH),
    });
    expect(result.ok).toBe(true);
  });
});
