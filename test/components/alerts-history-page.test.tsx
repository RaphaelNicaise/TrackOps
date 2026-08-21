import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("patente=AB123CD"),
  usePathname: () => "/panel/monitoreo/alertas",
}));

// Mock React Suspense for renderToStaticMarkup in tests so children are rendered
vi.mock("react", async () => {
  const actual = await vi.importActual<any>("react");
  return {
    ...actual,
    Suspense: ({ children }: any) => <>{children}</>,
  };
});

// Mock @radix-ui/react-dialog Portal for renderToStaticMarkup
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
  };
});

const mockSession = {
  user: { id: "user-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
};

vi.mock("@/auth", () => ({
  auth: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
}));

const mockAlertLogsData = [
  {
    id: 1,
    empresaId: 1,
    modulo: "MANTENIMIENTO",
    tipo: "SERVICE_KM",
    severidad: "ALTA",
    titulo: "Service 10.000km próximo",
    mensaje: "El vehículo AB123CD superó el kilometraje previsto.",
    canal: "AMBOS",
    destinatarioEmail: "taller@flota.com",
    destinatarioWhatsapp: "+54 9 11 1111-2222",
    vehiculoId: 10,
    patente: "AB123CD",
    metadata: JSON.stringify({ kmActual: 10200, kmPlan: 10000 }),
    estado: "MOCK_DISPATCHED",
    createdAt: new Date("2026-08-19T10:30:00Z"),
  },
  {
    id: 2,
    empresaId: 1,
    modulo: "DOCUMENTACION",
    tipo: "VENCIMIENTO_SEGURO",
    severidad: "CRITICA",
    titulo: "Póliza de seguro por vencer",
    mensaje: "La póliza de seguro de AF999ZZ vence en 3 días.",
    canal: "EMAIL",
    destinatarioEmail: "legales@flota.com",
    destinatarioWhatsapp: null,
    vehiculoId: 20,
    patente: "AF999ZZ",
    metadata: JSON.stringify({ diasRestantes: 3 }),
    estado: "MOCK_DISPATCHED",
    createdAt: new Date("2026-08-19T11:00:00Z"),
  },
  {
    id: 3,
    empresaId: 1,
    modulo: "GEOCERCAS",
    tipo: "SALIDA_ZONA",
    severidad: "MEDIA",
    titulo: "Salida de geocerca no autorizada",
    mensaje: "El vehículo AB123CD egresó de Depósito Central.",
    canal: "WHATSAPP",
    destinatarioEmail: null,
    destinatarioWhatsapp: "+54 9 11 3333-4444",
    vehiculoId: 10,
    patente: "AB123CD",
    metadata: JSON.stringify({ geocerca: "Depósito Central" }),
    estado: "MOCK_DISPATCHED",
    createdAt: new Date("2026-08-19T11:45:00Z"),
  },
  {
    id: 4,
    empresaId: 1,
    modulo: "HORARIOS",
    tipo: "USO_FUERA_HORARIO",
    severidad: "BAJA",
    titulo: "Movimiento fuera de horario laboral",
    mensaje: "El vehículo CC555DD registró ignición a las 23:00.",
    canal: "EMAIL",
    destinatarioEmail: "seguridad@flota.com",
    destinatarioWhatsapp: null,
    vehiculoId: 30,
    patente: "CC555DD",
    metadata: null,
    estado: "MOCK_DISPATCHED",
    createdAt: new Date("2026-08-19T12:15:00Z"),
  },
];

vi.mock("@/lib/alerts/dispatcher", () => ({
  getAlertLogs: vi.fn().mockImplementation(async (filters?: any) => {
    let result = [...mockAlertLogsData];
    if (!filters) return result;
    if (filters.patente) {
      result = result.filter((l) => l.patente.toUpperCase() === filters.patente.toUpperCase());
    }
    if (filters.modulo) {
      result = result.filter((l) => l.modulo === filters.modulo);
    }
    if (filters.severidad) {
      result = result.filter((l) => l.severidad === filters.severidad);
    }
    if (filters.canal) {
      result = result.filter((l) => l.canal === filters.canal);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.titulo.toLowerCase().includes(s) ||
          l.mensaje.toLowerCase().includes(s) ||
          (l.patente && l.patente.toLowerCase().includes(s))
      );
    }
    return result;
  }),
}));

vi.mock("@/lib/alert-config-actions", () => ({
  getAlertConfigAction: vi.fn().mockResolvedValue({
    id: 1,
    empresaId: 1,
    canalEmail: 1,
    canalWhatsapp: 1,
    emailDestino: "alertas@flota.com",
    telefonoWhatsapp: "+54 9 11 5555-1234",
    toleranciaKm: 500,
    toleranciaDias: 15,
    modulosHabilitados: ["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS", "HORARIOS"],
    activo: 1,
  }),
  sendTestAlertAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { AlertsStatsCards } from "@/components/alertas/AlertsStatsCards";
import { AlertsFilterBar } from "@/components/alertas/AlertsFilterBar";
import { AlertsHistoryTable } from "@/components/alertas/AlertsHistoryTable";
import { AlertDetailDialog } from "@/components/alertas/AlertDetailDialog";
import MonitoreoAlertasPage from "@/app/panel/monitoreo/alertas/page";
import { GET as getAlertsHistoryRoute } from "@/app/api/alerts/history/route";

describe("Task 6: Monitoring & Alert History Console (/dashboard/monitoreo/alertas)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. GET /api/alerts/history API Route", () => {
    it("returns all alerts and calculated stats successfully", async () => {
      const req = new Request("http://localhost/api/alerts/history");
      const res = await getAlertsHistoryRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.alerts)).toBe(true);
      expect(json.alerts.length).toBe(4);
      expect(json.stats).toEqual({
        total: 4,
        whatsapp: 2, // AB123CD (AMBOS) + AB123CD (WHATSAPP)
        email: 3,    // AB123CD (AMBOS) + AF999ZZ (EMAIL) + CC555DD (EMAIL)
        critical: 2, // ALTA (1) + CRITICA (1)
      });
    });

    it("filters alerts by patente query parameter", async () => {
      const req = new Request("http://localhost/api/alerts/history?patente=AB123CD");
      const res = await getAlertsHistoryRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.alerts.length).toBe(2);
      expect(json.alerts.every((a: any) => a.patente === "AB123CD")).toBe(true);
    });

    it("filters alerts by module, severity, and channel", async () => {
      const req = new Request(
        "http://localhost/api/alerts/history?modulo=DOCUMENTACION&severidad=CRITICA&canal=EMAIL"
      );
      const res = await getAlertsHistoryRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.alerts.length).toBe(1);
      expect(json.alerts[0].tipo).toBe("VENCIMIENTO_SEGURO");
    });
  });

  describe("2. AlertsStatsCards Component", () => {
    it("renders 4 KPI summary cards with computed totals", () => {
      const stats = {
        total: 42,
        whatsapp: 18,
        email: 35,
        critical: 7,
      };

      const html = renderToStaticMarkup(<AlertsStatsCards stats={stats} />);

      expect(html).toContain("Total Alertas");
      expect(html).toContain("42");
      expect(html).toContain("WhatsApp");
      expect(html).toContain("18");
      expect(html).toContain("Email");
      expect(html).toContain("35");
      expect(html).toContain("Críticas / Altas");
      expect(html).toContain("7");
    });

    it("derives stats directly from alert logs array if stats object is omitted", () => {
      const html = renderToStaticMarkup(<AlertsStatsCards alerts={mockAlertLogsData as any} />);

      expect(html).toContain("Total Alertas");
      expect(html).toContain("4");
      expect(html).toContain("WhatsApp");
      expect(html).toContain("2");
      expect(html).toContain("Email");
      expect(html).toContain("3");
      expect(html).toContain("Críticas / Altas");
      expect(html).toContain("2");
    });
  });

  describe("3. AlertsFilterBar Component", () => {
    const defaultFilters = {
      search: "",
      patente: "AB123CD",
      modulo: "MANTENIMIENTO",
      severidad: "ALTA",
      canal: "AMBOS",
    };

    it("renders text search input and selects with initial values", () => {
      const html = renderToStaticMarkup(
        <AlertsFilterBar
          filters={defaultFilters}
          onFilterChange={() => {}}
          onReset={() => {}}
        />
      );

      expect(html).toContain("Buscar por patente, mensaje o destinatario...");
      expect(html).toContain("AB123CD");
      expect(html).toContain("Mantenimiento");
      expect(html).toContain("Alta");
      expect(html).toContain("Escanear Flota");
      expect(html).toContain("Alerta de Prueba");
      expect(html).toContain("Limpiar");
    });
  });

  describe("4. AlertsHistoryTable Component", () => {
    it("renders table headers and rows with module, severity, patente and actions", () => {
      const html = renderToStaticMarkup(
        <AlertsHistoryTable
          alerts={mockAlertLogsData as any}
          onSelectAlert={() => {}}
        />
      );

      expect(html).toContain("Fecha / Hora");
      expect(html).toContain("Vehículo");
      expect(html).toContain("Módulo");
      expect(html).toContain("Severidad");
      expect(html).toContain("Canal &amp; Destinatario");
      expect(html).toContain("Mensaje / Evento");

      // Verify row items
      expect(html).toContain("AB123CD");
      expect(html).toContain("AF999ZZ");
      expect(html).toContain("CC555DD");
      expect(html).toContain("Service 10.000km próximo");
      expect(html).toContain("Póliza de seguro por vencer");
    });

    it("renders empty state message when alerts list is empty", () => {
      const html = renderToStaticMarkup(
        <AlertsHistoryTable
          alerts={[]}
          onSelectAlert={() => {}}
        />
      );

      expect(html).toContain("No se encontraron alertas");
    });
  });

  describe("5. AlertDetailDialog Component", () => {
    it("renders modal dialog with complete payload and recipient information when open", () => {
      const sampleAlert = mockAlertLogsData[0];
      const html = renderToStaticMarkup(
        <AlertDetailDialog
          alert={sampleAlert as any}
          open={true}
          onOpenChange={() => {}}
        />
      );

      expect(html).toContain("Detalle de Alerta");
      expect(html).toContain("Service 10.000km próximo");
      expect(html).toContain("El vehículo AB123CD superó el kilometraje previsto.");
      expect(html).toContain("taller@flota.com");
      expect(html).toContain("+54 9 11 1111-2222");
      expect(html).toContain("AB123CD");
      expect(html).toContain("Mantenimiento");
    });

    it("does not render modal contents when closed", () => {
      const sampleAlert = mockAlertLogsData[0];
      const html = renderToStaticMarkup(
        <AlertDetailDialog
          alert={sampleAlert as any}
          open={false}
          onOpenChange={() => {}}
        />
      );

      expect(html).not.toContain("Detalle de Alerta");
    });
  });

  describe("6. MonitoreoAlertasPage (/dashboard/monitoreo/alertas)", () => {
    it("renders the complete monitoring dashboard layout with breadcrumb, KPI cards, filter bar, and history table", async () => {
      const pageElement = await MonitoreoAlertasPage({
        searchParams: { patente: "AB123CD" },
      });
      const html = renderToStaticMarkup(pageElement);

      expect(html).toContain("Historial de Alertas");
      expect(html).toContain("Monitoreo");
      expect(html).toContain("Total Alertas");
      expect(html).toContain("Escanear Flota");
      expect(html).toContain("AB123CD");
    });
  });
});
