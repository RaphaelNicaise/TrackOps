import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  dispatchAlert,
  getAlertLogs,
  getMockAlertLogs,
  resetMockAlertLogs,
  setMockAlertConfig,
  resetMockAlertConfigs,
  formatAlertConsoleLog,
} from "@/lib/alerts/dispatcher";
import type { DispatchAlertParams } from "@/types/alerts";

describe("Central Alert Dispatcher Engine", () => {
  beforeEach(() => {
    resetMockAlertLogs();
    resetMockAlertConfigs();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Configuration & Module Validation", () => {
    it("should skip dispatch when the alerts system is globally disabled (activo = 0)", async () => {
      setMockAlertConfig(1, {
        activo: 0,
        canalEmail: 1,
        emailDestino: "admin@prada.com",
        modulosHabilitados: JSON.stringify(["MANTENIMIENTO", "DOCUMENTACION"]),
      });

      const params: DispatchAlertParams = {
        empresaId: 1,
        modulo: "MANTENIMIENTO",
        tipo: "SERVICE_KM",
        titulo: "Service 10.000km próximo",
        mensaje: "El vehículo AA123BB requiere cambio de aceite en 200km.",
        patente: "AA123BB",
      };

      const result = await dispatchAlert(params);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("ALERTS_SYSTEM_DISABLED");
      expect(result.dispatchedChannels).toEqual([]);
      expect(getMockAlertLogs().length).toBe(0);
    });

    it("should skip dispatch when the module is not enabled in company config", async () => {
      setMockAlertConfig(1, {
        activo: 1,
        canalEmail: 1,
        emailDestino: "admin@prada.com",
        modulosHabilitados: JSON.stringify(["MANTENIMIENTO"]), // DOCUMENTACION is disabled
      });

      const params: DispatchAlertParams = {
        empresaId: 1,
        modulo: "DOCUMENTACION",
        tipo: "VTV_VENCIDA",
        titulo: "VTV Vencida",
        mensaje: "La VTV del vehículo AC456DD venció.",
        patente: "AC456DD",
      };

      const result = await dispatchAlert(params);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("MODULE_DISABLED");
      expect(result.dispatchedChannels).toEqual([]);
      expect(getMockAlertLogs().length).toBe(0);
    });

    it("should return NO_ACTIVE_CHANNELS when neither email nor whatsapp is active or configured", async () => {
      setMockAlertConfig(1, {
        activo: 1,
        canalEmail: 0,
        canalWhatsapp: 0,
        emailDestino: "admin@prada.com",
        telefonoWhatsapp: "+5491112345678",
        modulosHabilitados: JSON.stringify(["MANTENIMIENTO"]),
      });

      const params: DispatchAlertParams = {
        empresaId: 1,
        modulo: "MANTENIMIENTO",
        tipo: "SERVICE_KM",
        titulo: "Service próximo",
        mensaje: "Mensaje de prueba",
      };

      const result = await dispatchAlert(params);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("NO_ACTIVE_CHANNELS");
      expect(result.dispatchedChannels).toEqual([]);
    });
  });

  describe("Channel Dispatch & Console Logging", () => {
    it("should dispatch to Email only when canalEmail is active and log formatted output", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      setMockAlertConfig(1, {
        activo: 1,
        canalEmail: 1,
        canalWhatsapp: 0,
        emailDestino: "flota@empresa.com",
        telefonoWhatsapp: null,
        modulosHabilitados: JSON.stringify(["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS"]),
      });

      const params: DispatchAlertParams = {
        empresaId: 1,
        modulo: "MANTENIMIENTO",
        tipo: "SERVICE_KM",
        severidad: "ALTA",
        titulo: "Mantenimiento Preventivo Urgente",
        mensaje: "El camión Mercedes-Benz superó los 50.000km",
        vehiculoId: 10,
        patente: "AF789GH",
      };

      const result = await dispatchAlert(params);

      expect(result.success).toBe(true);
      expect(result.dispatchedChannels).toEqual(["EMAIL"]);
      expect(result.destinatarioEmail).toBe("flota@empresa.com");
      expect(result.destinatarioWhatsapp).toBeNull();
      expect(result.logId).toBeDefined();
      expect(result.loggedAt).toBeInstanceOf(Date);

      // Verify console log formatting
      expect(consoleSpy).toHaveBeenCalled();
      const loggedText = consoleSpy.mock.calls[0][0];
      expect(loggedText).toContain("🚨 [ALERT DISPATCH ENGINE] - MÓDULO: MANTENIMIENTO | SEVERIDAD: ALTA");
      expect(loggedText).toContain("🚗 Vehículo: AF789GH (ID: 10)");
      expect(loggedText).toContain("📋 Título: Mantenimiento Preventivo Urgente");
      expect(loggedText).toContain("📝 Mensaje: El camión Mercedes-Benz superó los 50.000km");
      expect(loggedText).toContain("✉️  EMAIL    -> Destino: [flota@empresa.com]");
      expect(loggedText).not.toContain("📱 WHATSAPP");

      // Verify stored mock alert log
      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].modulo).toBe("MANTENIMIENTO");
      expect(logs[0].canal).toBe("EMAIL");
      expect(logs[0].destinatarioEmail).toBe("flota@empresa.com");
      expect(logs[0].patente).toBe("AF789GH");
      expect(logs[0].estado).toBe("MOCK_DISPATCHED");
    });

    it("should dispatch to WhatsApp only when canalWhatsapp is active and log formatted output", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      setMockAlertConfig(1, {
        activo: 1,
        canalEmail: 0,
        canalWhatsapp: 1,
        emailDestino: "flota@empresa.com",
        telefonoWhatsapp: "+5491198765432",
        modulosHabilitados: JSON.stringify(["GEOCERCAS"]),
      });

      const params: DispatchAlertParams = {
        empresaId: 1,
        modulo: "GEOCERCAS",
        tipo: "SALIDA_ZONA",
        severidad: "CRITICA",
        titulo: "Salida no autorizada de Geocerca",
        mensaje: "El vehículo salió del perímetro Base Central a las 22:30 hs",
        vehiculoId: 5,
        patente: "AB999CD",
      };

      const result = await dispatchAlert(params);

      expect(result.success).toBe(true);
      expect(result.dispatchedChannels).toEqual(["WHATSAPP"]);
      expect(result.destinatarioEmail).toBeNull();
      expect(result.destinatarioWhatsapp).toBe("+5491198765432");

      expect(consoleSpy).toHaveBeenCalled();
      const loggedText = consoleSpy.mock.calls[0][0];
      expect(loggedText).toContain("🚨 [ALERT DISPATCH ENGINE] - MÓDULO: GEOCERCAS | SEVERIDAD: CRITICA");
      expect(loggedText).toContain("📱 WHATSAPP -> Destino: [+5491198765432]");
      expect(loggedText).not.toContain("✉️  EMAIL");

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].canal).toBe("WHATSAPP");
      expect(logs[0].destinatarioWhatsapp).toBe("+5491198765432");
    });

    it("should dispatch to both Email and WhatsApp when both channels are active", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      setMockAlertConfig(1, {
        activo: 1,
        canalEmail: 1,
        canalWhatsapp: 1,
        emailDestino: "alertas@flota.com",
        telefonoWhatsapp: "+5491155554444",
        modulosHabilitados: JSON.stringify(["HORARIOS", "SISTEMA"]),
      });

      const params: DispatchAlertParams = {
        empresaId: 1,
        modulo: "HORARIOS",
        tipo: "USO_FUERA_DE_HORA",
        severidad: "ALTA",
        titulo: "Uso no autorizado fuera de horario",
        mensaje: "Movimiento detectado en horario restringido (Domingo 03:00)",
        patente: "AE111ZZ",
      };

      const result = await dispatchAlert(params);

      expect(result.success).toBe(true);
      expect(result.dispatchedChannels).toEqual(["EMAIL", "WHATSAPP"]);
      expect(result.destinatarioEmail).toBe("alertas@flota.com");
      expect(result.destinatarioWhatsapp).toBe("+5491155554444");

      expect(consoleSpy).toHaveBeenCalled();
      const loggedText = consoleSpy.mock.calls[0][0];
      expect(loggedText).toContain("✉️  EMAIL    -> Destino: [alertas@flota.com]");
      expect(loggedText).toContain("📱 WHATSAPP -> Destino: [+5491155554444]");

      const logs = getMockAlertLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].canal).toBe("AMBOS");
    });

    it("should respect overrideEmail and overrideWhatsapp parameters", async () => {
      setMockAlertConfig(1, {
        activo: 1,
        canalEmail: 1,
        canalWhatsapp: 1,
        emailDestino: "default@flota.com",
        telefonoWhatsapp: "+5491100000000",
        modulosHabilitados: JSON.stringify(["SISTEMA"]),
      });

      const params: DispatchAlertParams = {
        empresaId: 1,
        modulo: "SISTEMA",
        tipo: "TEST_ALERT",
        titulo: "Alerta de Prueba",
        mensaje: "Prueba de envío con overrides",
        overrideEmail: "custom@custom.com",
        overrideWhatsapp: "+5491188889999",
      };

      const result = await dispatchAlert(params);

      expect(result.success).toBe(true);
      expect(result.destinatarioEmail).toBe("custom@custom.com");
      expect(result.destinatarioWhatsapp).toBe("+5491188889999");
    });
  });

  describe("History Querying & Filtering (getAlertLogs)", () => {
    beforeEach(async () => {
      setMockAlertConfig(1, {
        activo: 1,
        canalEmail: 1,
        canalWhatsapp: 1,
        emailDestino: "admin@prada.com",
        telefonoWhatsapp: "+5491122223333",
        modulosHabilitados: JSON.stringify(["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS", "HORARIOS", "SISTEMA"]),
      });

      // Dispatch multiple mock alerts
      await dispatchAlert({
        empresaId: 1,
        modulo: "MANTENIMIENTO",
        tipo: "SERVICE_KM",
        severidad: "MEDIA",
        titulo: "Cambio de pastillas de freno",
        mensaje: "Freno delantero desgastado",
        patente: "AA100AA",
      });

      await dispatchAlert({
        empresaId: 1,
        modulo: "MANTENIMIENTO",
        tipo: "CAMBIO_ACEITE",
        severidad: "ALTA",
        titulo: "Cambio de aceite requerido",
        mensaje: "Aceite sintético 15w40",
        patente: "BB200BB",
      });

      await dispatchAlert({
        empresaId: 1,
        modulo: "DOCUMENTACION",
        tipo: "SEGURO_VENCIMIENTO",
        severidad: "CRITICA",
        titulo: "Póliza de seguro por vencer",
        mensaje: "Póliza vence en 3 días",
        patente: "AA100AA",
      });

      await dispatchAlert({
        empresaId: 2,
        modulo: "GEOCERCAS",
        tipo: "EXCESO_VELOCIDAD_ZONA",
        severidad: "ALTA",
        titulo: "Exceso de velocidad en planta",
        mensaje: "Velocidad registrada: 45 km/h en zona 20 km/h",
        patente: "CC300CC",
        overrideEmail: "empresa2@test.com",
      });
    });

    it("should retrieve all alert logs when no filters are applied", async () => {
      const logs = await getAlertLogs();
      expect(logs.length).toBe(4);
    });

    it("should filter alert logs by empresaId", async () => {
      const logs = await getAlertLogs({ empresaId: 1 });
      expect(logs.length).toBe(3);
      expect(logs.every((l) => l.empresaId === 1)).toBe(true);
    });

    it("should filter alert logs by patente", async () => {
      const logs = await getAlertLogs({ patente: "AA100AA" });
      expect(logs.length).toBe(2);
      expect(logs.every((l) => l.patente === "AA100AA")).toBe(true);
    });

    it("should filter alert logs by modulo", async () => {
      const logs = await getAlertLogs({ modulo: "MANTENIMIENTO" });
      expect(logs.length).toBe(2);
      expect(logs.every((l) => l.modulo === "MANTENIMIENTO")).toBe(true);
    });

    it("should filter alert logs by severidad", async () => {
      const logs = await getAlertLogs({ severidad: "CRITICA" });
      expect(logs.length).toBe(1);
      expect(logs[0].titulo).toBe("Póliza de seguro por vencer");
    });

    it("should search across title, message, and plate with free text search", async () => {
      const searchByText = await getAlertLogs({ search: "pastillas" });
      expect(searchByText.length).toBe(1);
      expect(searchByText[0].titulo).toContain("Cambio de pastillas");

      const searchByPlate = await getAlertLogs({ search: "BB200BB" });
      expect(searchByPlate.length).toBe(1);
      expect(searchByPlate[0].patente).toBe("BB200BB");
    });
  });

  describe("formatAlertConsoleLog helper", () => {
    it("should return clean formatted text representation", () => {
      const formatted = formatAlertConsoleLog(
        {
          empresaId: 1,
          modulo: "SISTEMA",
          tipo: "PING",
          titulo: "Test Ping",
          mensaje: "Sistema operativo normal",
          patente: "ZZ999YY",
          vehiculoId: 42,
        },
        {
          emailDest: "ops@prada.com",
          phoneDest: "+5491111111111",
          severidad: "BAJA",
        }
      );

      expect(formatted).toContain("🚨 [ALERT DISPATCH ENGINE] - MÓDULO: SISTEMA | SEVERIDAD: BAJA");
      expect(formatted).toContain("🚗 Vehículo: ZZ999YY (ID: 42)");
      expect(formatted).toContain("✉️  EMAIL    -> Destino: [ops@prada.com]");
      expect(formatted).toContain("📱 WHATSAPP -> Destino: [+5491111111111]");
    });
  });
});
