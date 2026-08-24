import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChoferCredentialsDialog } from "@/components/control-flota/choferes/chofer-credentials-dialog";
import { ChoferDniViewerDialog } from "@/components/control-flota/choferes/chofer-dni-viewer-dialog";
import { GET } from "@/app/api/sitios/route";
import { MOCK_SITIOS_BAHIA_BLANCA } from "@/lib/sitios-mock";
import type { ChoferRow } from "@/types/flota-viajes";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock flota actions
vi.mock("@/lib/flota-actions", () => ({
  updateChoferCredentials: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock alerts
vi.mock("@/lib/alerts", () => ({
  appAlert: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock NextAuth
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "1", role: "ADMIN_EMPRESA", empresaId: 1 },
  }),
}));

// Mock Radix UI Dialog Portal
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
  };
});

const mockChoferWithDni: ChoferRow = {
  id: 1,
  empresaId: 1,
  userId: "usr-1",
  nombre: "Carlos",
  apellido: "Gómez",
  dni: "35111222",
  telefono: "+5492914001122",
  email: "carlos@flota.local",
  licenciaNumero: "B1-35111222",
  licenciaCategoria: "B1",
  licenciaVencimiento: new Date("2027-10-15"),
  estado: "ACTIVO",
  vehiculoHabitualId: 2,
  notas: "Turno mañana",
  fotoDniFrente: "data:image/png;base64,mockFrenteImage",
  fotoDniDorso: "data:image/png;base64,mockDorsoImage",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const mockChoferWithoutDni: ChoferRow = {
  id: 2,
  empresaId: 1,
  userId: null,
  nombre: "Mariana",
  apellido: "Pérez",
  dni: "38999000",
  telefono: "+5492914556677",
  email: null,
  licenciaNumero: null,
  licenciaCategoria: null,
  licenciaVencimiento: null,
  estado: "ACTIVO",
  vehiculoHabitualId: null,
  notas: null,
  fotoDniFrente: null,
  fotoDniDorso: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("Chofer Credentials & DNI Documentation Management", () => {
  describe("ChoferCredentialsDialog", () => {
    it("renders driver information and active account status", () => {
      const html = renderToStaticMarkup(
        <ChoferCredentialsDialog
          chofer={mockChoferWithDni}
          open={true}
        />
      );

      expect(html).toContain("Gestión de Credenciales");
      expect(html).toContain("35111222");
      expect(html).toContain("Cuenta activa");
      expect(html).toContain("Actualizar Contraseña");
    });

    it("displays unlinked account warning when driver has no userId", () => {
      const html = renderToStaticMarkup(
        <ChoferCredentialsDialog
          chofer={mockChoferWithoutDni}
          open={true}
        />
      );

      expect(html).toContain("Sin cuenta vinculada");
      expect(html).toContain("Crear Cuenta de Acceso");
    });
  });

  describe("ChoferDniViewerDialog", () => {
    it("renders digitized DNI images when uploaded", () => {
      const html = renderToStaticMarkup(
        <ChoferDniViewerDialog
          chofer={mockChoferWithDni}
          open={true}
        />
      );

      expect(html).toContain("Legajo Documental: DNI del Chofer");
      expect(html).toContain("Documento Digitalizado");
      expect(html).toContain("mockFrenteImage");
      expect(html).toContain("mockDorsoImage");
    });

    it("renders fallback placeholders when photos are missing", () => {
      const html = renderToStaticMarkup(
        <ChoferDniViewerDialog
          chofer={mockChoferWithoutDni}
          open={true}
        />
      );

      expect(html).toContain("Sin foto cargada");
      expect(html).toContain("No se ha cargado foto del frente");
      expect(html).toContain("No se ha cargado foto del dorso");
    });
  });

  describe("GET /api/sitios Route (Bahía Blanca Fallback)", () => {
    it("returns Bahía Blanca sites as fallback", async () => {
      const response = await GET();
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(MOCK_SITIOS_BAHIA_BLANCA.length);
      expect(data[0].ciudad).toBe("Bahía Blanca");
      expect(data[0].lat).toBeCloseTo(-38.7885, 3);
      expect(data[0].lng).toBeCloseTo(-62.2745, 3);
    });
  });
});
