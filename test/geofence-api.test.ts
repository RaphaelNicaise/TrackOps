import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  mockGeofences,
  resetMockGeofences,
  getMockGeofences,
  getMockGeofence,
  createMockGeofence,
  updateMockGeofence,
  deleteMockGeofence,
  toggleMockGeofence,
  dbRowToGeofence,
  geofenceToDbValues,
} from "@/lib/mock-geofences";
import { GET as getGeofences, POST as postGeofence } from "@/app/api/geofences/route";
import { PUT as putGeofence, DELETE as deleteGeofence } from "@/app/api/geofences/[id]/route";
import { PATCH as toggleGeofenceRoute } from "@/app/api/geofences/[id]/toggle/route";
import type { GeofenceFormData } from "@/types/geofence";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

describe("Geofence Mock Helpers & DB Serialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockGeofences();
  });

  describe("Mock Data & CRUD Helpers", () => {
    it("should return initial mock geofences", () => {
      const list = getMockGeofences();
      expect(list.length).toBeGreaterThanOrEqual(4);
      expect(list.some((g) => g.tipo === "Polígono")).toBe(true);
      expect(list.some((g) => g.tipo === "Círculo")).toBe(true);
      expect(list.find((g) => g.nombre === "Base Operativa Central")).toBeDefined();
      expect(list.find((g) => g.nombre === "Zona de Carga Sur")).toBeDefined();
    });

    it("should retrieve a single geofence by ID", () => {
      const g = getMockGeofence(1);
      expect(g).toBeDefined();
      expect(g?.nombre).toBe("Base Operativa Central");

      const notFound = getMockGeofence(9999);
      expect(notFound).toBeUndefined();
    });

    it("should create a new geofence with auto-incremented ID", () => {
      const newGeofenceData: GeofenceFormData = {
        nombre: "Nueva Zona de Prueba",
        tipo: "Polígono",
        color: "#EF4444",
        opacidad: 0.3,
        coordenadas: [
          [-38.71, -62.25],
          [-38.72, -62.25],
          [-38.72, -62.26],
        ],
        activa: true,
        targetType: "VEHICLES",
        targetVehicles: [1, 2],
        alertEvents: ["EXIT"],
      };

      const created = createMockGeofence(newGeofenceData);
      expect(created.id).toBeDefined();
      expect(created.nombre).toBe("Nueva Zona de Prueba");
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();

      const found = getMockGeofence(created.id);
      expect(found).toBeDefined();
      expect(found?.nombre).toBe("Nueva Zona de Prueba");
    });

    it("should update an existing geofence", () => {
      const updated = updateMockGeofence(1, {
        nombre: "Base Operativa Central - Modificada",
        speedLimit: 50,
      });

      expect(updated).not.toBeNull();
      expect(updated?.nombre).toBe("Base Operativa Central - Modificada");
      expect(updated?.speedLimit).toBe(50);

      const notFound = updateMockGeofence(9999, { nombre: "Nada" });
      expect(notFound).toBeNull();
    });

    it("should toggle the active state of a geofence", () => {
      const initial = getMockGeofence(1);
      const initialActive = initial?.activa;

      const toggled = toggleMockGeofence(1);
      expect(toggled).not.toBeNull();
      expect(toggled?.activa).toBe(!initialActive);

      const toggledAgain = toggleMockGeofence(1);
      expect(toggledAgain?.activa).toBe(initialActive);

      const notFound = toggleMockGeofence(9999);
      expect(notFound).toBeNull();
    });

    it("should delete an existing geofence", () => {
      const result = deleteMockGeofence(1);
      expect(result).toBe(true);

      const check = getMockGeofence(1);
      expect(check).toBeUndefined();

      const deleteAgain = deleteMockGeofence(1);
      expect(deleteAgain).toBe(false);
    });
  });

  describe("DB Row Serialization & Deserialization", () => {
    it("should correctly deserialize polygon DB row to Geofence object", () => {
      const dbRow = {
        id: 10,
        empresaId: 2,
        nombre: "Polígono DB",
        descripcion: "Descripción DB",
        tipo: "Polígono",
        color: "#3B82F6",
        opacidad: 0.25,
        coordenadas: JSON.stringify([[-38.7, -62.2], [-38.71, -62.21]]),
        centroLat: null,
        centroLng: null,
        radio: null,
        activa: 1,
        targetType: "VEHICLES",
        targetVehicles: JSON.stringify([1, 5]),
        targetCategories: JSON.stringify(["Camión"]),
        targetGroups: JSON.stringify(["Grupo A"]),
        alertEvents: JSON.stringify(["EXIT", "ENTER"]),
        speedLimit: 30,
        actionTypes: JSON.stringify(["UI", "EMAIL"]),
        emailRecipients: "test@example.com",
        createdAt: new Date("2026-08-17T00:00:00.000Z"),
        updatedAt: new Date("2026-08-17T00:00:00.000Z"),
      };

      const geofence = dbRowToGeofence(dbRow);
      expect(geofence.id).toBe(10);
      expect(geofence.nombre).toBe("Polígono DB");
      expect(geofence.activa).toBe(true);
      expect(geofence.coordenadas).toEqual([[-38.7, -62.2], [-38.71, -62.21]]);
      expect(geofence.targetVehicles).toEqual([1, 5]);
      expect(geofence.targetCategories).toEqual(["Camión"]);
      expect(geofence.targetGroups).toEqual(["Grupo A"]);
      expect(geofence.alertEvents).toEqual(["EXIT", "ENTER"]);
      expect(geofence.actionTypes).toEqual(["UI", "EMAIL"]);
      expect(geofence.emailRecipients).toBe("test@example.com");
      expect(geofence.createdAt).toBe("2026-08-17T00:00:00.000Z");
    });

    it("should correctly deserialize circle DB row with lat/lng center", () => {
      const dbRow = {
        id: 20,
        empresaId: 2,
        nombre: "Círculo DB",
        tipo: "Círculo",
        color: "#10B981",
        opacidad: "0.4",
        coordenadas: null,
        centroLat: -38.73,
        centroLng: -62.28,
        radio: 500,
        activa: 0,
        targetType: "ALL",
        alertEvents: null,
      };

      const geofence = dbRowToGeofence(dbRow);
      expect(geofence.id).toBe(20);
      expect(geofence.tipo).toBe("Círculo");
      expect(geofence.centro).toEqual([-38.73, -62.28]);
      expect(geofence.radio).toBe(500);
      expect(geofence.activa).toBe(false);
      expect(geofence.opacidad).toBe(0.4);
      expect(geofence.alertEvents).toEqual(["EXIT"]);
    });

    it("should serialize Geofence FormData into DB values", () => {
      const formData: GeofenceFormData = {
        nombre: "Zona Test Serialize",
        descripcion: "Prueba",
        tipo: "Polígono",
        color: "#EF4444",
        opacidad: 0.35,
        coordenadas: [[-38.7, -62.2], [-38.71, -62.21]],
        activa: true,
        targetType: "CATEGORY",
        targetCategories: ["Auto"],
        alertEvents: ["SPEED_LIMIT"],
        speedLimit: 60,
        actionTypes: ["UI"],
        emailRecipients: "admin@flota.com",
      };

      const dbValues = geofenceToDbValues(formData);
      expect(dbValues.nombre).toBe("Zona Test Serialize");
      expect(dbValues.activa).toBe(1);
      expect(dbValues.coordenadas).toBe(JSON.stringify(formData.coordenadas));
      expect(dbValues.targetCategories).toBe(JSON.stringify(["Auto"]));
      expect(dbValues.alertEvents).toBe(JSON.stringify(["SPEED_LIMIT"]));
      expect(dbValues.speedLimit).toBe(60);
      expect(dbValues.updatedAt).toBeInstanceOf(Date);
    });

    it("should serialize circle center coordinates into centroLat and centroLng", () => {
      const circleData: GeofenceFormData = {
        nombre: "Círculo Serialize",
        tipo: "Círculo",
        color: "#10B981",
        opacidad: 0.25,
        centro: [-38.75, -62.30],
        radio: 1000,
        activa: false,
        targetType: "ALL",
        alertEvents: ["ENTER"],
      };

      const dbValues = geofenceToDbValues(circleData);
      expect(dbValues.centroLat).toBe(-38.75);
      expect(dbValues.centroLng).toBe(-62.30);
      expect(dbValues.radio).toBe(1000);
      expect(dbValues.activa).toBe(0);
    });
  });

  describe("Geofences API Endpoints", () => {
    it("GET /api/geofences should return a list of geofences", async () => {
      const res = await getGeofences();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(4);
    });

    it("POST /api/geofences should create a geofence and return 201", async () => {
      const body = {
        nombre: "Nueva Geocerca API",
        tipo: "Polígono",
        color: "#3B82F6",
        opacidad: 0.25,
        coordenadas: [[-38.7, -62.2], [-38.71, -62.2]],
        activa: true,
        targetType: "ALL",
        alertEvents: ["EXIT"],
      };

      const req = new Request("http://localhost/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const res = await postGeofence(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.nombre).toBe("Nueva Geocerca API");
    });

    it("POST /api/geofences should return 400 when name is missing", async () => {
      const req = new Request("http://localhost/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "Polígono" }),
      });

      const res = await postGeofence(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("PUT /api/geofences/[id] should update a geofence", async () => {
      const req = new Request("http://localhost/api/geofences/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "Nombre Actualizado API", speedLimit: 45 }),
      });

      const res = await putGeofence(req, { params: { id: "1" } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.nombre).toBe("Nombre Actualizado API");
      expect(data.speedLimit).toBe(45);
    });

    it("PUT /api/geofences/[id] should return 404 for non-existent id", async () => {
      const req = new Request("http://localhost/api/geofences/9999", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "No Existe" }),
      });

      const res = await putGeofence(req, { params: { id: "9999" } });
      expect(res.status).toBe(404);
    });

    it("PUT /api/geofences/[id] should return 400 for invalid id", async () => {
      const req = new Request("http://localhost/api/geofences/invalid", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "Invalido" }),
      });

      const res = await putGeofence(req, { params: { id: "invalid" } });
      expect(res.status).toBe(400);
    });

    it("PATCH /api/geofences/[id]/toggle should toggle active status", async () => {
      const initial = getMockGeofence(1);
      const initialActiva = initial?.activa;

      const req = new Request("http://localhost/api/geofences/1/toggle", {
        method: "PATCH",
      });

      const res = await toggleGeofenceRoute(req, { params: { id: "1" } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.activa).toBe(!initialActiva);
    });

    it("PATCH /api/geofences/[id]/toggle should return 404 for non-existent id", async () => {
      const req = new Request("http://localhost/api/geofences/9999/toggle", {
        method: "PATCH",
      });

      const res = await toggleGeofenceRoute(req, { params: { id: "9999" } });
      expect(res.status).toBe(404);
    });

    it("DELETE /api/geofences/[id] should delete geofence and return { success: true }", async () => {
      const req = new Request("http://localhost/api/geofences/1", {
        method: "DELETE",
      });

      const res = await deleteGeofence(req, { params: { id: "1" } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const check = getMockGeofence(1);
      expect(check).toBeUndefined();
    });

    it("DELETE /api/geofences/[id] should return 404 for non-existent id", async () => {
      const req = new Request("http://localhost/api/geofences/9999", {
        method: "DELETE",
      });

      const res = await deleteGeofence(req, { params: { id: "9999" } });
      expect(res.status).toBe(404);
    });
  });
});
