import { describe, it, expect } from "vitest";
import { ticketsSoporte } from "../src/db/schema";
import type {
  TicketOrigen,
  TicketTipo,
  TicketPrioridad,
  TicketEstado,
  PreferenciaRespuesta,
  TicketSoporteRow,
  CreateTicketInput,
  TicketFilters,
} from "../src/types/soporte";

describe("Tickets Soporte Schema and Types", () => {
  describe("Drizzle Schema (tickets_soporte table)", () => {
    it("should export ticketsSoporte table with all expected columns", () => {
      expect(ticketsSoporte).toBeDefined();
      expect(ticketsSoporte.id).toBeDefined();
      expect(ticketsSoporte.origen).toBeDefined();
      expect(ticketsSoporte.empresaId).toBeDefined();
      expect(ticketsSoporte.userId).toBeDefined();
      expect(ticketsSoporte.nombreContacto).toBeDefined();
      expect(ticketsSoporte.emailContacto).toBeDefined();
      expect(ticketsSoporte.telefonoContacto).toBeDefined();
      expect(ticketsSoporte.empresaNombreManual).toBeDefined();
      expect(ticketsSoporte.tipo).toBeDefined();
      expect(ticketsSoporte.prioridad).toBeDefined();
      expect(ticketsSoporte.estado).toBeDefined();
      expect(ticketsSoporte.asunto).toBeDefined();
      expect(ticketsSoporte.mensaje).toBeDefined();
      expect(ticketsSoporte.preferenciaRespuesta).toBeDefined();
      expect(ticketsSoporte.notasInternas).toBeDefined();
      expect(ticketsSoporte.resueltoPor).toBeDefined();
      expect(ticketsSoporte.resueltoAt).toBeDefined();
      expect(ticketsSoporte.createdAt).toBeDefined();
      expect(ticketsSoporte.updatedAt).toBeDefined();
    });
  });

  describe("TypeScript Types and Interfaces", () => {
    it("should validate TicketSoporteRow type structure", () => {
      const ticket: TicketSoporteRow = {
        id: 1,
        origen: "PANEL",
        empresaId: 5,
        empresaNombre: "Empresa Test S.A.",
        userId: "user-uuid-123",
        userName: "Juan Perez",
        nombreContacto: "Juan Perez",
        emailContacto: "juan@empresa.com",
        telefonoContacto: "+541123456789",
        empresaNombreManual: null,
        tipo: "PROBLEMA_TECNICO",
        prioridad: "ALTA",
        estado: "PENDIENTE",
        preferenciaRespuesta: "EMAIL",
        asunto: "Error en visualización de mapa",
        mensaje: "El mapa no carga los marcadores de la flota.",
        notasInternas: "Revisando logs de geocoding",
        resueltoPor: null,
        resueltoAt: null,
        createdAt: new Date("2026-08-21T00:00:00.000Z"),
        updatedAt: new Date("2026-08-21T00:00:00.000Z"),
      };

      expect(ticket.id).toBe(1);
      expect(ticket.origen).toBe("PANEL");
      expect(ticket.tipo).toBe("PROBLEMA_TECNICO");
      expect(ticket.prioridad).toBe("ALTA");
      expect(ticket.estado).toBe("PENDIENTE");
      expect(ticket.preferenciaRespuesta).toBe("EMAIL");
    });

    it("should validate CreateTicketInput type structure", () => {
      const input: CreateTicketInput = {
        origen: "WEB",
        nombreContacto: "Maria Gonzalez",
        emailContacto: "maria@externo.com",
        telefonoContacto: "+5491198765432",
        empresaNombreManual: "Logística Express",
        tipo: "FACTURACION",
        prioridad: "MEDIA",
        asunto: "Consulta por factura",
        mensaje: "Necesito copia de la factura de julio.",
        preferenciaRespuesta: "WHATSAPP",
      };

      expect(input.origen).toBe("WEB");
      expect(input.nombreContacto).toBe("Maria Gonzalez");
      expect(input.tipo).toBe("FACTURACION");
      expect(input.preferenciaRespuesta).toBe("WHATSAPP");
    });

    it("should validate TicketFilters type structure", () => {
      const filters: TicketFilters = {
        estado: "PENDIENTE",
        prioridad: "URGENTE",
        tipo: "DISPOSITIVO_GPS",
        origen: "PANEL",
        empresaId: 3,
        search: "GPS offline",
      };

      expect(filters.estado).toBe("PENDIENTE");
      expect(filters.prioridad).toBe("URGENTE");
      expect(filters.tipo).toBe("DISPOSITIVO_GPS");
      expect(filters.origen).toBe("PANEL");
      expect(filters.empresaId).toBe(3);
      expect(filters.search).toBe("GPS offline");
    });

    it("should allow all enum union values", () => {
      const origenes: TicketOrigen[] = ["PANEL", "WEB"];
      const tipos: TicketTipo[] = [
        "PROBLEMA_TECNICO",
        "DISPOSITIVO_GPS",
        "FACTURACION",
        "QUEJA_RECLAMO",
        "CONSULTA_GENERAL",
        "OTRO",
      ];
      const prioridades: TicketPrioridad[] = ["BAJA", "MEDIA", "ALTA", "URGENTE"];
      const estados: TicketEstado[] = ["PENDIENTE", "EN_REVISION", "RESUELTO", "DESCARTADO"];
      const preferencias: PreferenciaRespuesta[] = ["EMAIL", "WHATSAPP"];

      expect(origenes).toHaveLength(2);
      expect(tipos).toHaveLength(6);
      expect(prioridades).toHaveLength(4);
      expect(estados).toHaveLength(4);
      expect(preferencias).toHaveLength(2);
    });
  });
});
