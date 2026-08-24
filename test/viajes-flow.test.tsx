import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocationSelector } from "@/components/control-flota/viajes/location-selector";
import {
  ViajeFormDialog,
  CreateViajeDialog,
  CancelViajeDialog,
} from "@/components/control-flota/viajes/viaje-form-dialog";
import { ViajesTable } from "@/components/control-flota/viajes/viajes-table";
import type { ViajeRow, SitioRow, ChoferRow } from "@/types/flota-viajes";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/panel/control-flota/viajes",
}));

// Mock flota actions
vi.mock("@/lib/flota-actions", () => ({
  getViajes: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getChoferes: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getSitios: vi.fn().mockResolvedValue({ success: true, data: [] }),
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

vi.mock("@radix-ui/react-select", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-select");
  return {
    ...actual,
    Root: ({ children, defaultValue, value }: any) => <div data-select-root="" data-value={value || defaultValue}>{children}</div>,
    Trigger: ({ children, ...props }: any) => <button type="button" {...props}>{children}</button>,
    Value: ({ children, placeholder }: any) => <span>{children || placeholder}</span>,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
    Content: ({ children, ...props }: any) => <div data-radix-select-content="" {...props}>{children}</div>,
    Viewport: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Item: ({ children, value, ...props }: any) => <div data-value={value} {...props}>{children} {value}</div>,
    ItemText: ({ children }: any) => <span>{children}</span>,
    ItemIndicator: ({ children }: any) => <span>{children}</span>,
    ScrollUpButton: () => null,
    ScrollDownButton: () => null,
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

const mockChoferesTest: ChoferRow[] = [
  {
    id: 1,
    empresaId: 1,
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
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Roberto",
    apellido: "González",
    dni: "28444555",
    telefono: "+54 9 11 9876 5432",
    email: "roberto.gonzalez@flota.local",
    licenciaNumero: "LIC-E1-28444555",
    licenciaCategoria: "E1",
    licenciaVencimiento: new Date("2026-09-10"),
    estado: "ACTIVO",
    vehiculoHabitualId: 2,
    vehiculoHabitualPatente: "EF 456 GH",
    vehiculoHabitualModelo: "Scania R450",
    notas: null,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
];

const mockVehiclesTest = [
  { id: 1, patente: "AB 123 CD", marca: "Ford", modelo: "Ranger" },
  { id: 2, patente: "EF 456 GH", marca: "Scania", modelo: "R450" },
];

const mockViajesTest: ViajeRow[] = [
  {
    id: 1,
    empresaId: 1,
    codigo: "VIA-1001",
    choferId: 1,
    choferNombre: "Juan Carlos Pérez",
    vehiculoId: 1,
    vehiculoPatente: "AB 123 CD",
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
    choferId: 2,
    choferNombre: "Roberto González",
    vehiculoId: 2,
    vehiculoPatente: "EF 456 GH",
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
  {
    id: 4,
    empresaId: 1,
    codigo: "VIA-1004",
    choferId: null,
    choferNombre: null,
    vehiculoId: null,
    vehiculoPatente: null,
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
    fechaSalidaProgramada: new Date("2026-08-19T10:00:00Z"),
    fechaLlegadaEstimada: new Date("2026-08-19T14:00:00Z"),
    fechaInicioReal: null,
    fechaFinReal: null,
    kmInicio: null,
    kmFin: null,
    estado: "CANCELADO",
    notas: "Cancelado por mantenimiento del cliente",
    creadoPor: "admin",
    createdAt: new Date("2026-08-18T11:00:00Z"),
    updatedAt: new Date("2026-08-19T08:00:00Z"),
  },
];

describe("Viajes & Location Selector Flow (/panel/control-flota/viajes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. LocationSelector Component", () => {
    it("renders both modes: Sitio Preconfigurado and Google Places / Geocoding search", () => {
      const html = renderToStaticMarkup(
        <LocationSelector
          label="Punto de Origen"
          sitios={mockSitiosTest}
          onLocationSelected={() => {}}
        />
      );

      expect(html).toContain("Punto de Origen");
      expect(html).toContain("Sitio Preconfigurado");
      expect(html).toContain("Búsqueda en Mapa");
      expect(html).toContain("Planta Zárate (Central)");
      expect(html).toContain("Depósito Logístico Rosario");
    });

    it("renders popular quick landmark buttons in Places mode", () => {
      const html = renderToStaticMarkup(
        <LocationSelector
          label="Punto de Destino"
          sitios={mockSitiosTest}
          initialMode="PLACES"
          onLocationSelected={() => {}}
        />
      );

      expect(html).toContain("Puerto Buenos Aires");
      expect(html).toContain("Aeropuerto Ezeiza");
      expect(html).toContain("Mercado Central");
      expect(html).toContain("Córdoba Centro");
    });

    it("displays visual badge with map pin icon when a location is selected", () => {
      const html = renderToStaticMarkup(
        <LocationSelector
          label="Punto de Origen"
          sitios={mockSitiosTest}
          value={{
            tipo: "SITIO",
            sitioId: 1,
            nombre: "Planta Zárate (Central)",
            direccion: "Ruta Panamericana Km 85.5",
            lat: -34.0987,
            lng: -59.0284,
          }}
          onLocationSelected={() => {}}
        />
      );

      expect(html).toContain("Planta Zárate (Central)");
      expect(html).toContain("Ruta Panamericana Km 85.5");
      expect(html).toContain("-34.0987");
      expect(html).toContain("-59.0284");
    });
  });

  describe("2. ViajeFormDialog Component", () => {
    it("renders creation dialog with all required fields (code, origin, destination, driver, vehicle, dates, notes)", () => {
      const html = renderToStaticMarkup(
        <ViajeFormDialog
          open={true}
          sitios={mockSitiosTest}
          choferes={mockChoferesTest}
          vehicles={mockVehiclesTest}
          trigger={<button>+ Nuevo Viaje</button>}
        />
      );

      expect(html).toContain("Nuevo Viaje");
      expect(html).toContain("Código de Viaje");
      expect(html).toContain("Punto de Origen");
      expect(html).toContain("Punto de Destino");
      expect(html).toContain("Chofer Asignado");
      expect(html).toContain("Vehículo Asignado");
      expect(html).toContain("Salida Programada");
      expect(html).toContain("Llegada Estimada");
      expect(html).toContain("Notas / Instrucciones");
      expect(html).toContain("Juan Carlos Pérez");
      expect(html).toContain("AB 123 CD");
    });

    it("renders CancelViajeDialog modal with confirmation message", () => {
      const html = renderToStaticMarkup(
        <CancelViajeDialog
          open={true}
          viaje={mockViajesTest[0]}
        />
      );

      expect(html).toContain("¿Cancelar viaje VIA-1001?");
      expect(html).toContain("Planta Zárate (Central)");
      expect(html).toContain("Depósito Logístico Rosario");
      expect(html).toContain("Confirmar Cancelación");
    });
  });

  describe("3. ViajesTable Component", () => {
    it("renders header with title Viajes y Despacho, dynamic count subtitle, and + Nuevo Viaje button", () => {
      const html = renderToStaticMarkup(
        <ViajesTable
          initialViajes={mockViajesTest}
          choferes={mockChoferesTest}
          sitios={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      expect(html).toContain("Viajes y Despacho");
      expect(html).toContain("4 de 4 viajes");
      expect(html).toContain("Nuevo Viaje");
    });

    it("renders inline status tabs with dynamic count badges and en-curso indicator", () => {
      const html = renderToStaticMarkup(
        <ViajesTable
          initialViajes={mockViajesTest}
          choferes={mockChoferesTest}
          sitios={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      expect(html).toContain("Todos");
      expect(html).toContain("Planificados");
      expect(html).toContain("En Curso");
      expect(html).toContain("Completados");
      expect(html).toContain("Cancelados");

      // Verify dynamic counts: Total: 4, Planificados: 1, En Curso: 1, Completados: 1, Cancelados: 1
      expect(html).toContain("(4)");
      expect(html).toContain("(1)");
    });

    it("renders search input with comprehensive placeholder", () => {
      const html = renderToStaticMarkup(
        <ViajesTable
          initialViajes={mockViajesTest}
          choferes={mockChoferesTest}
          sitios={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      expect(html).toContain("Buscar por código, origen, destino, chofer o patente");
    });

    it("renders enriched trip rows with code, badges, trajectory, driver, vehicle plate, km, and actions", () => {
      const html = renderToStaticMarkup(
        <ViajesTable
          initialViajes={mockViajesTest}
          choferes={mockChoferesTest}
          sitios={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      // Codes
      expect(html).toContain("VIA-1001");
      expect(html).toContain("VIA-1002");
      expect(html).toContain("VIA-1003");
      expect(html).toContain("VIA-1004");

      // Status badges
      expect(html).toContain("PLANIFICADO");
      expect(html).toContain("EN CURSO");
      expect(html).toContain("COMPLETADO");
      expect(html).toContain("CANCELADO");

      // Trajectory origins & destinations
      expect(html).toContain("Planta Zárate (Central)");
      expect(html).toContain("Depósito Logístico Rosario");
      expect(html).toContain("Puerto Buenos Aires");
      expect(html).toContain("Mercado Central");

      // Driver & Vehicle
      expect(html).toContain("Juan Carlos Pérez");
      expect(html).toContain("Roberto González");
      expect(html).toContain("AB 123 CD");
      expect(html).toContain("EF 456 GH");

      // Distance
      expect(html).toContain("235 km");
      expect(html).toContain("310 km");

      // Actions
      expect(html).toContain("Ver Ruta");
      expect(html).toContain("Cancelar");
    });

    it("renders empty state when no trips match or trip list is empty", () => {
      const html = renderToStaticMarkup(
        <ViajesTable
          initialViajes={[]}
          choferes={mockChoferesTest}
          sitios={mockSitiosTest}
          vehicles={mockVehiclesTest}
        />
      );

      expect(html).toContain("No se encontraron viajes");
      expect(html).toContain("0 de 0 viajes");
    });
  });
});
