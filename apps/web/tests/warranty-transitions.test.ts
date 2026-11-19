import { describe, expect, it } from "vitest";

import {
  canTransitionWarranty,
  nextWarrantyStatuses,
  requiresResolutionNote,
} from "../src/server/warranty-transitions";

describe("flujo de garantías", () => {
  it("permite pasar de solicitada a revisión o rechazar", () => {
    expect(nextWarrantyStatuses("solicitada")).toEqual(["en_revision", "rechazada"]);
  });

  it("desde revisión solo aprueba o rechaza", () => {
    expect(canTransitionWarranty("en_revision", "aprobada")).toBe(true);
    expect(canTransitionWarranty("en_revision", "rechazada")).toBe(true);
    expect(canTransitionWarranty("en_revision", "reembolsada")).toBe(false);
  });

  it("una aprobada solo se reembolsa", () => {
    expect(nextWarrantyStatuses("aprobada")).toEqual(["reembolsada"]);
  });

  it("rechazada y reembolsada son terminales", () => {
    expect(nextWarrantyStatuses("rechazada")).toEqual([]);
    expect(nextWarrantyStatuses("reembolsada")).toEqual([]);
  });

  it("no permite retroceder", () => {
    expect(canTransitionWarranty("aprobada", "en_revision")).toBe(false);
    expect(canTransitionWarranty("reembolsada", "aprobada")).toBe(false);
  });

  it("exige nota al rechazar", () => {
    expect(requiresResolutionNote("rechazada")).toBe(true);
    expect(requiresResolutionNote("aprobada")).toBe(false);
  });
});
