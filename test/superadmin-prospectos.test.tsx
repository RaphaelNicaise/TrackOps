import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock @radix-ui/react-dialog Portal for renderToStaticMarkup
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
  };
});

const mockAuth = vi.fn().mockResolvedValue({
  user: { id: "superadmin-1", email: "admin@trackops.com", role: "SUPER_ADMIN" },
});

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Hoisted DB mocks
const { mockSelect, mockFrom, mockOrderBy, mockInsert, mockValues, mockReturningInsert, mockUpdate, mockSet, mockWhere, mockReturningUpdate } = vi.hoisted(() => {
  const mockReturningInsert = vi.fn().mockResolvedValue([
    {
      id: 99,
      nombre: "Nuevo Contacto",
      email: "nuevo@empresa.com",
      telefono: "+54 9 11 1234-5678",
      empresa: "Empresa Test",
      flotaEstimada: 10,
      mensaje: "Consulta de prueba",
      estado: "nuevo",
      notas: null,
      createdAt: new Date("2026-08-16T12:00:00Z"),
    },
  ]);

  const mockValues = vi.fn().mockImplementation(() => ({
    returning: mockReturningInsert,
  }));

  const mockInsert = vi.fn().mockImplementation(() => ({
    values: mockValues,
  }));

  const mockReturningUpdate = vi.fn().mockResolvedValue([
    {
      id: 1,
      nombre: "Martín Palermo",
      email: "mpalermo@transpalermo.com",
      estado: "demo_agendada",
      notas: "Demo agendada para el martes",
    },
  ]);

  const mockWhere = vi.fn().mockImplementation(() => ({
    returning: mockReturningUpdate,
  }));

  const mockSet = vi.fn().mockImplementation(() => ({
    where: mockWhere,
  }));

  const mockUpdate = vi.fn().mockImplementation(() => ({
    set: mockSet,
  }));

  const mockOrderBy = vi.fn().mockResolvedValue([
    {
      id: 1,
      nombre: "Martín Palermo",
      email: "mpalermo@transpalermo.com",
      telefono: "+54 9 11 4455-6677",
      empresa: "Transportes Palermo S.R.L.",
      flotaEstimada: 18,
      mensaje: "Interés en control de combustible",
      estado: "nuevo",
      notas: "Lead desde landing",
      createdAt: new Date("2026-08-15T14:30:00Z"),
    },
    {
      id: 2,
      nombre: "Laura Fernández",
      email: "lfernandez@delsurlog.com.ar",
      telefono: "+54 9 299 512-3456",
      empresa: "Distribuidora del Sur",
      flotaEstimada: 8,
      mensaje: "Alertas WhatsApp",
      estado: "contactado",
      notas: "Se envió folleto",
      createdAt: new Date("2026-08-12T10:15:00Z"),
    },
    {
      id: 3,
      nombre: "Esteban Quito",
      email: "esteban@quitoexpress.com",
      telefono: "+54 9 351 678-9012",
      empresa: "Quito Logistics & Courier",
      flotaEstimada: 35,
      mensaje: "Demo técnica",
      estado: "demo_agendada",
      notas: "Demo agendada",
      createdAt: new Date("2026-08-10T16:45:00Z"),
    },
    {
      id: 4,
      nombre: "Sofía Martínez",
      email: "smartinez@fletesexpress.com",
      telefono: "+54 9 11 9876-5432",
      empresa: "Fletes Express Rosario",
      flotaEstimada: 5,
      mensaje: "5 camionetas",
      estado: "convertido",
      notas: "Cliente convertido",
      createdAt: new Date("2026-08-05T09:00:00Z"),
    },
  ]);

  const mockFrom = vi.fn().mockImplementation(() => ({
    orderBy: mockOrderBy,
  }));

  const mockSelect = vi.fn().mockImplementation(() => ({
    from: mockFrom,
  }));

  return {
    mockSelect,
    mockFrom,
    mockOrderBy,
    mockInsert,
    mockValues,
    mockReturningInsert,
    mockUpdate,
    mockSet,
    mockWhere,
    mockReturningUpdate,
  };
});

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  },
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import {
  getProspectos,
  updateProspectoStatus,
  createProspecto,
  Prospecto,
} from "@/lib/prospectos-actions";
import { ProspectoDetailDialog } from "@/components/superadmin/prospecto-detail-dialog";
import { ProspectosTable } from "@/components/superadmin/prospectos-table";
import SuperadminProspectosPage from "@/app/dashboard/superadmin/prospectos/page";

const MOCK_PROSPECTOS: Prospecto[] = [
  {
    id: 1,
    nombre: "Martín Palermo",
    email: "mpalermo@transpalermo.com",
    telefono: "+54 9 11 4455-6677",
    empresa: "Transportes Palermo S.R.L.",
    flotaEstimada: 18,
    mensaje: "Interés en control de combustible y geocercas.",
    estado: "nuevo",
    notas: "Lead desde landing page.",
    createdAt: new Date("2026-08-15T14:30:00Z"),
  },
  {
    id: 2,
    nombre: "Laura Fernández",
    email: "lfernandez@delsurlog.com.ar",
    telefono: "+54 9 299 512-3456",
    empresa: "Distribuidora del Sur",
    flotaEstimada: 8,
    mensaje: "Buscamos controlar vencimientos de RTO.",
    estado: "contactado",
    notas: "Se envió folleto comercial.",
    createdAt: new Date("2026-08-12T10:15:00Z"),
  },
  {
    id: 3,
    nombre: "Esteban Quito",
    email: "esteban@quitoexpress.com",
    telefono: "+54 9 351 678-9012",
    empresa: "Quito Logistics & Courier",
    flotaEstimada: 35,
    mensaje: "Demo técnica para integración GPS.",
    estado: "demo_agendada",
    notas: "Demo agendada para el viernes.",
    createdAt: new Date("2026-08-10T16:45:00Z"),
  },
  {
    id: 4,
    nombre: "Sofía Martínez",
    email: "smartinez@fletesexpress.com",
    telefono: "+54 9 11 9876-5432",
    empresa: "Fletes Express Rosario",
    flotaEstimada: 5,
    mensaje: "5 camionetas de reparto urbano.",
    estado: "convertido",
    notas: "Convertido a plan Starter.",
    createdAt: new Date("2026-08-05T09:00:00Z"),
  },
];

describe("Prospectos Server Actions", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: "superadmin-1", email: "admin@trackops.com", role: "SUPER_ADMIN" },
    });
  });

  it("getProspectos returns list of leads for SUPER_ADMIN", async () => {
    const list = await getProspectos();
    expect(list).toBeDefined();
    expect(list.length).toBe(4);
    expect(list[0].nombre).toBe("Martín Palermo");
  });

  it("getProspectos throws Unauthorized for non-superadmin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "driver@trackops.com", role: "CHOFER" },
    });
    await expect(getProspectos()).rejects.toThrow("Unauthorized");
  });

  it("updateProspectoStatus updates status and notes successfully", async () => {
    const res = await updateProspectoStatus(1, "demo_agendada", "Demo agendada para el martes");
    expect(res.success).toBe(true);
    expect(res.prospecto).toBeDefined();
    expect(res.prospecto.estado).toBe("demo_agendada");
  });

  it("updateProspectoStatus rejects non-superadmin", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-1", email: "user@test.com", role: "CHOFER" },
    });
    await expect(updateProspectoStatus(1, "contactado")).rejects.toThrow("Unauthorized");
  });

  it("createProspecto inserts a new lead successfully", async () => {
    const res = await createProspecto({
      nombre: "Nuevo Contacto",
      email: "nuevo@empresa.com",
      telefono: "+54 9 11 1234-5678",
      empresa: "Empresa Test",
      flotaEstimada: 10,
      mensaje: "Consulta de prueba",
    });
    expect(res.success).toBe(true);
    expect(res.prospecto).toBeDefined();
    expect(res.prospecto.id).toBe(99);
  });

  it("createProspecto throws when required fields are missing", async () => {
    await expect(
      createProspecto({ nombre: "", email: "test@empresa.com" })
    ).rejects.toThrow("obligatorios");
  });
});

describe("ProspectoDetailDialog Component", () => {
  it("renders lead details, contact links, message, and pipeline selectors", () => {
    const lead = MOCK_PROSPECTOS[0];
    const html = renderToStaticMarkup(
      <ProspectoDetailDialog
        open={true}
        prospecto={lead}
        onOpenChange={() => {}}
      />
    );

    // Header & Contact
    expect(html).toContain("LEAD #1");
    expect(html).toContain("Martín Palermo");
    expect(html).toContain("Transportes Palermo S.R.L.");
    expect(html).toContain("mpalermo@transpalermo.com");
    expect(html).toContain("+54 9 11 4455-6677");
    expect(html).toContain("18 veh.");

    // Action links
    expect(html).toContain("Contactar por WhatsApp");
    expect(html).toContain("wa.me/5491144556677");
    expect(html).toContain("mailto:mpalermo@transpalermo.com");
    expect(html).toContain("tel:+54 9 11 4455-6677");

    // Message
    expect(html).toContain("Interés en control de combustible y geocercas.");

    // Pipeline status buttons
    expect(html).toContain("Nuevo");
    expect(html).toContain("Contactado");
    expect(html).toContain("Demo Agendada");
    expect(html).toContain("Convertido");
    expect(html).toContain("Descartado");

    // Notes and Save button
    expect(html).toContain("Notas Internas de Seguimiento");
    expect(html).toContain("Lead desde landing page.");
    expect(html).toContain("Guardar Cambios");
  });

  it("returns null when prospecto is null", () => {
    const html = renderToStaticMarkup(
      <ProspectoDetailDialog
        open={true}
        prospecto={null}
        onOpenChange={() => {}}
      />
    );
    expect(html).toBe("");
  });
});

describe("ProspectosTable Component", () => {
  it("renders table header, prospect rows, badges, and counters", () => {
    const html = renderToStaticMarkup(
      <ProspectosTable initialProspectos={MOCK_PROSPECTOS} />
    );

    // Column Headers
    expect(html).toContain("Prospecto / Contacto");
    expect(html).toContain("Empresa &amp; Flota");
    expect(html).toContain("Teléfono");
    expect(html).toContain("Fecha de Solicitud");
    expect(html).toContain("Estado Pipeline");
    expect(html).toContain("Acciones");

    // Tabs
    expect(html).toContain("Todos");
    expect(html).toContain("Nuevos");
    expect(html).toContain("Contactados");
    expect(html).toContain("Demo Agendada");
    expect(html).toContain("Convertidos");
    expect(html).toContain("Descartados");

    // Prospect Data
    expect(html).toContain("Martín Palermo");
    expect(html).toContain("mpalermo@transpalermo.com");
    expect(html).toContain("Transportes Palermo S.R.L.");
    expect(html).toContain("18 veh.");

    expect(html).toContain("Laura Fernández");
    expect(html).toContain("Distribuidora del Sur");

    expect(html).toContain("Esteban Quito");
    expect(html).toContain("Quito Logistics &amp; Courier");

    expect(html).toContain("Sofía Martínez");
    expect(html).toContain("Fletes Express Rosario");

    // Action button
    expect(html).toContain("Ver Detalle");
  });

  it("renders empty state when no prospectos match", () => {
    const html = renderToStaticMarkup(
      <ProspectosTable initialProspectos={[]} />
    );

    expect(html).toContain("No se encontraron prospectos");
    expect(html).toContain("Mostrando");
    expect(html).toContain("0");
    expect(html).toContain("solicitudes registradas");
  });
});

describe("Superadmin Prospectos Server Page", () => {
  it("renders header, KPI metrics, and prospectos table", async () => {
    const pageElement = await SuperadminProspectosPage();
    const html = renderToStaticMarkup(pageElement);

    // Header
    expect(html).toContain("CRM de Prospectos &amp; Solicitudes de Demo");
    expect(html).toContain("SUPERADMIN · PIPELINE CRM");
    expect(html).toContain("Embudo Comercial Activo");

    // KPI Cards
    expect(html).toContain("Total Leads Recibidos");
    expect(html).toContain("Nuevos / Por Contactar");
    expect(html).toContain("Demos Agendadas");
    expect(html).toContain("Tasa de Conversión");

    // Table Content
    expect(html).toContain("Martín Palermo");
    expect(html).toContain("Laura Fernández");
  });
});
