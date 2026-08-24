import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FleetAssigner } from "@/components/geofences/FleetAssigner";
import { parseGoogleMapsUrl, isGoogleMapsUrl } from "@/lib/maps-parser";
import { geofenceSchema } from "@/lib/schemas/geofence.schema";
import { dbRowToGeofence, geofenceToDbValues } from "@/lib/mock-geofences";

describe("Sitios, Google Places, and Geocercas Fixes Integration", () => {
  describe("1. Google Maps URL and Link Resolution", () => {
    it("identifies Google Maps links from browser and mobile share", () => {
      expect(isGoogleMapsUrl("https://maps.app.goo.gl/abcdef123")).toBe(true);
      expect(isGoogleMapsUrl("https://www.google.com/maps/place/Planta/@-34.60,-58.38,15z")).toBe(true);
      expect(isGoogleMapsUrl("https://maps.google.com/?q=-34.6037,-58.3816")).toBe(true);
      expect(isGoogleMapsUrl("Avenida Corrientes 1234")).toBe(false);
    });

    it("parses coordinates and place names from standard Google Maps links", () => {
      const url = "https://www.google.com/maps/place/Parque+Industrial+Pilar/@-34.451234,-58.915678,16z/data=!3m1!4b1";
      const parsed = parseGoogleMapsUrl(url);

      expect(parsed).not.toBeNull();
      expect(parsed?.lat).toBe(-34.451234);
      expect(parsed?.lng).toBe(-58.915678);
      expect(parsed?.placeName).toBe("Parque Industrial Pilar");
    });
  });

  describe("2. FleetAssigner Vehicle Groups Gating", () => {
    it("disables Grupos option when no vehicle groups exist in the company", () => {
      const html = renderToStaticMarkup(
        <FleetAssigner
          targetType="ALL"
          availableVehicles={[]}
          availableGroups={[]}
          onChange={() => {}}
        />
      );

      // The Grupos button should have disabled attribute or disabled class
      expect(html).toContain("disabled=\"\"");
      expect(html).toContain("Grupos");
      expect(html).toContain("No hay grupos de vehículos creados en la empresa");
    });

    it("enables Grupos option and renders real company groups when available", () => {
      const companyGroups = [
        {
          id: 101,
          empresaId: 1,
          nombre: "Flota Distribución AMBA",
          descripcion: "Camiones de reparto conurbano",
          color: "#3B82F6",
          icono: "truck",
          vehicleIds: [1, 2],
        },
        {
          id: 102,
          empresaId: 1,
          nombre: "Supervisión Operativa",
          descripcion: "Móviles de inspectores",
          color: "#10B981",
          icono: "shield",
          vehicleIds: [3],
        },
      ];

      const html = renderToStaticMarkup(
        <FleetAssigner
          targetType="GROUP"
          availableVehicles={[]}
          availableGroups={companyGroups}
          targetGroups={["Flota Distribución AMBA"]}
          onChange={() => {}}
        />
      );

      expect(html).toContain("Flota Distribución AMBA");
      expect(html).toContain("Supervisión Operativa");
      expect(html).toContain("Camiones de reparto conurbano");
    });
  });

  describe("3. Geofence Schema & Deserialization Safety", () => {
    it("validates Circle geofences with centro [lat, lng] array", () => {
      const circleInput = {
        nombre: "Geocerca Circular Test",
        tipo: "Círculo",
        centro: [-38.7183, -62.2663],
        radio: 750,
        color: "#F2B705",
        activa: 1,
      };

      const parsed = geofenceSchema.parse(circleInput);
      expect(parsed.nombre).toBe("Geocerca Circular Test");
      expect(parsed.centro).toEqual([-38.7183, -62.2663]);
      expect(parsed.radio).toBe(750);
    });

    it("prevents double stringification and safely recovers arrays from DB row", () => {
      const dbValues = geofenceToDbValues({
        nombre: "Geocerca Polígono Test",
        tipo: "Polígono",
        coordenadas: [
          [-38.71, -62.26],
          [-38.71, -62.27],
          [-38.72, -62.27],
        ],
        alertEvents: ["EXIT"],
        targetCategories: ["Camión", "Utilitario"],
      });

      const row = {
        id: 42,
        empresaId: 1,
        ...dbValues,
        createdAt: "2026-08-24T12:00:00Z",
        updatedAt: "2026-08-24T12:00:00Z",
      };

      const result = dbRowToGeofence(row);
      expect(result.id).toBe(42);
      expect(result.tipo).toBe("Polígono");
      expect(Array.isArray(result.coordenadas)).toBe(true);
      expect(result.coordenadas).toHaveLength(3);
      expect(Array.isArray(result.alertEvents)).toBe(true);
      expect(result.alertEvents).toEqual(["EXIT"]);
      expect(Array.isArray(result.targetCategories)).toBe(true);
      expect(result.targetCategories).toEqual(["Camión", "Utilitario"]);
    });
  });
});
