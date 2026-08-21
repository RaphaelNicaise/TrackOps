import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChoferDashboard } from "@/components/chofer/chofer-dashboard";
import ChoferPage from "@/app/panel/chofer/page";
import { adminNav, navByRole } from "@/components/layout/app-sidebar";
import type { ViajeRow, SitioRow, ChoferRow } from "@/types/flota-viajes";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/panel/chofer",
}));

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-chofer-1",
      name: "Juan Carlos Pérez",
      email: "juan.perez@flota.local",
      role: "CHOFER",
      empresaId: 1,
    },
  }),
}));

// Mock flota actions
vi.mock("@/lib/flota-actions", () => ({
  getViajes: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getChoferes: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getSitios: vi.fn().mockResolvedValue({ success: true, data: [] }),
  iniciarViajeChofer: vi.fn().mockResolvedValue({ success: true }),
  finalizarViajeChofer: vi.fn().mockResolvedValue({ success: true }),
  createViaje: vi.fn().mockResolvedValue({ success: true }),
  cancelarViaje: vi.fn().mockResolvedValue({ success: true }),
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

const mockDriver: ChoferRow = {
  id: 1,
  empresaId: 1,
  userId: "user-chofer-1",
  nombre: "Juan Carlos",
  apellido: "Pérez",
  dni: "30111222",
  telefono: "+54 9 11 2345 6789",
  email: "juan.perez@flota.local",
  licenciaNumero: "LIC-B1-30111222",
  licenciaCategoria: "B1",
  licenciaVencimiento: new Date("2027-08-15"),
  estado: "ACTIVO",
  vehiculoHabitualId: 1,
  vehiculoHabitualPatente: "AB 123 CD",
  vehiculoHabitualModelo: "Ford Ranger",
  notas: "Chofer asignado a rutas regionales",
  createdAt: new Date("2024-01-10"),
  updatedAt: new Date("2024-01-10"),
};

const mockSitiosTest: SitioRow[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Planta Zárate (Central)",
    tipo: "PLANTA",
    direccion: "Ruta Panamericana Km 85.5",
    ciudad: "Zárate",
    provincia: "Buenos Aires",
    lat: -34.0987,
    lng: -59.0284,
    radioMetros: 250,
    contactoNombre: "Carlos Gómez",
    contactoTelefono: "+54 9 3487 112233",
    activo: 1,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Depósito Logístico Rosario",
    tipo: "DEPOSITO",
    direccion: "Av. Circunvalación 1200",
    ciudad: "Rosario",
    provincia: "Santa Fe",
    lat: -32.9511,
    lng: -60.6664,
    radioMetros: 150,
    contactoNombre: "Mariana López",
    contactoTelefono: "+54 9 341 5566778",
    activo: 1,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
];

const mockVehiclesTest = [
  { id: 1, patente: "AB 123 CD", marca: "Ford", modelo: "Ranger" },
  { id: 2, patente: "EF 456 GH", marca: "Scania", modelo: "R450" },
];

const mockTripsTest: ViajeRow[] = [
  {
    id: 1,
    empresaId: 1,
    codigo: "VIA-1001",
    choferId: 1,
    choferNombre: "Juan Carlos Pérez",
    vehiculoId: 1,
    vehiculoPatente: "AB 123 CD",
    vehiculoModelo: "Ford Ranger",
    origenTipo: "SITIO",
    origenSitioId: 1,
    origenNombre: "Planta Zárate (Central)",
    origenDireccion: "Ruta Panamericana Km 85.5",
    origenLat: -34.0987,
    origenLng: -59.0284,
    destinoTipo: "SITIO",
    destinoSitioId: 2,
    destinoNombre: "Depósito Logístico Rosario",
    destinoDireccion: "Av. Circunvalación 1200",
    destinoLat: -32.9511,
    destinoLng: -60.6664,
    distanciaEstimadaKm: 235,
    fechaSalidaProgramada: new Date("2026-08-25T08:00:00Z"),
    fechaLlegadaEstimada: new Date("2026-08-25T12:30:00Z"),
    fechaInicioReal: null,
    fechaFinReal: null,
    kmInicio: null,
    kmFin: null,
    estado: "PLANIFICADO",
    notas: "Carga de repuestos industriales",
    creadoPor: "admin",
    createdAt: new Date("2026-08-20T10:00:00Z"),
    updatedAt: new Date("2026-08-20T10:00:00Z"),
  },
  {
    id: 2,
    empresaId: 1,
    codigo: "VIA-1002",
    choferId: 1,
    choferNombre: "Juan Carlos Pérez",
    vehiculoId: 1,
    vehiculoPatente: "AB 123 CD",
    vehiculoModelo: "Ford Ranger",
    origenTipo: "SITIO",
    origenSitioId: 2,
    origenNombre: "Depósito Logístico Rosario",
    origenDireccion: "Av. Circunvalación 1200",
    origenLat: -32.9511,
    origenLng: -60.6664,
    destinoTipo: "GOOGLE_PLACES",
    destinoSitioId: null,
    destinoNombre: "Puerto Buenos Aires",
    destinoDireccion: "Av. Ramón S. Castillo, Retiro, CABA",
    destinoLat: -34.5822,
    destinoLng: -58.3712,
    distanciaEstimadaKm: 310,
    fechaSalidaProgramada: new Date("2026-08-21T06:00:00Z"),
    fechaLlegadaEstimada: new Date("2026-08-21T11:00:00Z"),
    fechaInicioReal: new Date("2026-08-21T06:05:00Z"),
    fechaFinReal: null,
    kmInicio: 145200,
    kmFin: null,
    estado: "EN_CURSO",
    notas: "Entrega urgente de contenedores",
    creadoPor: "admin",
    createdAt: new Date("2026-08-19T14:00:00Z"),
    updatedAt: new Date("2026-08-21T06:05:00Z"),
  },
  {
    id: 3,
    empresaId: 1,
    codigo: "VIA-1003",
    choferId: 1,
    choferNombre: "Juan Carlos Pérez",
    vehiculoId: 1,
    vehiculoPatente: "AB 123 CD",
    vehiculoModelo: "Ford Ranger",
    origenTipo: "SITIO",
    origenSitioId: 1,
    origenNombre: "Planta Zárate (Central)",
    origenDireccion: "Ruta Panamericana Km 85.5",
    origenLat: -34.0987,
    origenLng: -59.0284,
    destinoTipo: "GOOGLE_PLACES",
    destinoSitioId: null,
    destinoNombre: "Mercado Central",
    destinoDireccion: "Autopista Ricchieri y Boulogne Sur Mer, Tapiales",
    destinoLat: -34.7119,
    destinoLng: -58.4875,
    distanciaEstimadaKm: 98,
    fechaSalidaProgramada: new Date("2026-08-18T07:00:00Z"),
    fechaLlegadaEstimada: new Date("2026-08-18T09:30:00Z"),
    fechaInicioReal: new Date("2026-08-18T07:02:00Z"),
    fechaFinReal: new Date("2026-08-18T09:25:00Z"),
    kmInicio: 144800,
    kmFin: 144905,
    estado: "COMPLETADO",
    notas: "Completado sin novedades",
    creadoPor: "admin",
    createdAt: new Date("2026-08-17T09:00:00Z"),
    updatedAt: new Date("2026-08-18T09:25:00Z"),
  },
];

describe("Driver Dashboard & Panel Chofer (/panel/chofer)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. ChoferDashboard Header & Fuel Link", () => {
    it("renders driver information (name, status, vehicle plate) and combustible action button", () => {
      const html = renderToStaticMarkup(
        <ChoferDashboard
          driver={mockDriver}
          trips={mockTripsTest}
          sites={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      expect(html).toContain("Juan Carlos Pérez");
      expect(html).toContain("ACTIVO");
      expect(html).toContain("AB 123 CD");
      expect(html).toContain("/panel/control-flota/combustible");
    });
  });

  describe("2. Active Trip Section (En Curso)", () => {
    it("renders prominent active trip card with trajectory, kmInicio, GPS route link and Finalizar button", () => {
      const html = renderToStaticMarkup(
        <ChoferDashboard
          driver={mockDriver}
          trips={mockTripsTest}
          sites={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      expect(html).toContain("Viaje en Curso");
      expect(html).toContain("VIA-1002");
      expect(html).toContain("Depósito Logístico Rosario");
      expect(html).toContain("Puerto Buenos Aires");
      expect(html).toContain("145.200");
      expect(html).toContain("Ver Ruta en GPS / Google Maps");
      expect(html).toContain("Finalizar Viaje");
    });

    it("renders clear empty state when no trip is active", () => {
      const noActiveTrips = mockTripsTest.filter((t) => t.estado !== "EN_CURSO");
      const html = renderToStaticMarkup(
        <ChoferDashboard
          driver={mockDriver}
          trips={noActiveTrips}
          sites={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      expect(html).toContain("Sin viaje en curso");
    });
  });

  describe("3. Scheduled Trips Section (Planificados)", () => {
    it("renders assigned planned trips with code, trajectory, vehicle, and Iniciar Viaje action", () => {
      const html = renderToStaticMarkup(
        <ChoferDashboard
          driver={mockDriver}
          trips={mockTripsTest}
          sites={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      expect(html).toContain("Próximos Viajes Asignados");
      expect(html).toContain("VIA-1001");
      expect(html).toContain("Planta Zárate (Central)");
      expect(html).toContain("Iniciar Viaje");
    });
  });

  describe("4. Free / Express Trip Quick Start", () => {
    it("renders button to start a new free trip with location selector dialog", () => {
      const html = renderToStaticMarkup(
        <ChoferDashboard
          driver={mockDriver}
          trips={mockTripsTest}
          sites={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      expect(html).toContain("Iniciar Nuevo Viaje Libre");
    });
  });

  describe("5. Completed Trips History", () => {
    it("renders history of completed trips with code, trajectory, and total km", () => {
      const html = renderToStaticMarkup(
        <ChoferDashboard
          driver={mockDriver}
          trips={mockTripsTest}
          sites={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      expect(html).toContain("Historial de Viajes");
      expect(html).toContain("VIA-1003");
      expect(html).toContain("Mercado Central");
      expect(html).toContain("105 km");
    });
  });

  describe("6. Server Page Rendering (/panel/chofer)", () => {
    it("renders the ChoferPage server component", async () => {
      const page = await ChoferPage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain("Juan Carlos");
      expect(html).toContain("Combustible");
    });
  });

  describe("7. Sidebar Navigation Updates", () => {
    it("should contain Choferes, Viajes and Sitios under Control de Flota in adminNav", () => {
      const controlFlotaGroup = adminNav.find((g) => g.label === "Control de Flota");
      expect(controlFlotaGroup).toBeDefined();

      const urls = controlFlotaGroup?.items.map((i) => i.url);
      expect(urls).toContain("/panel/control-flota/choferes");
      expect(urls).toContain("/panel/control-flota/viajes");
      expect(urls).toContain("/panel/control-flota/sitios");

      const choferesItem = controlFlotaGroup?.items.find(
        (i) => i.url === "/panel/control-flota/choferes"
      );
      expect(choferesItem?.title).toBe("Choferes");

      const viajesItem = controlFlotaGroup?.items.find(
        (i) => i.url === "/panel/control-flota/viajes"
      );
      expect(viajesItem?.title).toBe("Viajes");
    });

    it("should contain Mi Panel / Mis Viajes and Combustible in navByRole.CHOFER", () => {
      const choferNav = navByRole.CHOFER;
      expect(choferNav).toBeDefined();

      const allItems = choferNav.flatMap((g) => g.items);
      const urls = allItems.map((i) => i.url);

      expect(urls).toContain("/panel/chofer");
      expect(urls).toContain("/panel/control-flota/combustible");

      const panelItem = allItems.find((i) => i.url === "/panel/chofer");
      expect(panelItem?.title).toContain("Mi Panel");
    });
  });
});
