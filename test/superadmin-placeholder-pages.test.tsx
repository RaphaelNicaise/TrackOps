import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UnderConstruction, RoadmapFeature } from "@/components/superadmin/under-construction";
import SuperadminDashboardPage from "@/app/panel/superadmin/dashboard/page";
import SuperadminAlertasPage from "@/app/panel/superadmin/alertas/page";
import { Zap, ShieldCheck } from "lucide-react";

describe("Superadmin UnderConstruction Component", () => {
  it("renders with default props correctly", () => {
    const html = renderToStaticMarkup(<UnderConstruction />);
    expect(html).toContain("Módulo en Desarrollo");
    expect(html).toContain("Capacidades Avanzadas en Construcción");
    expect(html).toContain("Roadmap Q3 / Q4 2026");
    expect(html).toContain("60%");
  });

  it("renders with customized props and feature roadmap cards", () => {
    const customFeatures: RoadmapFeature[] = [
      {
        icon: Zap,
        title: "Disparador Automático",
        description: "Ejecución de webhooks y alertas por socket.",
        status: "in-progress",
        eta: "Q4 2026",
      },
      {
        icon: ShieldCheck,
        title: "Auditoría de Seguridad",
        description: "Registro inmutable de accesos y tokens.",
        status: "testing",
        eta: "Q3 2026",
      },
    ];

    const html = renderToStaticMarkup(
      <UnderConstruction
        moduleName="Módulo de Facturación"
        title="Facturación Global Automatizada"
        subtitle="Generación de cobros recurrentes y facturación electrónica."
        badge="Sprint Q4"
        progress={75}
        eta="Estimado Noviembre 2026"
        features={customFeatures}
      />
    );

    expect(html).toContain("Módulo de Facturación");
    expect(html).toContain("Facturación Global Automatizada");
    expect(html).toContain("Generación de cobros recurrentes");
    expect(html).toContain("Sprint Q4");
    expect(html).toContain("75%");
    expect(html).toContain("Estimado Noviembre 2026");
    expect(html).toContain("Disparador Automático");
    expect(html).toContain("En Desarrollo");
    expect(html).toContain("Auditoría de Seguridad");
    expect(html).toContain("Testing / Alfa");
    expect(html).toContain("Q4 2026");
  });

  it("renders all feature status types correctly", () => {
    const allStatusFeatures: RoadmapFeature[] = [
      { title: "F1", description: "D1", status: "completed" },
      { title: "F2", description: "D2", status: "testing" },
      { title: "F3", description: "D3", status: "in-progress" },
      { title: "F4", description: "D4", status: "planned" },
    ];

    const html = renderToStaticMarkup(
      <UnderConstruction features={allStatusFeatures} />
    );

    expect(html).toContain("Completado");
    expect(html).toContain("Testing / Alfa");
    expect(html).toContain("En Desarrollo");
    expect(html).toContain("Planificado");
  });
});

describe("Superadmin Dashboard Page", () => {
  it("renders global SaaS KPI cards properly", () => {
    const html = renderToStaticMarkup(<SuperadminDashboardPage />);

    // Check Header
    expect(html).toContain("Dashboard Global de la Plataforma");
    expect(html).toContain("SUPERADMIN · SAAS MONITOR");

    // Check KPIs
    expect(html).toContain("MRR Proyectado");
    expect(html).toContain("$1.450.000 ARS");
    expect(html).toContain("Empresas Activas");
    expect(html).toContain("14 Clientes");
    expect(html).toContain("Vehículos Conectados");
    expect(html).toContain("182 Unidades");
    expect(html).toContain("Uptime Ingesta GPS");
    expect(html).toContain("99.98%");

    // Check UnderConstruction section
    expect(html).toContain("Dashboard Multinquilino");
    expect(html).toContain("Mapa Global de Flotas Multinquilino");
    expect(html).toContain("Analítica de MRR, ARR &amp; Churn SaaS");
    expect(html).toContain("Detección de Anomalías de Telemetría con IA");
    expect(html).toContain("Control de Cuotas &amp; Auto-facturación");
  });
});

describe("Superadmin Alertas Page", () => {
  it("renders system health status grid and under construction section", () => {
    const html = renderToStaticMarkup(<SuperadminAlertasPage />);

    // Check Header
    expect(html).toContain("Alertas &amp; Salud del Sistema");
    expect(html).toContain("SUPERADMIN · DEV &amp; OPS");
    expect(html).toContain("6 / 6 Servicios Operativos");

    // Check Services in Grid
    expect(html).toContain("API Backend (Next.js)");
    expect(html).toContain("Base de Datos PostGIS");
    expect(html).toContain("GPS Streamer &amp; Ingestion");
    expect(html).toContain("MinIO Object Storage (S3)");
    expect(html).toContain("Servicio de Autenticación");
    expect(html).toContain("Umami Analytics");

    // Check Metrics details
    expect(html).toContain("42 ms");
    expect(html).toContain("4.8 GB");
    expect(html).toContain("450 msg/s");
    expect(html).toContain("82.4 GB");

    // Check UnderConstruction section
    expect(html).toContain("Alertas e Incidentes Globales");
    expect(html).toContain("Webhooks de Alerta en Tiempo Real");
    expect(html).toContain("Auto-healing y Recuperación de Stream GPS");
    expect(html).toContain("Alertas de Exceso de Cuota por Tenant");
    expect(html).toContain("Monitor de Failover &amp; Replicación de DB");
  });
});
