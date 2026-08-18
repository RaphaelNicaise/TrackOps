import { describe, it, expect } from "vitest";
import { prospectos } from "../src/db/schema";

describe("Prospectos Schema", () => {
  it("should have correct column definitions", () => {
    expect(prospectos).toBeDefined();
    expect(prospectos.id).toBeDefined();
    expect(prospectos.nombre).toBeDefined();
    expect(prospectos.email).toBeDefined();
    expect(prospectos.telefono).toBeDefined();
    expect(prospectos.empresa).toBeDefined();
    expect(prospectos.flotaEstimada).toBeDefined();
    expect(prospectos.mensaje).toBeDefined();
    expect(prospectos.estado).toBeDefined();
    expect(prospectos.notas).toBeDefined();
    expect(prospectos.createdAt).toBeDefined();
  });
});
