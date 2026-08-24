import { describe, it, expect } from "vitest";
import {
  DEMO_EMPRESA_ID,
  isDemoEmail,
  isDemoUser,
} from "@/lib/demo-mode";

describe("isDemoEmail", () => {
  it("detecta emails @test.com", () => {
    expect(isDemoEmail("admin@test.com")).toBe(true);
    expect(isDemoEmail("chofer@test.com")).toBe(true);
    expect(isDemoEmail("QUALQUIER@TEST.COM")).toBe(true);
  });

  it("rechaza emails reales", () => {
    expect(isDemoEmail("superadmin@trackops.com")).toBe(false);
    expect(isDemoEmail("cliente@logistica.com.ar")).toBe(false);
  });

  it("maneja valores vacíos", () => {
    expect(isDemoEmail(null)).toBe(false);
    expect(isDemoEmail(undefined)).toBe(false);
    expect(isDemoEmail("")).toBe(false);
  });
});

describe("isDemoUser", () => {
  it("es demo por email @test.com", () => {
    expect(isDemoUser({ email: "empresa@test.com", empresaId: null })).toBe(true);
  });

  it(`es demo por pertenecer a la empresa ${DEMO_EMPRESA_ID}`, () => {
    expect(isDemoUser({ email: "admin@logistica.com", empresaId: DEMO_EMPRESA_ID })).toBe(true);
  });

  it("no es demo un usuario real de otra empresa", () => {
    expect(isDemoUser({ email: "dueño@flotareal.com", empresaId: 7 })).toBe(false);
  });

  it("no es demo el superadmin real", () => {
    expect(isDemoUser({ email: "superadmin@trackops.com", empresaId: null })).toBe(false);
  });

  it("sin sesión no hay demo", () => {
    expect(isDemoUser(null)).toBe(false);
    expect(isDemoUser(undefined)).toBe(false);
  });
});
