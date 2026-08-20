import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  evaluateMaintenanceAlerts,
  evaluateDocumentAlerts,
  triggerGeofenceAlert,
  triggerScheduleAlert,
  scanAllFleetAlerts,
  setMockMaintenancePlans,
  resetMockMaintenancePlans,
  setMockTriggerDocuments,
  resetMockTriggerDocuments,
  type MockMaintenancePlan,
} from "@/lib/alerts/triggers";
import {
  resetMockAlertLogs,
  resetMockAlertConfigs,
  setMockAlertConfig,
  getMockAlertLogs,
} from "@/lib/alerts/dispatcher";
import { GET as getScanRoute, POST as postScanRoute } from "@/app/api/alerts/scan/route";
import { auth } from "@/auth";
import { db } from "@/db";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/db", () => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  return {
    db: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    },
  };
});

describe("Alert Triggers Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAlertLogs();
    resetMockAlertConfigs();
    resetMockMaintenancePlans();
    resetMockTriggerDocuments();

    // Default mock alert configuration for empresa 1
    setMockAlertConfig(1, {
      id: 1,
      empresaId: 1,
      canalEmail: 1,
      canalWhatsapp: 1,
      emailDestino: "alertas@flota.com",
      telefonoWhatsapp: "+5491199998888",
      toleranciaKm: 500,
      toleranciaDias: 15,
      modulosHabilitados: JSON.stringify([
        "MANTENIMIENTO",
        "DOCUMENTACION",
        "GEOCERCAS",
        "HORARIOS",
        "SISTEMA",
      ]),
      activo: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("evaluateMaintenanceAlerts", () => {
    it("should trigger SERVICE_VENCIDO (severity ALTA) when vehicle km exceeds service interval", async () => {
      const mockPlans: MockMaintenancePlan[] = [
        {
          id: 1,
          vehicleId: 10,
          empresaId: 1,
          patente: "AA111BB",
          modelo: "Ranger",
          marca: "Ford",
          componente: "Aceite y Filtros",
          intervaloKm: 10000,
          ultimoServiceKm: 50000, // Due at 60000
          kilometrajeActual: 60500, // Exceeded by 500km
        },
      ];
      setMockMaintenancePlans(mockPlans);

      const results = await evaluateMaintenanceAlerts(1);

      expect(results.length).toBe(1);
      expect(results[0].tipo).toBe("SERVICE_VENCIDO");
      expect(results[0].severidad).toBe("ALTA");
      expect(results[0].patente).toBe("AA111BB");
      expect(results[0].titulo).toContain("Service Vencido");
      expect(results[0].titulo).toContain("AA111BB");
      expect(results[0].mensaje).toContain("Aceite y Filtros");
      expect(results[0].mensaje).toContain("60.500");
      expect(results[0].dispatchResult.success).toBe(true);

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].modulo).toBe("MANTENIMIENTO");
      expect(logs[0].tipo).toBe("SERVICE_VENCIDO");
      expect(logs[0].severidad).toBe("ALTA");
    });

    it("should trigger SERVICE_PROXIMO (severity MEDIA) when vehicle km is within toleranciaKm", async () => {
      // toleranciaKm is 500km
      const mockPlans: MockMaintenancePlan[] = [
        {
          id: 2,
          vehicleId: 20,
          empresaId: 1,
          patente: "CC222DD",
          modelo: "Gol",
          marca: "Volkswagen",
          componente: "Pastillas de Freno",
          intervaloKm: 20000,
          ultimoServiceKm: 40000, // Due at 60000
          kilometrajeActual: 59700, // 300km remaining (<= 500 tolerance)
        },
      ];
      setMockMaintenancePlans(mockPlans);

      const results = await evaluateMaintenanceAlerts(1);

      expect(results.length).toBe(1);
      expect(results[0].tipo).toBe("SERVICE_PROXIMO");
      expect(results[0].severidad).toBe("MEDIA");
      expect(results[0].patente).toBe("CC222DD");
      expect(results[0].titulo).toContain("Próximo Service");
      expect(results[0].mensaje).toContain("300 km");
      expect(results[0].dispatchResult.success).toBe(true);

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].modulo).toBe("MANTENIMIENTO");
      expect(logs[0].tipo).toBe("SERVICE_PROXIMO");
      expect(logs[0].severidad).toBe("MEDIA");
    });

    it("should NOT trigger alert when vehicle km is well below threshold", async () => {
      const mockPlans: MockMaintenancePlan[] = [
        {
          id: 3,
          vehicleId: 30,
          empresaId: 1,
          patente: "EE333FF",
          modelo: "Atron",
          marca: "Mercedes-Benz",
          componente: "Distribución",
          intervaloKm: 50000,
          ultimoServiceKm: 100000, // Due at 150000
          kilometrajeActual: 120000, // 30000km remaining (> 500 tolerance)
        },
      ];
      setMockMaintenancePlans(mockPlans);

      const results = await evaluateMaintenanceAlerts(1);

      expect(results.length).toBe(0);
      expect(getMockAlertLogs().length).toBe(0);
    });

    it("should query database when db is available and mock fallback is not used", async () => {
      const dbRow = {
        id: 101,
        vehicleId: 40,
        patente: "GG444HH",
        modelo: "Cronos",
        marca: "Fiat",
        componente: "Bujías",
        intervaloKm: 30000,
        ultimoServiceKm: 0,
        kilometrajeActual: 31000, // overdue by 1000km
        empresaId: 1,
      };

      (db.select as any).mockReturnValueOnce({
        from: () => ({
          innerJoin: () => ({
            where: vi.fn().mockResolvedValueOnce([dbRow]),
          }),
        }),
      });

      const results = await evaluateMaintenanceAlerts(1);

      expect(results.length).toBe(1);
      expect(results[0].tipo).toBe("SERVICE_VENCIDO");
      expect(results[0].patente).toBe("GG444HH");
      expect(results[0].dispatchResult.success).toBe(true);
    });
  });

  describe("evaluateDocumentAlerts", () => {
    it("should trigger DOC_VENCIDO (severity ALTA) for expired documents and RTOs", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      setMockTriggerDocuments([
        {
          id: 201,
          vehicleId: 10,
          empresaId: 1,
          patente: "AA111BB",
          title: "Póliza de Seguro",
          fechaVencimiento: pastDate,
        },
      ]);

      const results = await evaluateDocumentAlerts(1);

      expect(results.length).toBe(1);
      expect(results[0].tipo).toBe("DOC_VENCIDO");
      expect(results[0].severidad).toBe("ALTA");
      expect(results[0].patente).toBe("AA111BB");
      expect(results[0].titulo).toContain("Documento Vencido");
      expect(results[0].titulo).toContain("Póliza de Seguro");
      expect(results[0].dispatchResult.success).toBe(true);

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].modulo).toBe("DOCUMENTACION");
      expect(logs[0].tipo).toBe("DOC_VENCIDO");
      expect(logs[0].severidad).toBe("ALTA");
    });

    it("should trigger DOC_POR_VENCER (severity MEDIA) for documents expiring within toleranciaDias", async () => {
      const now = new Date();
      const soonDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now (within 15 days tolerance)

      setMockTriggerDocuments([
        {
          id: 202,
          vehicleId: 20,
          empresaId: 1,
          patente: "CC222DD",
          title: "VTV / RTO Obligatoria",
          fechaVencimiento: soonDate,
        },
      ]);

      const results = await evaluateDocumentAlerts(1);

      expect(results.length).toBe(1);
      expect(results[0].tipo).toBe("DOC_POR_VENCER");
      expect(results[0].severidad).toBe("MEDIA");
      expect(results[0].patente).toBe("CC222DD");
      expect(results[0].titulo).toContain("Documento por Vencer");
      expect(results[0].mensaje).toContain("7 días");
      expect(results[0].dispatchResult.success).toBe(true);

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].modulo).toBe("DOCUMENTACION");
      expect(logs[0].tipo).toBe("DOC_POR_VENCER");
      expect(logs[0].severidad).toBe("MEDIA");
    });

    it("should NOT trigger alert for documents expiring beyond toleranciaDias", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now (> 15 days tolerance)

      setMockTriggerDocuments([
        {
          id: 203,
          vehicleId: 30,
          empresaId: 1,
          patente: "EE333FF",
          title: "Habilitación RUTA",
          fechaVencimiento: futureDate,
        },
      ]);

      const results = await evaluateDocumentAlerts(1);

      expect(results.length).toBe(0);
      expect(getMockAlertLogs().length).toBe(0);
    });
  });

  describe("triggerGeofenceAlert", () => {
    it("should trigger GEOCERCA_EXIT with severity ALTA when vehicle leaves geofence", async () => {
      const result = await triggerGeofenceAlert({
        empresaId: 1,
        vehicleId: 10,
        patente: "AA111BB",
        geofenceId: 5,
        geofenceName: "Base Operativa Central",
        eventType: "EXIT",
        currentSpeed: 45,
      });

      expect(result.success).toBe(true);
      expect(result.dispatchedChannels).toEqual(["EMAIL", "WHATSAPP"]);

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].modulo).toBe("GEOCERCAS");
      expect(logs[0].tipo).toBe("GEOCERCA_EXIT");
      expect(logs[0].severidad).toBe("ALTA");
      expect(logs[0].titulo).toContain("Salida de Geocerca");
      expect(logs[0].titulo).toContain("Base Operativa Central");
      expect(logs[0].mensaje).toContain("AA111BB");
    });

    it("should trigger GEOCERCA_ENTER with severity MEDIA when vehicle enters geofence", async () => {
      const result = await triggerGeofenceAlert({
        empresaId: 1,
        vehicleId: 20,
        patente: "CC222DD",
        geofenceId: 6,
        geofenceName: "Depósito Norte",
        eventType: "ENTER",
      });

      expect(result.success).toBe(true);

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].modulo).toBe("GEOCERCAS");
      expect(logs[0].tipo).toBe("GEOCERCA_ENTER");
      expect(logs[0].severidad).toBe("MEDIA");
      expect(logs[0].titulo).toContain("Entrada a Geocerca");
    });

    it("should trigger GEOCERCA_SPEED_LIMIT with severity ALTA and formatted speeds", async () => {
      const result = await triggerGeofenceAlert({
        empresaId: 1,
        vehicleId: 30,
        patente: "EE333FF",
        geofenceId: 7,
        geofenceName: "Zona Industrial Carga",
        eventType: "SPEED_LIMIT",
        currentSpeed: 65,
        speedLimit: 40,
      });

      expect(result.success).toBe(true);

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].modulo).toBe("GEOCERCAS");
      expect(logs[0].tipo).toBe("GEOCERCA_SPEED_LIMIT");
      expect(logs[0].severidad).toBe("ALTA");
      expect(logs[0].titulo).toContain("Exceso de Velocidad");
      expect(logs[0].mensaje).toContain("65 km/h");
      expect(logs[0].mensaje).toContain("40 km/h");
    });
  });

  describe("triggerScheduleAlert", () => {
    it("should trigger HORARIO_NO_AUTORIZADO with severity CRITICA and detail information", async () => {
      const result = await triggerScheduleAlert({
        empresaId: 1,
        vehicleId: 50,
        patente: "ZZ999YY",
        scheduleId: 12,
        scheduleName: "Horario Comercial Central",
        violationReason: "Movimiento detectado en día no laborable (Domingo 03:30 hs)",
        currentSpeed: 52,
        lat: -38.718,
        lng: -62.264,
      });

      expect(result.success).toBe(true);
      expect(result.dispatchedChannels).toEqual(["EMAIL", "WHATSAPP"]);

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].modulo).toBe("HORARIOS");
      expect(logs[0].tipo).toBe("HORARIO_NO_AUTORIZADO");
      expect(logs[0].severidad).toBe("CRITICA");
      expect(logs[0].titulo).toContain("Uso no autorizado fuera de horario");
      expect(logs[0].mensaje).toContain("Domingo 03:30 hs");
      expect(logs[0].mensaje).toContain("52 km/h");
    });
  });

  describe("scanAllFleetAlerts", () => {
    it("should aggregate maintenance and document evaluations into a summary", async () => {
      // 1 overdue maintenance plan
      setMockMaintenancePlans([
        {
          id: 1,
          vehicleId: 10,
          empresaId: 1,
          patente: "AA111BB",
          componente: "Aceite y Filtros",
          intervaloKm: 10000,
          ultimoServiceKm: 50000,
          kilometrajeActual: 61000,
        },
      ]);

      // 1 expired document
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      setMockTriggerDocuments([
        {
          id: 201,
          vehicleId: 10,
          empresaId: 1,
          patente: "AA111BB",
          title: "Seguro Todo Riesgo",
          fechaVencimiento: pastDate,
        },
      ]);

      const summary = await scanAllFleetAlerts(1);

      expect(summary).toBeDefined();
      expect(summary.empresaId).toBe(1);
      expect(summary.scannedAt).toBeInstanceOf(Date);
      expect(summary.maintenance.length).toBe(1);
      expect(summary.documents.length).toBe(1);
      expect(summary.totalTriggered).toBe(2);

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(2);
    });
  });

  describe("API Route: /api/alerts/scan", () => {
    it("should run scan on GET for authenticated user", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      setMockMaintenancePlans([]);
      setMockTriggerDocuments([]);

      const req = new Request("http://localhost/api/alerts/scan");
      const res = await getScanRoute(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.count).toBe(0);
      expect(body.results).toBeDefined();
      expect(body.results.empresaId).toBe(1);
    });

    it("should run scan on POST with custom empresaId in body or session", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      setMockMaintenancePlans([
        {
          id: 1,
          vehicleId: 1,
          empresaId: 1,
          patente: "AA123BB",
          componente: "Frenos",
          intervaloKm: 10000,
          ultimoServiceKm: 20000,
          kilometrajeActual: 30500,
        },
      ]);
      setMockTriggerDocuments([]);

      const req = new Request("http://localhost/api/alerts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: 1 }),
      });

      const res = await postScanRoute(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.count).toBe(1);
      expect(body.results.maintenance.length).toBe(1);
    });

    it("should return 401 on GET when unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const req = new Request("http://localhost/api/alerts/scan");
      const res = await getScanRoute(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });
  });
});
