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

const mockRecordsData = [
  {
    id: 1,
    empresaId: 1,
    empresaNombre: "Logística Alpha S.A.",
    cuit: "30-71234567-9",
    planId: 3,
    planNombre: "Enterprise",
    precioMensual: 399,
    precioAnual: 3990,
    estadoPago: "al_dia",
    metodoPago: "transferencia",
    fechaInicio: new Date("2026-01-15T10:00:00Z"),
    fechaProximoVencimiento: new Date("2026-09-15T10:00:00Z"),
    totalVehiculos: 24,
    ultimaFacturaRef: "FAC-2026-0811",
    montoUltimoPago: 399,
  },
  {
    id: 2,
    empresaId: 2,
    empresaNombre: "Transportes Patagonia SRL",
    cuit: "30-68912345-2",
    planId: 2,
    planNombre: "Pro",
    precioMensual: 149,
    precioAnual: 1490,
    estadoPago: "al_dia",
    metodoPago: "mercadopago",
    fechaInicio: new Date("2026-02-10T14:30:00Z"),
    fechaProximoVencimiento: new Date("2026-09-10T14:30:00Z"),
    totalVehiculos: 12,
    ultimaFacturaRef: "FAC-2026-0804",
    montoUltimoPago: 149,
  },
  {
    id: 3,
    empresaId: 3,
    empresaNombre: "Distribuidora Andina Express",
    cuit: "33-54891234-9",
    planId: 1,
    planNombre: "Starter",
    precioMensual: 49,
    precioAnual: 490,
    estadoPago: "por_vencer",
    metodoPago: "mercadopago",
    fechaInicio: new Date("2026-03-01T09:15:00Z"),
    fechaProximoVencimiento: new Date("2026-08-27T09:15:00Z"),
    totalVehiculos: 4,
    ultimaFacturaRef: "FAC-2026-0718",
    montoUltimoPago: 49,
  },
  {
    id: 4,
    empresaId: 4,
    empresaNombre: "TransCargas del Plata S.A.",
    cuit: "30-79812345-8",
    planId: 3,
    planNombre: "Enterprise",
    precioMensual: 399,
    precioAnual: 3990,
    estadoPago: "al_dia",
    metodoPago: "transferencia",
    fechaInicio: new Date("2026-03-22T11:45:00Z"),
    fechaProximoVencimiento: new Date("2026-09-01T11:45:00Z"),
    totalVehiculos: 38,
    ultimaFacturaRef: "FAC-2026-0802",
    montoUltimoPago: 399,
  },
  {
    id: 5,
    empresaId: 5,
    empresaNombre: "Flota Urbana Mensajería",
    cuit: "27-35678901-4",
    planId: 1,
    planNombre: "Starter",
    precioMensual: 49,
    precioAnual: 490,
    estadoPago: "vencido",
    metodoPago: "tarjeta",
    fechaInicio: new Date("2026-04-05T16:20:00Z"),
    fechaProximoVencimiento: new Date("2026-08-10T16:20:00Z"),
    totalVehiculos: 2,
    ultimaFacturaRef: "FAC-2026-0701",
    montoUltimoPago: 49,
  },
];

import { CobrosView, generatePaymentHistoryForRecord } from "@/components/superadmin/cobros/cobros-view";
import SuperadminCobrosPage from "@/app/panel/superadmin/cobros/page";

describe("Superadmin Cobros Module (/panel/superadmin/cobros)", () => {
  it("renders CobrosView with all financial KPIs, filters and billing table", () => {
    const html = renderToStaticMarkup(<CobrosView records={mockRecordsData} />);

    // MUST contain KPI titles
    expect(html).toContain("MRR (Ingreso Mensual)");
    expect(html).toContain("ARR (Proyección Anual)");
    expect(html).toContain("ARPU (Ticket Promedio)");
    expect(html).toContain("Tasa de Cobro al Día");

    // Calculated MRR: 399 + 149 + 49 + 399 + 49 = 1,045
    expect(html).toContain((1045).toLocaleString("es-AR"));
    expect(html).toContain((12540).toLocaleString("es-AR"));

    // Billing table headers & tenants
    expect(html).toContain("Inquilino / Empresa");
    expect(html).toContain("Plan SaaS");
    expect(html).toContain("Cuota Mensual");
    expect(html).toContain("Método de Pago");
    expect(html).toContain("Estado Cobro");
    expect(html).toContain("Próximo Vencimiento");

    expect(html).toContain("Logística Alpha S.A.");
    expect(html).toContain("Transportes Patagonia SRL");
    expect(html).toContain("Distribuidora Andina Express");

    // Check interaction subtitle
    expect(html).toContain("Haz clic en cualquier empresa para ver su historial completo");
  });

  it("generates realistic historical payments for each company", () => {
    const history = generatePaymentHistoryForRecord(mockRecordsData[0]);
    expect(history.length).toBeGreaterThanOrEqual(4);
    expect(history[0].monto).toBe(399);
    expect(history[0].moneda).toBe("USD");
    expect(history[0].estado).toBe("APROBADO");
    expect(history[0].referenciaFactura).toBe("FAC-2026-0811");
  });

  it("renders SuperadminCobrosPage server component cleanly", async () => {
    const page = await SuperadminCobrosPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Cobros &amp; Facturación SaaS");
    expect(html).toContain("SUPERADMIN · COBROS &amp; FACTURACIÓN");
    expect(html).toContain("MRR (Ingreso Mensual)");
  });
});
