import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SitiosTable } from "@/components/control-flota/sitios/sitios-table";
import {
  SitioFormDialog,
  CreateSitioDialog,
  EditSitioDialog,
  DeleteSitioDialog,
} from "@/components/control-flota/sitios/sitio-form-dialog";
import type { SitioRow } from "@/types/flota-viajes";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/panel/control-flota/sitios",
}));

// Mock flota actions
vi.mock("@/lib/flota-actions", () => ({
  getSitios: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createSitio: vi.fn().mockResolvedValue({ success: true }),
  updateSitio: vi.fn().mockResolvedValue({ success: true }),
  deleteSitio: vi.fn().mockResolvedValue({ success: true }),
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

const mockSitiosTest: SitioRow[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Planta Zárate",
    tipo: "PLANTA",
    direccion: "Ruta 9 Km 85",
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
    nombre: "Depósito Central",
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
  {
    id: 3,
    empresaId: 1,
    nombre: "Cliente Cervecería Quilmes",
    tipo: "CLIENTE",
    direccion: "12 de Octubre 100",
    ciudad: "Quilmes",
    provincia: "Buenos Aires",
    lat: -34.7242,
    lng: -58.2608,
    radioMetros: 100,
    contactoNombre: "Esteban Rossi",
    contactoTelefono: "+54 9 11 4433 2211",
    activo: 1,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: 4,
    empresaId: 1,
    nombre: "Sucursal Córdoba",
    tipo: "SUCURSAL",
    direccion: "Av. Colón 4500",
    ciudad: "Córdoba",
    provincia: "Córdoba",
    lat: -31.4135,
    lng: -64.181,
    radioMetros: 100,
    contactoNombre: "Laura Medina",
    contactoTelefono: null,
    activo: 1,
    createdAt: new Date("2024-04-10"),
    updatedAt: new Date("2024-04-10"),
  },
];

describe("Sitios Management Module (/panel/control-flota/sitios)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Header & Site Creation Dialog Trigger", () => {
    it("renders title Sitios de Interés, dynamic site count subtitle, and + Nuevo Sitio button", () => {
      const html = renderToStaticMarkup(<SitiosTable initialSitios={mockSitiosTest} />);

      expect(html).toContain("Sitios de Interés");
      expect(html).toContain("4 de 4 sitios");
      expect(html).toContain("Nuevo Sitio");
    });
  });

  describe("2. Inline Category Tabs with Dynamic Count Badges", () => {
    it("renders category tabs for Todos, Plantas, Depósitos, Clientes, and Sucursales & Otros with counts", () => {
      const html = renderToStaticMarkup(<SitiosTable initialSitios={mockSitiosTest} />);

      expect(html).toContain("Todos");
      expect(html).toContain("Plantas");
      expect(html).toContain("Depósitos");
      expect(html).toContain("Clientes");
      expect(html).toContain("Sucursales &amp; Otros");

      // Verify category counts: Todos: 4, Plantas: 1, Depósitos: 1, Clientes: 1, Otros: 1
      expect(html).toContain("(4)");
      expect(html).toContain("(1)");
    });
  });

  describe("3. Quick Filter & Search Bar", () => {
    it("renders search input with comprehensive placeholder", () => {
      const html = renderToStaticMarkup(<SitiosTable initialSitios={mockSitiosTest} />);

      expect(html).toContain("Buscar por nombre, dirección, ciudad, provincia o contacto");
    });
  });

  describe("4. Enriched Columns and Data Display", () => {
    it("renders Sitio column with name and site type badge", () => {
      const html = renderToStaticMarkup(<SitiosTable initialSitios={mockSitiosTest} />);

      expect(html).toContain("Planta Zárate");
      expect(html).toContain("Depósito Central");
      expect(html).toContain("Cliente Cervecería Quilmes");
      expect(html).toContain("Sucursal Córdoba");

      expect(html).toContain("Planta");
      expect(html).toContain("Depósito");
      expect(html).toContain("Cliente");
      expect(html).toContain("Sucursal");
    });

    it("renders Dirección & Ubicación column with address, city/province, and Google Maps link", () => {
      const html = renderToStaticMarkup(<SitiosTable initialSitios={mockSitiosTest} />);

      expect(html).toContain("Ruta 9 Km 85");
      expect(html).toContain("Zárate, Buenos Aires");
      expect(html).toContain("Av. Circunvalación 1200");
      expect(html).toContain("Rosario, Santa Fe");

      // Check for Google Maps link coordinates
      expect(html).toContain("https://www.google.com/maps?q=-34.0987,-59.0284");
      expect(html).toContain("https://www.google.com/maps?q=-32.9511,-60.6664");
    });

    it("renders Radio de Geocerca with formatted meters", () => {
      const html = renderToStaticMarkup(<SitiosTable initialSitios={mockSitiosTest} />);

      expect(html).toContain("250 m");
      expect(html).toContain("150 m");
      expect(html).toContain("100 m");
    });

    it("renders Contact column with contact name and phone link", () => {
      const html = renderToStaticMarkup(<SitiosTable initialSitios={mockSitiosTest} />);

      expect(html).toContain("Carlos Gómez");
      expect(html).toContain("+54 9 3487 112233");
      expect(html).toContain("Mariana López");
      expect(html).toContain("wa.me/5493487112233");
    });
  });

  describe("5. Quick Action Links & Dropdown Menu", () => {
    it("renders action options for Ver en Mapa, Editar Sitio, and Eliminar Sitio", () => {
      const html = renderToStaticMarkup(<SitiosTable initialSitios={mockSitiosTest} />);

      expect(html).toContain("Ver en Mapa");
      expect(html).toContain("Editar Sitio");
      expect(html).toContain("Eliminar");
    });
  });

  describe("6. Empty State", () => {
    it("renders empty state message when no sites match or table is empty", () => {
      const html = renderToStaticMarkup(<SitiosTable initialSitios={[]} />);

      expect(html).toContain("No se encontraron sitios");
      expect(html).toContain("0 de 0 sitios");
    });
  });

  describe("7. Sitio Form Dialog Rendering", () => {
    it("renders modal form with all mandatory and optional fields for site management", () => {
      const html = renderToStaticMarkup(
        <SitioFormDialog open={true} trigger={<button>Open Form</button>} />
      );

      expect(html).toContain("Nombre del Sitio");
      expect(html).toContain("Tipo de Sitio");
      expect(html).toContain("Dirección Física");
      expect(html).toContain("Ciudad");
      expect(html).toContain("Provincia");
      expect(html).toContain("Latitud (GPS)");
      expect(html).toContain("Longitud (GPS)");
      expect(html).toContain("Radio de aproximación (metros)");
      expect(html).toContain("Nombre de Contacto");
      expect(html).toContain("Teléfono de Contacto");
    });

    it("renders DeleteSitioDialog confirmation modal", () => {
      const html = renderToStaticMarkup(
        <DeleteSitioDialog open={true} sitio={mockSitiosTest[0]} />
      );

      expect(html).toContain("¿Eliminar sitio Planta Zárate?");
      expect(html).toContain("Esta acción eliminará el sitio");
      expect(html).toContain("Eliminar Sitio");
    });
  });
});
