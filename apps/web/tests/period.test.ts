import { describe, expect, it } from "vitest";

import { isFinancePeriod, periodStartIso } from "../src/server/period";

describe("periodStartIso", () => {
  const now = new Date("2026-11-19T15:00:00Z"); // 10:00 en Bogotá

  it("hoy empieza el día calendario de Bogotá", () => {
    expect(periodStartIso("hoy", now)).toBe("2026-11-19T00:00:00-05:00");
  });

  it("7 días incluye hoy y los 6 anteriores", () => {
    expect(periodStartIso("semana", now)).toBe("2026-11-13T00:00:00-05:00");
  });

  it("30 días incluye hoy y los 29 anteriores", () => {
    expect(periodStartIso("mes", now)).toBe("2026-10-21T00:00:00-05:00");
  });

  it("usa el día de Bogotá aunque en UTC ya sea mañana", () => {
    // 2026-11-20T02:00Z = 2026-11-19 21:00 en Bogotá
    expect(periodStartIso("hoy", new Date("2026-11-20T02:00:00Z"))).toBe(
      "2026-11-19T00:00:00-05:00",
    );
  });
});

describe("isFinancePeriod", () => {
  it("acepta solo los períodos conocidos", () => {
    expect(isFinancePeriod("hoy")).toBe(true);
    expect(isFinancePeriod("semana")).toBe(true);
    expect(isFinancePeriod("mes")).toBe(true);
    expect(isFinancePeriod("trimestre")).toBe(false);
    expect(isFinancePeriod(null)).toBe(false);
  });
});
