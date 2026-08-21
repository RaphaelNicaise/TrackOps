import { describe, it, expect } from "vitest";
import { users, choferes, sitios, viajes } from "../src/db/schema";
import type {
  ChoferEstado,
  SitioTipo,
  ViajeEstado,
  UbicacionTipo,
  ChoferRow,
  SitioRow,
  ViajeRow,
  CreateChoferInput,
  CreateSitioInput,
  CreateViajeInput,
} from "../src/types/flota-viajes";

describe("Flota Viajes Schema & Types (choferes, sitios, viajes, users.dni)", () => {
  describe("Drizzle Schema - users table extension", () => {
    it("should have dni column on users table", () => {
      expect(users.dni).toBeDefined();
    });
  });

  describe("Drizzle Schema - choferes table", () => {
    it("should export choferes table with all expected columns", () => {
      expect(choferes).toBeDefined();
      expect(choferes.id).toBeDefined();
      expect(choferes.empresaId).toBeDefined();
      expect(choferes.userId).toBeDefined();
      expect(choferes.nombre).toBeDefined();
      expect(choferes.apellido).toBeDefined();
      expect(choferes.dni).toBeDefined();
      expect(choferes.telefono).toBeDefined();
      expect(choferes.email).toBeDefined();
      expect(choferes.licenciaNumero).toBeDefined();
      expect(choferes.licenciaCategoria).toBeDefined();
      expect(choferes.licenciaVencimiento).toBeDefined();
      expect(choferes.estado).toBeDefined();
      expect(choferes.vehiculoHabitualId).toBeDefined();
      expect(choferes.notas).toBeDefined();
      expect(choferes.createdAt).toBeDefined();
      expect(choferes.updatedAt).toBeDefined();
    });
  });

  describe("Drizzle Schema - sitios table", () => {
    it("should export sitios table with all expected columns", () => {
      expect(sitios).toBeDefined();
      expect(sitios.id).toBeDefined();
      expect(sitios.empresaId).toBeDefined();
      expect(sitios.nombre).toBeDefined();
      expect(sitios.tipo).toBeDefined();
      expect(sitios.direccion).toBeDefined();
      expect(sitios.ciudad).toBeDefined();
      expect(sitios.provincia).toBeDefined();
      expect(sitios.lat).toBeDefined();
      expect(sitios.lng).toBeDefined();
      expect(sitios.radioMetros).toBeDefined();
      expect(sitios.contactoNombre).toBeDefined();
      expect(sitios.contactoTelefono).toBeDefined();
      expect(sitios.activo).toBeDefined();
      expect(sitios.createdAt).toBeDefined();
      expect(sitios.updatedAt).toBeDefined();
    });
  });

  describe("Drizzle Schema - viajes table", () => {
    it("should export viajes table with all expected columns", () => {
      expect(viajes).toBeDefined();
      expect(viajes.id).toBeDefined();
      expect(viajes.empresaId).toBeDefined();
      expect(viajes.codigo).toBeDefined();
      expect(viajes.choferId).toBeDefined();
      expect(viajes.vehiculoId).toBeDefined();
      expect(viajes.origenTipo).toBeDefined();
      expect(viajes.origenSitioId).toBeDefined();
      expect(viajes.origenNombre).toBeDefined();
      expect(viajes.origenDireccion).toBeDefined();
      expect(viajes.origenLat).toBeDefined();
      expect(viajes.origenLng).toBeDefined();
      expect(viajes.destinoTipo).toBeDefined();
      expect(viajes.destinoSitioId).toBeDefined();
      expect(viajes.destinoNombre).toBeDefined();
      expect(viajes.destinoDireccion).toBeDefined();
      expect(viajes.destinoLat).toBeDefined();
      expect(viajes.destinoLng).toBeDefined();
      expect(viajes.distanciaEstimadaKm).toBeDefined();
      expect(viajes.fechaSalidaProgramada).toBeDefined();
      expect(viajes.fechaLlegadaEstimada).toBeDefined();
      expect(viajes.fechaInicioReal).toBeDefined();
      expect(viajes.fechaFinReal).toBeDefined();
      expect(viajes.kmInicio).toBeDefined();
      expect(viajes.kmFin).toBeDefined();
      expect(viajes.estado).toBeDefined();
      expect(viajes.notas).toBeDefined();
      expect(viajes.creadoPor).toBeDefined();
      expect(viajes.createdAt).toBeDefined();
      expect(viajes.updatedAt).toBeDefined();
    });
  });

  describe("TypeScript Types and Interfaces", () => {
    it("should validate ChoferEstado union types", () => {
      const estados: ChoferEstado[] = ["ACTIVO", "INACTIVO", "LICENCIA_SUSPENDIDA"];
      expect(estados).toHaveLength(3);
    });

    it("should validate SitioTipo union types", () => {
      const tipos: SitioTipo[] = [
        "PLANTA",
        "DEPOSITO",
        "CLIENTE",
        "SUCURSAL",
        "PROVEEDOR",
        "TALLER",
        "OTRO",
      ];
      expect(tipos).toHaveLength(7);
    });

    it("should validate ViajeEstado union types", () => {
      const estados: ViajeEstado[] = [
        "PLANIFICADO",
        "EN_CURSO",
        "COMPLETADO",
        "CANCELADO",
      ];
      expect(estados).toHaveLength(4);
    });

    it("should validate UbicacionTipo union types", () => {
      const tipos: UbicacionTipo[] = ["SITIO", "GOOGLE_PLACES"];
      expect(tipos).toHaveLength(2);
    });

    it("should validate ChoferRow and CreateChoferInput structures", () => {
      const chofer: ChoferRow = {
        id: 1,
        empresaId: 10,
        userId: "user-uuid",
        nombre: "Carlos",
        apellido: "Pérez",
        dni: "30123456",
        telefono: "+5491100001111",
        email: "carlos.perez@empresa.com",
        licenciaNumero: "B1-30123456",
        licenciaCategoria: "C",
        licenciaVencimiento: new Date("2027-12-31"),
        estado: "ACTIVO",
        vehiculoHabitualId: 5,
        notas: "Chofer principal turno mañana",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createInput: CreateChoferInput = {
        empresaId: 10,
        nombre: "Carlos",
        apellido: "Pérez",
        dni: "30123456",
        telefono: "+5491100001111",
        email: "carlos.perez@empresa.com",
        licenciaNumero: "B1-30123456",
        licenciaCategoria: "C",
        licenciaVencimiento: new Date("2027-12-31"),
        estado: "ACTIVO",
        vehiculoHabitualId: 5,
      };

      expect(chofer.id).toBe(1);
      expect(chofer.estado).toBe("ACTIVO");
      expect(createInput.dni).toBe("30123456");
    });

    it("should validate SitioRow and CreateSitioInput structures", () => {
      const sitio: SitioRow = {
        id: 1,
        empresaId: 10,
        nombre: "Centro de Distribución Norte",
        tipo: "DEPOSITO",
        direccion: "Ruta 9 Km 45, Campana",
        ciudad: "Campana",
        provincia: "Buenos Aires",
        lat: -34.1632,
        lng: -58.9591,
        radioMetros: 150,
        contactoNombre: "Juan Logística",
        contactoTelefono: "+5491155554444",
        activo: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createInput: CreateSitioInput = {
        empresaId: 10,
        nombre: "Centro de Distribución Norte",
        tipo: "DEPOSITO",
        direccion: "Ruta 9 Km 45, Campana",
        lat: -34.1632,
        lng: -58.9591,
        radioMetros: 150,
      };

      expect(sitio.id).toBe(1);
      expect(sitio.tipo).toBe("DEPOSITO");
      expect(sitio.radioMetros).toBe(150);
      expect(createInput.nombre).toBe("Centro de Distribución Norte");
    });

    it("should validate ViajeRow and CreateViajeInput structures", () => {
      const viaje: ViajeRow = {
        id: 1,
        empresaId: 10,
        codigo: "VIA-2026-0001",
        choferId: 1,
        choferNombre: "Carlos Pérez",
        vehiculoId: 5,
        vehiculoPatente: "AE123CD",
        origenTipo: "SITIO",
        origenSitioId: 1,
        origenNombre: "Centro de Distribución Norte",
        origenDireccion: "Ruta 9 Km 45, Campana",
        origenLat: -34.1632,
        origenLng: -58.9591,
        destinoTipo: "GOOGLE_PLACES",
        destinoSitioId: null,
        destinoNombre: "Planta Zárate",
        destinoDireccion: "Av. Antártida Argentina 1200, Zárate",
        destinoLat: -34.0956,
        destinoLng: -59.0289,
        distanciaEstimadaKm: 25.4,
        fechaSalidaProgramada: new Date("2026-08-22T08:00:00Z"),
        fechaLlegadaEstimada: new Date("2026-08-22T09:30:00Z"),
        fechaInicioReal: null,
        fechaFinReal: null,
        kmInicio: null,
        kmFin: null,
        estado: "PLANIFICADO",
        notas: "Carga de repuestos",
        creadoPor: "admin-uuid",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createInput: CreateViajeInput = {
        empresaId: 10,
        codigo: "VIA-2026-0001",
        choferId: 1,
        vehiculoId: 5,
        origenTipo: "SITIO",
        origenSitioId: 1,
        origenNombre: "Centro de Distribución Norte",
        origenDireccion: "Ruta 9 Km 45, Campana",
        origenLat: -34.1632,
        origenLng: -58.9591,
        destinoTipo: "GOOGLE_PLACES",
        destinoNombre: "Planta Zárate",
        destinoDireccion: "Av. Antártida Argentina 1200, Zárate",
        destinoLat: -34.0956,
        destinoLng: -59.0289,
        distanciaEstimadaKm: 25.4,
        fechaSalidaProgramada: new Date("2026-08-22T08:00:00Z"),
      };

      expect(viaje.id).toBe(1);
      expect(viaje.codigo).toBe("VIA-2026-0001");
      expect(viaje.estado).toBe("PLANIFICADO");
      expect(createInput.distanciaEstimadaKm).toBe(25.4);
    });
  });
});
