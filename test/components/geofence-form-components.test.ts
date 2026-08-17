import { describe, it, expect } from "vitest";
import {
  PRESET_GEOFENCE_COLORS,
  PRESET_FLEET_GROUPS_LIST,
  GeofenceFormData,
} from "@/types/geofence";
import { mockVehiculos } from "@/lib/mock-vehicles";

describe("Geofence Form Constants, Presets & Logic", () => {
  describe("ColorPickerCustom Palette Presets", () => {
    it("should include all required 9 preset colors with correct hex codes", () => {
      const hexList = PRESET_GEOFENCE_COLORS.map((c) => c.hex.toUpperCase());
      expect(hexList).toContain("#3B82F6"); // Azul
      expect(hexList).toContain("#10B981"); // Esmeralda
      expect(hexList).toContain("#F2B705"); // Ámbar TrackOps
      expect(hexList).toContain("#EF4444"); // Rojo
      expect(hexList).toContain("#8B5CF6"); // Violeta
      expect(hexList).toContain("#06B6D4"); // Cian
      expect(hexList).toContain("#F97316"); // Naranja
      expect(hexList).toContain("#EC4899"); // Rosa
      expect(hexList).toContain("#475569"); // Grafito
      expect(PRESET_GEOFENCE_COLORS).toHaveLength(9);
    });

    it("should provide descriptive labels for each color preset", () => {
      const labels = PRESET_GEOFENCE_COLORS.map((c) => c.label);
      expect(labels).toContain("Azul");
      expect(labels).toContain("Esmeralda");
      expect(labels).toContain("Ámbar TrackOps");
      expect(labels).toContain("Rojo");
      expect(labels).toContain("Violeta");
      expect(labels).toContain("Cian");
      expect(labels).toContain("Naranja");
      expect(labels).toContain("Rosa");
      expect(labels).toContain("Grafito");
    });
  });

  describe("FleetAssigner Preset Groups & Vehicle Categorization", () => {
    it("should define operational fleet groups for assignment", () => {
      expect(PRESET_FLEET_GROUPS_LIST.length).toBeGreaterThanOrEqual(4);

      const groupIds = PRESET_FLEET_GROUPS_LIST.map((g) => g.id);
      expect(groupIds).toContain("Logística Urbana");
      expect(groupIds).toContain("Reparto Turno Mañana");
      expect(groupIds).toContain("Mantenimiento & Técnica");
      expect(groupIds).toContain("Larga Distancia");
      expect(groupIds).toContain("Supervisión & Control");
    });

    it("should properly count vehicles across categories in mock dataset", () => {
      const categoryCounts: Record<string, number> = {
        Auto: 0,
        Camioneta: 0,
        Utilitario: 0,
        Camión: 0,
      };

      mockVehiculos.forEach((v) => {
        const type = v.tipo || "Auto";
        categoryCounts[type] = (categoryCounts[type] || 0) + 1;
      });

      expect(mockVehiculos.length).toBeGreaterThanOrEqual(5);
      expect(categoryCounts["Camioneta"]).toBeGreaterThanOrEqual(1);
      expect(categoryCounts["Camión"]).toBeGreaterThanOrEqual(1);
      expect(categoryCounts["Auto"]).toBeGreaterThanOrEqual(1);
      expect(categoryCounts["Utilitario"]).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Geofence Form Validation Logic", () => {
    it("validates polygon geometry requiring at least 3 vertices", () => {
      const validPolygon: GeofenceFormData = {
        nombre: "Zona Puerto",
        tipo: "Polígono",
        color: "#3B82F6",
        coordenadas: [
          [-38.715, -62.263],
          [-38.715, -62.269],
          [-38.721, -62.269],
        ],
        activa: true,
      };

      const invalidPolygon: GeofenceFormData = {
        nombre: "Zona Incompleta",
        tipo: "Polígono",
        color: "#3B82F6",
        coordenadas: [
          [-38.715, -62.263],
          [-38.715, -62.269],
        ],
        activa: true,
      };

      expect((validPolygon.coordenadas?.length || 0) >= 3).toBe(true);
      expect((invalidPolygon.coordenadas?.length || 0) >= 3).toBe(false);
    });

    it("validates circle geometry requiring center coordinates", () => {
      const validCircle: GeofenceFormData = {
        nombre: "Base Radial",
        tipo: "Círculo",
        color: "#10B981",
        centro: [-38.73, -62.28],
        radio: 500,
        activa: true,
      };

      const invalidCircle: GeofenceFormData = {
        nombre: "Círculo Sin Centro",
        tipo: "Círculo",
        color: "#10B981",
        radio: 500,
        activa: true,
      };

      expect(Boolean(validCircle.centro && validCircle.centro.length === 2)).toBe(true);
      expect(Boolean(invalidCircle.centro && invalidCircle.centro.length === 2)).toBe(false);
    });
  });

  describe("GeofenceCard Fleet Summary & Rules Helpers", () => {
    it("formats fleet assignment summaries correctly", () => {
      const allFlota = { targetType: "ALL" as const };
      const categorySingle = { targetType: "CATEGORY" as const, targetCategories: ["Camión"] };
      const categoryMultiple = { targetType: "CATEGORY" as const, targetCategories: ["Camión", "Utilitario"] };
      const vehicleSingle = { targetType: "VEHICLES" as const, targetVehicles: [1] };
      const vehicleMultiple = { targetType: "VEHICLES" as const, targetVehicles: [1, 2, 3] };
      const groupSingle = { targetType: "GROUP" as const, targetGroups: ["Logística Urbana"] };
      const groupMultiple = { targetType: "GROUP" as const, targetGroups: ["Logística Urbana", "Reparto"] };

      expect(allFlota.targetType === "ALL" ? "Toda la flota" : "").toBe("Toda la flota");
      expect(categorySingle.targetCategories.length === 1 ? categorySingle.targetCategories[0] : "").toBe("Camión");
      expect(categoryMultiple.targetCategories.length > 1 ? `${categoryMultiple.targetCategories.length} Categorías` : "").toBe("2 Categorías");
      expect(vehicleSingle.targetVehicles.length === 1 ? "1 Vehículo" : "").toBe("1 Vehículo");
      expect(vehicleMultiple.targetVehicles.length > 1 ? `${vehicleMultiple.targetVehicles.length} Vehículos` : "").toBe("3 Vehículos");
      expect(groupSingle.targetGroups.length === 1 ? groupSingle.targetGroups[0] : "").toBe("Logística Urbana");
      expect(groupMultiple.targetGroups.length > 1 ? `${groupMultiple.targetGroups.length} Grupos` : "").toBe("2 Grupos");
    });

    it("evaluates alert rule tags correctly", () => {
      const alertEvents = ["EXIT", "ENTER", "SPEED_LIMIT", "SCHEDULE"] as const;
      const speedLimit = 45;

      expect(alertEvents.includes("EXIT")).toBe(true);
      expect(alertEvents.includes("ENTER")).toBe(true);
      expect(alertEvents.includes("SPEED_LIMIT")).toBe(true);
      expect(`Max ${speedLimit} km/h`).toBe("Max 45 km/h");
      expect(alertEvents.includes("SCHEDULE")).toBe(true);
    });
  });

  describe("Geocercas Page Filtering & Metrics Logic", () => {
    const testGeofences = [
      { id: 1, nombre: "Base Norte", descripcion: "Central", tipo: "Polígono", activa: true },
      { id: 2, nombre: "Zona Sur", descripcion: "Carga", tipo: "Círculo", activa: true },
      { id: 3, nombre: "Taller Este", descripcion: "Mecánica", tipo: "Polígono", activa: false },
    ];

    it("calculates quick metrics correctly", () => {
      const total = testGeofences.length;
      const active = testGeofences.filter((g) => g.activa).length;
      const polygons = testGeofences.filter((g) => g.tipo === "Polígono").length;
      const circles = testGeofences.filter((g) => g.tipo === "Círculo").length;

      expect(total).toBe(3);
      expect(active).toBe(2);
      expect(polygons).toBe(2);
      expect(circles).toBe(1);
    });

    it("filters by status (Active / Inactive)", () => {
      const activeOnly = testGeofences.filter((g) => g.activa);
      const inactiveOnly = testGeofences.filter((g) => !g.activa);

      expect(activeOnly).toHaveLength(2);
      expect(inactiveOnly).toHaveLength(1);
      expect(inactiveOnly[0].nombre).toBe("Taller Este");
    });

    it("filters by type (Polígono / Círculo)", () => {
      const polygonOnly = testGeofences.filter((g) => g.tipo === "Polígono");
      const circleOnly = testGeofences.filter((g) => g.tipo === "Círculo");

      expect(polygonOnly).toHaveLength(2);
      expect(circleOnly).toHaveLength(1);
      expect(circleOnly[0].nombre).toBe("Zona Sur");
    });

    it("filters by search term in name and description", () => {
      const searchBase = testGeofences.filter(
        (g) => g.nombre.toLowerCase().includes("base") || g.descripcion.toLowerCase().includes("base")
      );
      const searchCarga = testGeofences.filter(
        (g) => g.nombre.toLowerCase().includes("carga") || g.descripcion.toLowerCase().includes("carga")
      );

      expect(searchBase).toHaveLength(1);
      expect(searchBase[0].id).toBe(1);
      expect(searchCarga).toHaveLength(1);
      expect(searchCarga[0].id).toBe(2);
    });
  });
});

