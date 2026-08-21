import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VehiculosTable, VehiculoRow } from "@/components/dashboard/vehiculos/vehiculos-table";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/panel/control-flota/vehiculos",
}));

vi.mock("@/lib/vehicle-actions", () => ({
  createVehicle: vi.fn().mockResolvedValue({ success: true }),
  updateVehicle: vi.fn().mockResolvedValue({ success: true }),
  deleteVehicle: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Radix UI Portal for static rendering in tests
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
    Content: ({ children, sideOffset, align, ...props }: any) => <div {...props}>{children}</div>,
    Item: ({ children, asChild, ...props }: any) => <div {...props}>{children}</div>,
    Separator: () => <hr />,
  };
});

const mockVehiculosTest: VehiculoRow[] = [
  {
    id: 1,
    patente: "AA123BB",
    marca: "Scania",
    modelo: "R450",
    anio: 2022,
    tipo: "Camión",
    chasis: "9BS12345678901234",
    kilometrajeActual: 145000,
    rto: new Date(2026, 11, 31), // Vigente (31/12/2026)
    docCount: 3,
  },
  {
    id: 2,
    patente: "AC456DD",
    marca: "Toyota",
    modelo: "Hilux",
    anio: 2021,
    tipo: "Camioneta",
    chasis: "8AJ98765432109876",
    kilometrajeActual: 82500,
    rto: new Date(2025, 0, 1), // Vencido (01/01/2025)
    docCount: 1,
  },
  {
    id: 3,
    patente: "AD789EE",
    marca: "Mercedes-Benz",
    modelo: "Sprinter",
    anio: 2023,
    tipo: "Utilitario",
    chasis: null,
    kilometrajeActual: 35000,
    rto: null, // Sin RTO
    docCount: 0,
  },
];

describe("VehiculosTable Rediseñado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Header & Subtitle", () => {
    it("renders compact header with title, fleet count subtitle, and CreateVehicleDialog button", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      expect(html).toContain("Vehículos");
      expect(html).toContain("3 de 3 vehículos en tu flota");
      expect(html).toContain("Agregar Vehículo");
    });
  });

  describe("2. Status Tabs with Micro-Counters", () => {
    it("renders inline tabs with dynamic count badges for Todos, RTO Vigente, RTO Vencido, and Sin RTO", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      expect(html).toContain("Todos");
      expect(html).toContain("RTO Vigente");
      expect(html).toContain("RTO Vencido");
      expect(html).toContain("Sin RTO");

      // Verify exact counts
      expect(html).toContain("(3)");
      expect(html).toContain("(1)"); // 1 vigente, 1 vencido, 1 sin rto
    });
  });

  describe("3. Quick Filter Bar", () => {
    it("renders universal search input and vehicle type select dropdown", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      expect(html).toContain("Buscar por patente, marca, modelo, chasis o tipo...");
      expect(html).toContain("Todos los tipos");
      expect(html).toContain("Camión");
      expect(html).toContain("Camioneta");
      expect(html).toContain("Utilitario");
      expect(html).toContain("Auto");
    });
  });

  describe("4. Enriched Columns and Badges", () => {
    it("renders license plate badge, brand/model, year subtext, and vehicle type icon", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      expect(html).toContain("AA123BB");
      expect(html).toContain("AC456DD");
      expect(html).toContain("AD789EE");

      expect(html).toContain("Scania");
      expect(html).toContain("R450");
      expect(html).toContain("2022");

      expect(html).toContain("Toyota");
      expect(html).toContain("Hilux");
      expect(html).toContain("2021");
    });

    it("renders monospace VIN/chasis with copy action when present, and placeholder when null", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      expect(html).toContain("9BS12345678901234");
      expect(html).toContain("8AJ98765432109876");
    });

    it("renders formatted odometer in Argentine locale format with km", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      // 145000 -> 145.000 km, 82500 -> 82.500 km
      expect(html).toMatch(/145[.,]000\s*km/);
      expect(html).toMatch(/82[.,]500\s*km/);
      expect(html).toMatch(/35[.,]000\s*km/);
    });

    it("renders RTO status badges with formatted date: Vigente (emerald), Vencido (destructive), and Sin registrar (muted)", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      expect(html).toContain("31/12/2026");
      expect(html).toContain("Vigente");
      expect(html).toContain("01/01/2025");
      expect(html).toContain("Vencido");
      expect(html).toContain("Sin registrar");
    });

    it("renders documentation count badge with link to vehicle documentation tab", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      expect(html).toContain("/panel/control-flota/vehiculos/1?tab=documentacion");
      expect(html).toContain("/panel/control-flota/vehiculos/2?tab=documentacion");
      expect(html).toContain("/panel/control-flota/vehiculos/3?tab=documentacion");
    });
  });

  describe("5. Quick Action Links and Context Menu", () => {
    it("renders direct action buttons 'Ver Ficha' and 'Ver en Mapa'", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      expect(html).toContain("/panel/control-flota/vehiculos/1");
      expect(html).toContain("/panel/mapa?patente=AA123BB");
      expect(html).toContain("Ver Ficha");
      expect(html).toContain("Ver en Mapa");
    });

    it("renders context dropdown menu with options to edit, view docs, and delete", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      expect(html).toContain("Editar Vehículo");
      expect(html).toContain("Ver Documentación");
      expect(html).toContain("Eliminar Vehículo");
    });
  });

  describe("6. Sorting Headers", () => {
    it("renders sortable headers for patente, año, chasis, km, rto, and docs", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
      expect(html).toContain("Patente");
      expect(html).toContain("Vehículo / Año");
      expect(html).toContain("Chasis / VIN");
      expect(html).toContain("Kilometraje");
      expect(html).toContain("RTO / VTV");
      expect(html).toContain("Documentos");
    });
  });

  describe("7. Empty State", () => {
    it("renders modern empty state message when vehicles list is empty", () => {
      const html = renderToStaticMarkup(<VehiculosTable vehicles={[]} />);
      expect(html).toContain("No se encontraron vehículos");
      expect(html).toContain("0 de 0 vehículos en tu flota");
    });
  });
});
