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

// Mock DB queries for Superadmin Facturación
const { mockSelect, mockFrom, mockLeftJoin1, mockLeftJoin2, mockGroupBy } = vi.hoisted(() => {
  const mockGroupBy = vi.fn().mockResolvedValue([
    { empresaId: 1, count: 24 },
    { empresaId: 2, count: 12 },
    { empresaId: 3, count: 4 },
  ]);
  const mockLeftJoin2 = vi.fn().mockResolvedValue([
    {
      subId: 1,
      empresaId: 1,
      empresaNombre: "Logística Alpha S.A.",
      cuit: "30-71234567-9",
      planId: 3,
      planNombre: "Enterprise",
      planPrecioMensual: 399,
      planPrecioAnual: 3990,
      estado: "activa",
      fechaInicio: new Date("2026-01-15T10:00:00Z"),
      fechaFin: new Date("2026-09-15T10:00:00Z"),
      metodoPago: "transferencia",
    },
    {
      subId: 2,
      empresaId: 2,
      empresaNombre: "Transportes Patagonia SRL",
      cuit: "30-68912345-2",
      planId: 2,
      planNombre: "Pro",
      planPrecioMensual: 149,
      planPrecioAnual: 1490,
      estado: "activa",
      fechaInicio: new Date("2026-02-10T14:30:00Z"),
      fechaFin: new Date("2026-09-10T14:30:00Z"),
      metodoPago: "mercadopago",
    },
    {
      subId: 3,
      empresaId: 3,
      empresaNombre: "Distribuidora Andina Express",
      cuit: "33-54891234-9",
      planId: 1,
      planNombre: "Starter",
      planPrecioMensual: 49,
      planPrecioAnual: 490,
      estado: "activa",
      fechaInicio: new Date("2026-03-01T09:15:00Z"),
      fechaFin: new Date("2026-08-20T09:15:00Z"),
      metodoPago: "mercadopago",
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

import SuperadminFacturacionPage from "@/app/panel/superadmin/facturacion/page";
import SuperadminDevConfigPage from "@/app/panel/superadmin/dev/config/page";
import {
  FacturacionView,
  SubscriptionPlanData,
  BillingRecord,
} from "@/components/superadmin/facturacion-view";
import { DevConfigView } from "@/components/superadmin/dev-config-view";

const MOCK_PLANS: SubscriptionPlanData[] = [
  { id: 1, nombre: "Starter", maxVehiculos: 5, precioMensual: 49, precioAnual: 490, activo: 1 },
  { id: 2, nombre: "Pro", maxVehiculos: 25, precioMensual: 149, precioAnual: 1490, activo: 1 },
  { id: 3, nombre: "Enterprise", maxVehiculos: 100, precioMensual: 399, precioAnual: 3990, activo: 1 },
];

const MOCK_RECORDS: BillingRecord[] = [
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
    fechaProximoVencimiento: new Date("2026-08-20T09:15:00Z"),
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

describe("Superadmin Facturacion & SaaS Billing", () => {
  it("renders FacturacionView KPIs and calculations properly", () => {
    const html = renderToStaticMarkup(
      <FacturacionView plans={MOCK_PLANS} records={MOCK_RECORDS} />
    );

    // Check KPI titles
    expect(html).toContain("MRR (Ingreso Mensual)");
    expect(html).toContain("ARR (Proyección Anual)");
    expect(html).toContain("ARPU (Ticket Promedio)");
    expect(html).toContain("Tasa de Cobro al Día");

    // Check calculated MRR: 399 + 149 + 49 + 399 + 49 = 1,045 USD
    expect(html).toContain("$1,045");
    expect(html).toContain("USD/mes");

    // Check calculated ARR: 1,045 * 12 = 12,540 USD
    expect(html).toContain("$12,540");
    expect(html).toContain("USD/año");

    // Check Plans Catalogue
    expect(html).toContain("Catálogo de Planes Activos");
    expect(html).toContain("Plan Starter");
    expect(html).toContain("Plan Pro");
    expect(html).toContain("Plan Enterprise");
    expect(html).toContain("Más Elegido");
    expect(html).toContain("Enterprise Tier");

    // Check Plan Limits
    expect(html).toContain("Hasta 5 unidades");
    expect(html).toContain("Hasta 25 unidades");
    expect(html).toContain("100+ unidades");

    // Check Billing Table Headers
    expect(html).toContain("Inquilino / Empresa");
    expect(html).toContain("Plan SaaS");
    expect(html).toContain("Cuota Mensual");
    expect(html).toContain("Método de Pago");
    expect(html).toContain("Estado Cobro");
    expect(html).toContain("Próximo Vencimiento");

    // Check Tenants in Table
    expect(html).toContain("Logística Alpha S.A.");
    expect(html).toContain("Transportes Patagonia SRL");
    expect(html).toContain("Distribuidora Andina Express");
    expect(html).toContain("TransCargas del Plata S.A.");
    expect(html).toContain("Flota Urbana Mensajería");

    // Check Payment Methods Badges
    expect(html).toContain("MercadoPago");
    expect(html).toContain("Transferencia");
    expect(html).toContain("Tarjeta");

    // Check Status Badges
    expect(html).toContain("Al día");
    expect(html).toContain("Por vencer");
    expect(html).toContain("Vencido");

    // Check Quick Action Buttons
    expect(html).toContain("Cobrar");
  });

  it("renders SuperadminFacturacionPage server component properly", async () => {
    const pageElement = await SuperadminFacturacionPage();
    const html = renderToStaticMarkup(pageElement);

    expect(html).toContain("SUPERADMIN · FACTURACIÓN &amp; PLANES");
    expect(html).toContain("Cobros &amp; Facturación SaaS");
    expect(html).toContain("Motor de Facturación Automática Activo");
    expect(html).toContain("Pasarelas Seguras SSL/TLS");
  });
});

describe("Superadmin Dev & Config DevOps Control Center", () => {
  it("renders DevConfigView infrastructure port map cards correctly", () => {
    const html = renderToStaticMarkup(<DevConfigView />);

    // Check Port Map Section
    expect(html).toContain("Servicios Externos &amp; Mapeo de Puertos");
    expect(html).toContain("4 / 4 Conectados");

    // Umami Analytics
    expect(html).toContain("Umami Analytics");
    expect(html).toContain(":3002");
    expect(html).toContain("http://localhost:3002");
    expect(html).toContain("Analítica &amp; Telemetría Web");

    // pgAdmin 4
    expect(html).toContain("pgAdmin 4 Database");
    expect(html).toContain(":5050");
    expect(html).toContain("http://localhost:5050");
    expect(html).toContain("Gestión DB &amp; PostGIS");

    // Portainer Docker
    expect(html).toContain("Portainer Docker");
    expect(html).toContain(":9000");
    expect(html).toContain("http://localhost:9000");
    expect(html).toContain("Contenedores &amp; Microservicios");

    // MinIO Storage
    expect(html).toContain("MinIO Object Storage");
    expect(html).toContain(":9001 / :9002");
    expect(html).toContain("http://localhost:9001");
    expect(html).toContain("Almacenamiento S3 (Storage)");

    // Database Pools Panel
    expect(html).toContain("Pool de Conexiones PostgreSQL");
    expect(html).toContain("PostGIS 3.4");
    expect(html).toContain("Utilización del Pool:");
    expect(html).toContain("8 / 20 conexiones");

    // Telemetry & GPS Ingest Thresholds Panel
    expect(html).toContain("Umbrales de Telemetría GPS");
    expect(html).toContain("Ping en Movimiento (seg)");
    expect(html).toContain("Ping en Reposo (seg)");
    expect(html).toContain("Chequeo Geocercas (seg)");
    expect(html).toContain("Timeout Offline (seg)");

    // Feature Flags Panel
    expect(html).toContain("Feature Flags &amp; Controles Globales");
    expect(html).toContain("Modo Mantenimiento Global");
    expect(html).toContain("Registro Público de Prospectos (Landing)");
    expect(html).toContain("Motor de Alertas WhatsApp (Twilio / Meta)");
    expect(html).toContain("Streaming GPS en Tiempo Real (WebSocket)");
    expect(html).toContain("Detección de Anomalías de Combustible (IA)");
    expect(html).toContain("Auditoría Inmutable Estricta");
    expect(html).toContain("Guardar Configuración");
  });

  it("renders SuperadminDevConfigPage server component properly", () => {
    const html = renderToStaticMarkup(<SuperadminDevConfigPage />);

    expect(html).toContain("SUPERADMIN · DEV &amp; OPS");
    expect(html).toContain("Configuración del Sistema &amp; DevOps");
    expect(html).toContain("Infraestructura &amp; Parámetros Core");
    expect(html).toContain("Next.js 15 App Router");
    expect(html).toContain("Cluster Local Activo");
  });
});
