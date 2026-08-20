import { describe, it, expect } from "vitest";
import { alertConfigs, alertLogs, type AlertLog, type NewAlertLog, type AlertConfig, type NewAlertConfig } from "@/db/schema";

describe("Alerts Schema", () => {
  describe("alertConfigs table", () => {
    it("should have all required column definitions including modulosHabilitados", () => {
      expect(alertConfigs.id).toBeDefined();
      expect(alertConfigs.empresaId).toBeDefined();
      expect(alertConfigs.canalEmail).toBeDefined();
      expect(alertConfigs.canalWhatsapp).toBeDefined();
      expect(alertConfigs.emailDestino).toBeDefined();
      expect(alertConfigs.telefonoWhatsapp).toBeDefined();
      expect(alertConfigs.toleranciaKm).toBeDefined();
      expect(alertConfigs.toleranciaDias).toBeDefined();
      expect(alertConfigs.activo).toBeDefined();
      expect(alertConfigs.modulosHabilitados).toBeDefined();
      expect(alertConfigs.createdAt).toBeDefined();
    });

    it("should have correct default value for modulosHabilitados", () => {
      expect(alertConfigs.modulosHabilitados.default).toBe('["MANTENIMIENTO","DOCUMENTACION","GEOCERCAS","HORARIOS"]');
    });
  });

  describe("alertLogs table", () => {
    it("should have all required column definitions", () => {
      expect(alertLogs.id).toBeDefined();
      expect(alertLogs.empresaId).toBeDefined();
      expect(alertLogs.modulo).toBeDefined();
      expect(alertLogs.tipo).toBeDefined();
      expect(alertLogs.severidad).toBeDefined();
      expect(alertLogs.titulo).toBeDefined();
      expect(alertLogs.mensaje).toBeDefined();
      expect(alertLogs.canal).toBeDefined();
      expect(alertLogs.destinatarioEmail).toBeDefined();
      expect(alertLogs.destinatarioWhatsapp).toBeDefined();
      expect(alertLogs.vehiculoId).toBeDefined();
      expect(alertLogs.patente).toBeDefined();
      expect(alertLogs.metadata).toBeDefined();
      expect(alertLogs.estado).toBeDefined();
      expect(alertLogs.createdAt).toBeDefined();
    });

    it("should have correct default values for severidad and estado", () => {
      expect(alertLogs.severidad.default).toBe("MEDIA");
      expect(alertLogs.estado.default).toBe("MOCK_DISPATCHED");
    });
  });

  describe("Type definitions", () => {
    it("should compile type annotations properly", () => {
      const mockConfig: Partial<AlertConfig> = {
        id: 1,
        empresaId: 1,
        modulosHabilitados: '["MANTENIMIENTO"]',
      };
      const mockNewConfig: Partial<NewAlertConfig> = {
        empresaId: 1,
      };
      const mockLog: Partial<AlertLog> = {
        id: 1,
        empresaId: 1,
        modulo: "MANTENIMIENTO",
        tipo: "KM_EXCEDIDO",
        severidad: "ALTA",
        titulo: "Alerta de prueba",
        mensaje: "Mensaje de prueba",
        canal: "EMAIL",
        estado: "MOCK_DISPATCHED",
      };
      const mockNewLog: Partial<NewAlertLog> = {
        empresaId: 1,
        modulo: "MANTENIMIENTO",
        tipo: "KM_EXCEDIDO",
        titulo: "Alerta de prueba",
        mensaje: "Mensaje de prueba",
        canal: "EMAIL",
      };

      expect(mockConfig).toBeDefined();
      expect(mockNewConfig).toBeDefined();
      expect(mockLog).toBeDefined();
      expect(mockNewLog).toBeDefined();
    });
  });
});
