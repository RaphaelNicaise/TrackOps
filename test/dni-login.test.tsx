import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock next-auth to avoid next/server resolution issue in node vitest
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    handlers: {},
  })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config) => config),
}));

vi.mock("@auth/drizzle-adapter", () => ({
  DrizzleAdapter: vi.fn(),
}));

// Mock Radix UI Portal for static rendering
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
  };
});

// Hoisted DB mocks
const { mockSelect, mockFrom, mockWhere, mockInsert, mockValues } = vi.hoisted(() => {
  const mockValues = vi.fn().mockResolvedValue([]);
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockFrom = vi.fn().mockImplementation(() => ({ where: mockWhere }));
  const mockInsert = vi.fn().mockImplementation(() => ({ values: mockValues }));
  const mockSelect = vi.fn().mockImplementation(() => ({ from: mockFrom }));

  return { mockSelect, mockFrom, mockWhere, mockInsert, mockValues };
});

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(async (password: string, hash: string) => password === hash),
  },
}));

import { parseDni, DniScannerDialog } from "@/components/auth/dni-scanner-dialog";
import { authorizeCredentials } from "@/auth";
import LoginPage from "@/app/auth/login/page";

describe("DNI Login & Scanner Feature (Task 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DNI Barcode Parsing (parseDni)", () => {
    it("extracts 8-digit DNI from Argentine PDF417 format string", () => {
      const barcodeRaw = "00123456789@PEREZ@JUAN CARLOS@M@38123456@A@15/04/1994@02/05/2014@204";
      expect(parseDni(barcodeRaw)).toBe("38123456");
    });

    it("extracts DNI from short barcode format starting with @", () => {
      const barcodeRaw = "@GONZALEZ@MARIO@M@40987654@B@10/10/1998";
      expect(parseDni(barcodeRaw)).toBe("40987654");
    });

    it("extracts DNI formatted with dots (e.g. 38.123.456)", () => {
      expect(parseDni("38.123.456")).toBe("38123456");
    });

    it("handles raw 7-digit and 8-digit numbers", () => {
      expect(parseDni("38123456")).toBe("38123456");
      expect(parseDni("7654321")).toBe("7654321");
    });

    it("returns null for invalid strings or empty values", () => {
      expect(parseDni("")).toBeNull();
      expect(parseDni("texto-sin-numeros")).toBeNull();
      expect(parseDni("123")).toBeNull();
    });
  });

  describe("DNI Scanner Dialog (DniScannerDialog)", () => {
    it("renders dialog when open", () => {
      const html = renderToStaticMarkup(
        <DniScannerDialog open={true} onOpenChange={vi.fn()} onDniScanned={vi.fn()} />
      );

      expect(html).toContain("Escanear DNI");
      expect(html).toContain("Demo Chofer");
      expect(html).toContain("38.123.456");
    });
  });

  describe("Authorize via DNI in auth.ts", () => {
    it("authenticates demo chofer account when dni is 38123456", async () => {
      // Mock db returns nothing so fallback demo is used
      mockWhere.mockResolvedValueOnce([]);

      const user = await authorizeCredentials({
        dni: "38123456",
        password: "anypassword",
      });

      expect(user).toBeDefined();
      expect(user?.role).toBe("CHOFER");
      expect(user?.id).toBe("chofer-id");
      expect(user?.email).toBe("chofer@test.com");
    });

    it("authenticates registered user by DNI with valid password", async () => {
      mockWhere.mockResolvedValueOnce([
        {
          id: "user-chofer-db",
          name: "Carlos Chofer",
          email: "carlos@transporte.com",
          role: "CHOFER",
          dni: "35999888",
          passwordHash: "correct_password",
          empresaId: 2,
          mustChangePassword: 0,
        },
      ]);

      const user = await authorizeCredentials({
        dni: "35999888",
        password: "correct_password",
      });

      expect(user).toBeDefined();
      expect(user?.id).toBe("user-chofer-db");
      expect(user?.name).toBe("Carlos Chofer");
      expect(user?.role).toBe("CHOFER");
    });

    it("rejects login by DNI if password does not match", async () => {
      mockWhere.mockResolvedValueOnce([
        {
          id: "user-chofer-db",
          name: "Carlos Chofer",
          email: "carlos@transporte.com",
          role: "CHOFER",
          dni: "35999888",
          passwordHash: "correct_password",
          empresaId: 2,
          mustChangePassword: 0,
        },
      ]);

      const user = await authorizeCredentials({
        dni: "35999888",
        password: "wrong_password",
      });

      expect(user).toBeNull();
    });

    it("continues to support admin email login", async () => {
      mockWhere.mockResolvedValueOnce([]);

      const user = await authorizeCredentials({
        email: "admin@test.com",
        password: "anypassword",
      });

      expect(user).toBeDefined();
      expect(user?.role).toBe("SUPER_ADMIN");
      expect(user?.id).toBe("admin-id");
    });
  });

  describe("Login Page Tabs & UI (LoginPage)", () => {
    it("renders Empresa/Admin and Chofer login tabs with DNI scan trigger", () => {
      const html = renderToStaticMarkup(<LoginPage />);

      expect(html).toContain("Empresa");
      expect(html).toContain("Chofer");
      expect(html).toContain("DNI");
      expect(html).toContain("Escanear DNI");
    });
  });
});
