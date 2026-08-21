import { describe, it, expect, vi } from "vitest";
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

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "admin-1", email: "admin@test.com", role: "SUPER_ADMIN" },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock DB to prevent postgres connection timeout in tests
const { mockSelect, mockFrom, mockLeftJoin1, mockLeftJoin2, mockGroupBy } = vi.hoisted(() => {
  const mockGroupBy = vi.fn().mockResolvedValue([
    { empresaId: 1, count: 24 },
    { empresaId: 2, count: 12 },
    { empresaId: 3, count: 4 },
  ]);
  const mockLeftJoin2 = vi.fn().mockResolvedValue([
    {
      id: 1,
      nombre: "Logística Alpha S.A.",
      cuit: "30-71234567-9",
      createdAt: new Date("2026-01-15T10:00:00Z"),
      planId: 3,
      planNombre: "Enterprise",
      estadoSuscripcion: "activa",
    },
    {
      id: 2,
      nombre: "Transportes Patagonia SRL",
      cuit: "30-68912345-2",
      createdAt: new Date("2026-02-10T14:30:00Z"),
      planId: 2,
      planNombre: "Pro",
      estadoSuscripcion: "activa",
    },
    {
      id: 3,
      nombre: "Distribuidora Andina Express",
      cuit: "33-54891234-9",
      createdAt: new Date("2026-03-01T09:15:00Z"),
      planId: 1,
      planNombre: "Starter",
      estadoSuscripcion: "activa",
    },
  ]);
  const mockLeftJoin1 = vi.fn().mockImplementation(() => ({ leftJoin: mockLeftJoin2 }));
  const mockFrom = vi.fn().mockImplementation(() => ({
    leftJoin: mockLeftJoin1,
    groupBy: mockGroupBy,
  }));
  const mockSelect = vi.fn().mockImplementation(() => ({
    from: mockFrom,
  }));
  return { mockSelect, mockFrom, mockLeftJoin1, mockLeftJoin2, mockGroupBy };
});

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
  },
}));

import { ClientesTable, EmpresaRow } from "@/components/superadmin/clientes-table";
import { EmpresaFormDialog, PlanOption } from "@/components/superadmin/empresa-form-dialog";
import SuperadminClientesPage from "@/app/panel/superadmin/clientes/page";

const MOCK_PLANS: PlanOption[] = [
  { id: 1, nombre: "Starter", maxVehiculos: 5, precioMensual: 49 },
  { id: 2, nombre: "Pro", maxVehiculos: 25, precioMensual: 149 },
  { id: 3, nombre: "Enterprise", maxVehiculos: 100, precioMensual: 399 },
];

const MOCK_EMPRESAS: EmpresaRow[] = [
  {
    id: 1,
    nombre: "Logística Alpha S.A.",
    cuit: "30-71234567-9",
    createdAt: new Date("2026-01-15T10:00:00Z"),
    planId: 3,
    planNombre: "Enterprise",
    estadoSuscripcion: "activa",
    totalVehiculos: 24,
  },
  {
    id: 2,
    nombre: "Transportes Patagonia SRL",
    cuit: "30-68912345-2",
    createdAt: new Date("2026-02-10T14:30:00Z"),
    planId: 2,
    planNombre: "Pro",
    estadoSuscripcion: "activa",
    totalVehiculos: 12,
  },
  {
    id: 3,
    nombre: "Distribuidora Andina Express",
    cuit: "33-54891234-9",
    createdAt: new Date("2026-03-01T09:15:00Z"),
    planId: 1,
    planNombre: "Starter",
    estadoSuscripcion: "activa",
    totalVehiculos: 4,
  },
  {
    id: 4,
    nombre: "Flota Urbana Mensajería",
    cuit: "27-35678901-4",
    createdAt: new Date("2026-04-05T16:20:00Z"),
    planId: 1,
    planNombre: "Starter",
    estadoSuscripcion: "suspendida",
    totalVehiculos: 2,
  },
];

describe("EmpresaFormDialog Component", () => {
  it("renders trigger button correctly in default unopen state", () => {
    const html = renderToStaticMarkup(
      <EmpresaFormDialog plans={MOCK_PLANS} />
    );
    expect(html).toContain("Nueva Empresa");
  });

  it("renders form content in open mode for creating new empresa", () => {
    const html = renderToStaticMarkup(
      <EmpresaFormDialog open={true} plans={MOCK_PLANS} />
    );
    expect(html).toContain("Registrar Empresa");
    expect(html).toContain("Razón Social / Nombre Comercial");
    expect(html).toContain("CUIT / Identificación Tributaria");
    expect(html).toContain("Plan SaaS");
    expect(html).toContain("Starter");
    expect(html).toContain("Pro");
    expect(html).toContain("Enterprise");
    expect(html).toContain("Aprovisionar Empresa");
  });

  it("renders form content in open mode for editing existing empresa", () => {
    const html = renderToStaticMarkup(
      <EmpresaFormDialog
        open={true}
        empresa={{
          id: 42,
          nombre: "Cargas del Norte SRL",
          cuit: "30-99988877-1",
          planId: 2,
          planNombre: "Pro",
        }}
        plans={MOCK_PLANS}
      />
    );
    expect(html).toContain("Editar Empresa Cliente");
    expect(html).toContain("ID: #42");
    expect(html).toContain("Cargas del Norte SRL");
    expect(html).toContain("30-99988877-1");
    expect(html).toContain("Actualizar");
  });
});

describe("ClientesTable Component", () => {
  it("renders all empresa rows with badges, counts, and superpoderes button", () => {
    const html = renderToStaticMarkup(
      <ClientesTable initialEmpresas={MOCK_EMPRESAS} plans={MOCK_PLANS} />
    );

    // Check header columns
    expect(html).toContain("Empresa / Razón Social");
    expect(html).toContain("CUIT");
    expect(html).toContain("Plan");
    expect(html).toContain("Flota");
    expect(html).toContain("Estado");
    expect(html).toContain("Fecha Alta");
    expect(html).toContain("Acciones");

    // Check Empresa Names
    expect(html).toContain("Logística Alpha S.A.");
    expect(html).toContain("Transportes Patagonia SRL");
    expect(html).toContain("Distribuidora Andina Express");
    expect(html).toContain("Flota Urbana Mensajería");

    // Check CUITs
    expect(html).toContain("30-71234567-9");
    expect(html).toContain("30-68912345-2");
    expect(html).toContain("33-54891234-9");
    expect(html).toContain("27-35678901-4");

    // Check Plan Badges
    expect(html).toContain("Enterprise");
    expect(html).toContain("Pro");
    expect(html).toContain("Starter");

    // Check Vehicle Counts
    expect(html).toContain("24");
    expect(html).toContain("12");
    expect(html).toContain("4");
    expect(html).toContain("2");

    // Check Status Badges
    expect(html).toContain("Activa");
    expect(html).toContain("Suspendida");

    // Check Superpoderes button
    expect(html).toContain("Superpoderes");
  });

  it("renders empty state correctly when no empresas are provided", () => {
    const html = renderToStaticMarkup(
      <ClientesTable initialEmpresas={[]} plans={MOCK_PLANS} />
    );
    expect(html).toContain("No se encontraron empresas clientes");
    expect(html).toContain("Mostrando");
    expect(html).toContain("0");
    expect(html).toContain("empresas clientes");
  });
});

describe("Superadmin Clientes Server Page", () => {
  it("renders header, KPI metrics and table correctly", async () => {
    const pageElement = await SuperadminClientesPage();
    const html = renderToStaticMarkup(pageElement);

    // Check Header
    expect(html).toContain("Empresas Clientes");
    expect(html).toContain("SUPERADMIN · GESTIÓN SAAS");
    expect(html).toContain("Soporte Multi-Inquilino");
    expect(html).toContain("Auditoría de Inquilinos Activa");

    // Check KPIs
    expect(html).toContain("Total Inquilinos");
    expect(html).toContain("Empresas Activas");
    expect(html).toContain("Total Flota Conectada");
    expect(html).toContain("MRR Recurrente Estimado");
    expect(html).toContain("USD/mes");
  });
});
