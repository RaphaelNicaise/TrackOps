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
    user: { id: "superadmin-1", email: "superadmin@trackops.com", role: "SUPER_ADMIN" },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockPlansData = [
  { id: 1, nombre: "Inicial", minVehiculos: 1, maxVehiculos: 5, precioMensual: 39990, precioAnual: 399900, activo: 1, tenantsCount: 3 },
  { id: 2, nombre: "Crecimiento", minVehiculos: 6, maxVehiculos: 15, precioMensual: 64900, precioAnual: 649000, activo: 1, tenantsCount: 8 },
  { id: 3, nombre: "Enterprise", minVehiculos: 16, maxVehiculos: null, precioMensual: 149900, precioAnual: 1499000, activo: 1, tenantsCount: 2 },
];

import { PlanesView } from "@/components/superadmin/planes/planes-view";
import SuperadminPlanesPage from "@/app/panel/superadmin/planes/page";

describe("Superadmin Planes Module (/panel/superadmin/planes)", () => {
  it("renders PlanesView without any KPI cards and with plan table & ranges", () => {
    const html = renderToStaticMarkup(<PlanesView plans={mockPlansData} />);

    // MUST NOT contain financial KPIs
    expect(html).not.toContain("MRR (Ingreso Mensual)");
    expect(html).not.toContain("ARR (Proyección Anual)");
    expect(html).not.toContain("ARPU (Ticket Promedio)");
    expect(html).not.toContain("Tasa de Cobro al Día");

    // MUST contain Catalogue and Plans Table
    expect(html).toContain("Catálogo de Planes Activos");
    expect(html).toContain("Inicial");
    expect(html).toContain("Crecimiento");
    expect(html).toContain("Enterprise");
    expect(html).toContain("1-5");
    expect(html).toContain("6-15");
    expect(html).toContain("16+");
    expect(html).toContain("Nuevo Plan");
    expect(html).toContain("Facturación Mensual");
    expect(html).toContain("Facturación Anual");
  });

  it("renders the SuperadminPlanesPage server component cleanly", async () => {
    const page = await SuperadminPlanesPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Catálogo de Planes");
    expect(html).toContain("SUPERADMIN · GESTIÓN DE PLANES");
    expect(html).not.toContain("MRR (Ingreso Mensual)");
  });
});
