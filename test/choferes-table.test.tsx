import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChoferesTable } from "@/components/control-flota/choferes/choferes-table";
import { ChoferFormDialog } from "@/components/control-flota/choferes/chofer-form-dialog";
import type { ChoferRow } from "@/types/flota-viajes";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/panel/control-flota/choferes",
}));

// Mock flota actions
vi.mock("@/lib/flota-actions", () => ({
  getChoferes: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createChofer: vi.fn().mockResolvedValue({ success: true }),
  updateChofer: vi.fn().mockResolvedValue({ success: true }),
  deleteChofer: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock alerts
vi.mock("@/lib/alerts", () => ({
  appAlert: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    confirm: vi.fn(),
    modal: vi.fn(),
  },
}));

// Mock Radix UI Portal and Dialog for static rendering
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
  };
});

vi.mock("@radix-ui/react-dropdown-menu", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-dropdown-menu");
  return {
    ...actual,
    Root: ({ children }: any) => <div>{children}</div>,
    Trigger: ({ children }: any) => <div>{children}</div>,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
    Content: ({ children, sideOffset, align, alignOffset, avoidCollisions, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    Item: ({ children, asChild, ...props }: any) => <div {...props}>{children}</div>,
    Separator: () => <hr />,
  };
});

const mockChoferesTest: ChoferRow[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Juan",
    apellido: "Pérez",
    dni: "30111222",
    telefono: "+54 9 11 2345 6789",
    email: "juan.perez@transporte.com",
    licenciaNumero: "LIC-B1-30111222",
    licenciaCategoria: "B1",
    licenciaVencimiento: new Date(2027, 5, 20), // Vigente
    estado: "ACTIVO",
    vehiculoHabitualId: 10,
    vehiculoHabitualPatente: "AA123BB",
    vehiculoHabitualModelo: "Scania R450",
    notas: "Chofer principal turno mañana",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Carlos",
    apellido: "González",
    dni: "28444555",
    telefono: "+54 9 11 9876 5432",
    email: "carlos.gonzalez@transporte.com",
    licenciaNumero: "LIC-E1-28444555",
    licenciaCategoria: "E1",
    licenciaVencimiento: new Date(2025, 0, 15), // Vencida
    estado: "LICENCIA_SUSPENDIDA",
    vehiculoHabitualId: null,
    vehiculoHabitualPatente: null,
    vehiculoHabitualModelo: null,
    notas: null,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: 3,
    empresaId: 1,
    nombre: "Roberto",
    apellido: "Martínez",
    dni: "33888999",
    telefono: "+54 9 11 4455 6677",
    email: "roberto.martinez@transporte.com",
    licenciaNumero: "LIC-C1-33888999",
    licenciaCategoria: "C1",
    licenciaVencimiento: new Date(2026, 8, 1), // Por vencer
    estado: "INACTIVO",
    vehiculoHabitualId: 12,
    vehiculoHabitualPatente: "AC456DD",
    vehiculoHabitualModelo: "Toyota Hilux",
    notas: "Licencia de prueba",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
];

const mockVehiclesList = [
  { id: 10, patente: "AA123BB", marca: "Scania", modelo: "R450" },
  { id: 12, patente: "AC456DD", marca: "Toyota", modelo: "Hilux" },
];

describe("Choferes Management Module (/panel/control-flota/choferes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Header & Driver Creation Dialog Trigger", () => {
    it("renders title Choferes, dynamic driver count subtitle, and + Nuevo Chofer button", () => {
      const html = renderToStaticMarkup(
        <ChoferesTable initialChoferes={mockChoferesTest} vehicles={mockVehiclesList} />
      );

      expect(html).toContain("Choferes");
      expect(html).toContain("3 de 3 choferes");
      expect(html).toContain("Nuevo Chofer");
    });
  });

  describe("2. Inline Status Tabs with Micro-Counters", () => {
    it("renders status tabs with dynamic count badges for Todos, Activos, Licencia por Vencer, and Inactivos", () => {
      const html = renderToStaticMarkup(
        <ChoferesTable initialChoferes={mockChoferesTest} vehicles={mockVehiclesList} />
      );

      expect(html).toContain("Todos");
      expect(html).toContain("Activos");
      expect(html).toContain("Licencia por Vencer");
      expect(html).toContain("Inactivos");

      // Verify badges contain counts
      expect(html).toContain("(3)"); // Todos = 3
      expect(html).toContain("(1)"); // Activos = 1
      expect(html).toContain("(2)"); // Inactivos/Licencia suspendida = 2
    });
  });

  describe("3. Quick Filter Bar", () => {
    it("renders search input and category filter dropdown", () => {
      const html = renderToStaticMarkup(
        <ChoferesTable initialChoferes={mockChoferesTest} vehicles={mockVehiclesList} />
      );

      expect(html).toContain("Buscar por nombre, apellido, DNI, teléfono, email o licencia");
      expect(html).toContain("Todas las categorías");
      expect(html).toContain("B1");
      expect(html).toContain("C1");
      expect(html).toContain("E1");
    });
  });

  describe("4. Enriched Columns and Data Display", () => {
    it("renders Chofer column with initials avatar, full name, and monospace DNI badge", () => {
      const html = renderToStaticMarkup(
        <ChoferesTable initialChoferes={mockChoferesTest} vehicles={mockVehiclesList} />
      );

      expect(html).toContain("Juan Pérez");
      expect(html).toContain("30111222");
      expect(html).toContain("Carlos González");
      expect(html).toContain("28444555");
      expect(html).toContain("Roberto Martínez");
      expect(html).toContain("33888999");
      expect(html).toContain("JP");
      expect(html).toContain("CG");
      expect(html).toContain("RM");
    });

    it("renders Licencia column with category badge, license number, and expiration status", () => {
      const html = renderToStaticMarkup(
        <ChoferesTable initialChoferes={mockChoferesTest} vehicles={mockVehiclesList} />
      );

      expect(html).toContain("LIC-B1-30111222");
      expect(html).toContain("LIC-E1-28444555");
      expect(html).toContain("LIC-C1-33888999");
      expect(html).toContain("Vigente");
      expect(html).toContain("Vencida");
    });

    it("renders Contact column with WhatsApp wa.me link and Email", () => {
      const html = renderToStaticMarkup(
        <ChoferesTable initialChoferes={mockChoferesTest} vehicles={mockVehiclesList} />
      );

      expect(html).toContain("wa.me");
      expect(html).toContain("juan.perez@transporte.com");
      expect(html).toContain("carlos.gonzalez@transporte.com");
    });

    it("renders Assigned Vehicle column with plate in monospace badge or Sin asignar", () => {
      const html = renderToStaticMarkup(
        <ChoferesTable initialChoferes={mockChoferesTest} vehicles={mockVehiclesList} />
      );

      expect(html).toContain("AA123BB");
      expect(html).toContain("AC456DD");
      expect(html).toContain("Sin asignar");
    });

    it("renders Estado badge with proper status indicators", () => {
      const html = renderToStaticMarkup(
        <ChoferesTable initialChoferes={mockChoferesTest} vehicles={mockVehiclesList} />
      );

      expect(html).toContain("Activo");
      expect(html).toContain("Inactivo");
      expect(html).toContain("Licencia suspendida");
    });
  });

  describe("5. Quick Action Links & Dropdown Menu", () => {
    it("renders action options for editing driver, changing status, and deleting driver", () => {
      const html = renderToStaticMarkup(
        <ChoferesTable initialChoferes={mockChoferesTest} vehicles={mockVehiclesList} />
      );

      expect(html).toContain("Editar Chofer");
      expect(html).toContain("Cambiar estado");
      expect(html).toContain("Eliminar Chofer");
    });
  });

  describe("6. Empty State", () => {
    it("renders empty state message when no drivers match or table is empty", () => {
      const html = renderToStaticMarkup(
        <ChoferesTable initialChoferes={[]} vehicles={mockVehiclesList} />
      );

      expect(html).toContain("No se encontraron choferes");
      expect(html).toContain("0 de 0 choferes");
    });
  });

  describe("7. Chofer Form Dialog Rendering", () => {
    it("renders modal form with all mandatory and optional fields including credential generation switch", () => {
      const html = renderToStaticMarkup(
        <ChoferFormDialog
          open={true}
          vehicles={mockVehiclesList}
          trigger={<button>Open Form</button>}
        />
      );

      expect(html).toContain("Nombre");
      expect(html).toContain("Apellido");
      expect(html).toContain("DNI");
      expect(html).toContain("Teléfono");
      expect(html).toContain("Email");
      expect(html).toContain("Número de Licencia");
      expect(html).toContain("Categoría");
      expect(html).toContain("Vencimiento Licencia");
      expect(html).toContain("Vehículo Habitual");
      expect(html).toContain("Generar credenciales de acceso al sistema para el Chofer");
    });
  });
});
