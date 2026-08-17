import { describe, it, expect } from 'vitest';
import { geofences } from '../src/db/schema';
import type {
  Geofence,
  GeofenceFormData,
  GeofenceType,
  GeofenceTargetType,
  GeofenceAlertEvent,
  DrawingMode,
} from '../src/types/geofence';

describe('Geofence Schema and Types', () => {
  describe('Drizzle Schema (geofences table)', () => {
    it('should export the geofences table with expected columns', () => {
      expect(geofences).toBeDefined();
      expect(geofences.id).toBeDefined();
      expect(geofences.empresaId).toBeDefined();
      expect(geofences.nombre).toBeDefined();
      expect(geofences.descripcion).toBeDefined();
      expect(geofences.tipo).toBeDefined();
      expect(geofences.color).toBeDefined();
      expect(geofences.opacidad).toBeDefined();
      expect(geofences.coordenadas).toBeDefined();
      expect(geofences.centroLat).toBeDefined();
      expect(geofences.centroLng).toBeDefined();
      expect(geofences.radio).toBeDefined();
      expect(geofences.activa).toBeDefined();
      expect(geofences.targetType).toBeDefined();
      expect(geofences.targetVehicles).toBeDefined();
      expect(geofences.targetCategories).toBeDefined();
      expect(geofences.targetGroups).toBeDefined();
      expect(geofences.alertEvents).toBeDefined();
      expect(geofences.speedLimit).toBeDefined();
      expect(geofences.actionTypes).toBeDefined();
      expect(geofences.emailRecipients).toBeDefined();
      expect(geofences.createdAt).toBeDefined();
      expect(geofences.updatedAt).toBeDefined();
    });
  });

  describe('TypeScript Geofence Interface & Types', () => {
    it('should allow valid Polygon Geofence object structure', () => {
      const polygonGeofence: Geofence = {
        id: 1,
        empresaId: 10,
        nombre: 'Zona Centro y Puerto',
        descripcion: 'Geocerca para control de velocidad en puerto',
        tipo: 'Polígono',
        color: '#3B82F6',
        opacidad: 0.3,
        coordenadas: [
          [-34.6037, -58.3816],
          [-34.6040, -58.3820],
          [-34.6050, -58.3800],
        ],
        activa: true,
        targetType: 'CATEGORY',
        targetCategories: ['Camión', 'Camioneta'],
        alertEvents: ['SPEED_LIMIT', 'EXIT'],
        speedLimit: 40,
        actionTypes: ['UI', 'EMAIL'],
        emailRecipients: 'flota@empresa.com',
        createdAt: '2026-08-17T00:00:00.000Z',
        updatedAt: '2026-08-17T00:00:00.000Z',
      };

      expect(polygonGeofence.id).toBe(1);
      expect(polygonGeofence.tipo).toBe('Polígono');
      expect(polygonGeofence.coordenadas).toHaveLength(3);
      expect(polygonGeofence.targetType).toBe('CATEGORY');
      expect(polygonGeofence.alertEvents).toContain('SPEED_LIMIT');
    });

    it('should allow valid Circle Geofence object structure', () => {
      const circleGeofence: Geofence = {
        id: 2,
        empresaId: 10,
        nombre: 'Depósito Central',
        tipo: 'Círculo',
        color: '#10B981',
        opacidad: 0.25,
        centro: [-34.6100, -58.3900],
        radio: 500,
        activa: true,
        targetType: 'ALL',
        alertEvents: ['ENTER', 'EXIT'],
      };

      expect(circleGeofence.id).toBe(2);
      expect(circleGeofence.tipo).toBe('Círculo');
      expect(circleGeofence.centro).toEqual([-34.6100, -58.3900]);
      expect(circleGeofence.radio).toBe(500);
      expect(circleGeofence.targetType).toBe('ALL');
    });

    it('should validate GeofenceFormData without mandatory id', () => {
      const draftForm: GeofenceFormData = {
        nombre: 'Nueva Geocerca Borrador',
        tipo: 'Polígono',
        color: '#F2B705',
        opacidad: 0.2,
        coordenadas: [
          [-34.60, -58.38],
          [-34.61, -58.38],
          [-34.61, -58.39],
        ],
        activa: true,
        targetType: 'VEHICLES',
        targetVehicles: [1, 2, 3],
        alertEvents: ['EXIT'],
      };

      expect(draftForm.id).toBeUndefined();
      expect(draftForm.nombre).toBe('Nueva Geocerca Borrador');
      expect(draftForm.targetVehicles).toEqual([1, 2, 3]);
    });

    it('should type-check drawing modes and alert event types', () => {
      const modes: DrawingMode[] = ['none', 'draw_polygon', 'draw_circle', 'edit_vertices'];
      const targetTypes: GeofenceTargetType[] = ['ALL', 'CATEGORY', 'VEHICLES', 'GROUP'];
      const alertEvents: GeofenceAlertEvent[] = ['EXIT', 'ENTER', 'SPEED_LIMIT', 'SCHEDULE'];
      const types: GeofenceType[] = ['Polígono', 'Círculo'];

      expect(modes).toHaveLength(4);
      expect(targetTypes).toHaveLength(4);
      expect(alertEvents).toHaveLength(4);
      expect(types).toHaveLength(2);
    });
  });
});
