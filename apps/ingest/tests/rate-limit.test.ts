import { describe, expect, it } from "vitest";

import { createRateLimiter } from "../src/rate-limit.js";

describe("createRateLimiter", () => {
  it("permite hasta el máximo y luego bloquea", () => {
    const limiter = createRateLimiter(2, 60_000, () => 1_000);

    expect(limiter.check("ip-1").allowed).toBe(true);
    expect(limiter.check("ip-1").allowed).toBe(true);

    const blocked = limiter.check("ip-1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(60_000);
  });

  it("reinicia al pasar la ventana", () => {
    let now = 0;
    const limiter = createRateLimiter(1, 1_000, () => now);

    expect(limiter.check("ip").allowed).toBe(true);
    expect(limiter.check("ip").allowed).toBe(false);

    now = 1_000;
    expect(limiter.check("ip").allowed).toBe(true);
  });

  it("cuenta por clave (IP) de forma independiente", () => {
    const limiter = createRateLimiter(1, 1_000, () => 0);

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
  });

  it("el retry-after baja con el tiempo", () => {
    let now = 0;
    const limiter = createRateLimiter(1, 1_000, () => now);
    limiter.check("ip");

    now = 400;
    expect(limiter.check("ip").retryAfterMs).toBe(600);
  });
});
