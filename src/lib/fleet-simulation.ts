/**
 * Fleet Movement & Realtime Telemetry Simulation Engine for Bahía Blanca.
 * Simulates vehicles navigating streets, entering/exiting geofences, and triggering speed alerts.
 */

import { MockVehiculo, mockVehiculos } from "./mock-vehicles";
import { INITIAL_MOCK_GEOFENCES } from "./mock-geofences";
import type { Geofence } from "@/types/geofence";

export interface SimulatedAlert {
  id: string;
  timestamp: Date;
  vehicleId: number;
  patente: string;
  tipo: "SPEED_LIMIT" | "EXIT" | "ENTER";
  titulo: string;
  mensaje: string;
  severidad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  geofenceNombre?: string;
  velocidadActual?: number;
  limiteVelocidad?: number;
  lat: number;
  lng: number;
}

export interface SimulationConfig {
  isRunning: boolean;
  intervalMs: number; // e.g. 2500ms
  speedMultiplier: number; // 1x, 2x
}

// -------------------------------------------------------------
// Geometric helpers for Geofences
// -------------------------------------------------------------

export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInCircle(point: [number, number], center: [number, number], radiusMeters: number): boolean {
  return getDistanceMeters(point[0], point[1], center[0], center[1]) <= radiusMeters;
}

export function isVehicleInsideGeofence(lat: number, lng: number, geofence: Geofence): boolean {
  if (geofence.tipo === "Polígono" && Array.isArray(geofence.coordenadas) && geofence.coordenadas.length >= 3) {
    const poly = geofence.coordenadas.map((c) => (Array.isArray(c) ? [Number(c[0]), Number(c[1])] : [0, 0])) as [number, number][];
    return isPointInPolygon([lat, lng], poly);
  }
  if (geofence.tipo === "Círculo" && geofence.centro && geofence.radio) {
    const center: [number, number] = Array.isArray(geofence.centro)
      ? [Number(geofence.centro[0]), Number(geofence.centro[1])]
      : [Number((geofence.centro as any).lat), Number((geofence.centro as any).lng)];
    return isPointInCircle([lat, lng], center, Number(geofence.radio));
  }
  return false;
}

// -------------------------------------------------------------
// High-Density Street-Level Trajectories in Bahía Blanca
// -------------------------------------------------------------

export interface RouteWaypoint {
  lat: number;
  lng: number;
  speedKmH: number;
  status: "En movimiento" | "Ralentí" | "Detenido";
}

/**
 * Breaks street corner segments into short, smooth ~15-20 meter steps.
 * This guarantees the vehicle travels continuously along the street without sudden leaps.
 */
export function generateDensePath(
  corners: { lat: number; lng: number; speedKmH: number; status?: "En movimiento" | "Ralentí" | "Detenido" }[],
  stepMeters = 18
): RouteWaypoint[] {
  const result: RouteWaypoint[] = [];
  if (!corners || corners.length < 2) return [];

  for (let i = 0; i < corners.length; i++) {
    const curr = corners[i];
    const next = corners[(i + 1) % corners.length];

    const dist = getDistanceMeters(curr.lat, curr.lng, next.lat, next.lng);
    const steps = Math.max(1, Math.round(dist / stepMeters));

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const lat = curr.lat + (next.lat - curr.lat) * t;
      const lng = curr.lng + (next.lng - curr.lng) * t;
      const speedKmH = Math.round(curr.speedKmH + (next.speedKmH - curr.speedKmH) * t);

      result.push({
        lat,
        lng,
        speedKmH,
        status: curr.status ?? (speedKmH === 0 ? "Detenido" : speedKmH <= 15 ? "Ralentí" : "En movimiento"),
      });
    }
  }

  return result;
}

// -------------------------------------------------------------
// Real Street Intersections & Circuits in Bahía Blanca
// -------------------------------------------------------------

// Vehículo 1: Ford Ranger (AB 123 CD) - Base Central -> Av. Colón -> Zona Carga Sur -> Don Bosco -> Base
const ROUTE_CORNERS_1 = [
  { lat: -38.7180, lng: -62.2660, speedKmH: 22, status: "En movimiento" as const }, // Base Operativa (límite 30)
  { lat: -38.7170, lng: -62.2650, speedKmH: 34, status: "En movimiento" as const }, // Av. Colón & Brown (exceso en base!)
  { lat: -38.7150, lng: -62.2635, speedKmH: 42, status: "En movimiento" as const }, // Av. Colón & Vieytes
  { lat: -38.7135, lng: -62.2615, speedKmH: 48, status: "En movimiento" as const }, // Av. Colón & Berutti
  { lat: -38.7115, lng: -62.2590, speedKmH: 52, status: "En movimiento" as const }, // Av. Colón & Castelli
  { lat: -38.7090, lng: -62.2560, speedKmH: 55, status: "En movimiento" as const }, // Av. Colón & Sixto Laspiur
  { lat: -38.7130, lng: -62.2520, speedKmH: 45, status: "En movimiento" as const }, // Giro por Dr. Sixto Laspiur
  { lat: -38.7190, lng: -62.2580, speedKmH: 40, status: "En movimiento" as const }, // Hacia el Sur por Donado
  { lat: -38.7240, lng: -62.2650, speedKmH: 50, status: "En movimiento" as const }, // Av. La Plata
  { lat: -38.7280, lng: -62.2740, speedKmH: 58, status: "En movimiento" as const }, // Av. Dasso acceso Carga Sur
  { lat: -38.7300, lng: -62.2800, speedKmH: 52, status: "En movimiento" as const }, // Ingreso Zona Carga Sur (límite 40 -> Exceso!)
  { lat: -38.7320, lng: -62.2830, speedKmH: 25, status: "En movimiento" as const }, // Maniobra interna Carga Sur
  { lat: -38.7320, lng: -62.2830, speedKmH: 0, status: "Ralentí" as const },        // Espera en dársena
  { lat: -38.7290, lng: -62.2780, speedKmH: 35, status: "En movimiento" as const }, // Salida Zona Carga Sur
  { lat: -38.7240, lng: -62.2720, speedKmH: 45, status: "En movimiento" as const }, // Retorno por Don Bosco
  { lat: -38.7200, lng: -62.2680, speedKmH: 30, status: "En movimiento" as const }, // Don Bosco & Rondeau
];

// Vehículo 2: VW Gol (EF 456 GH) - Centro -> Av. Alem -> Parque de Mayo -> Depósito Norte
const ROUTE_CORNERS_2 = [
  { lat: -38.7196, lng: -62.2654, speedKmH: 0, status: "Detenido" as const },       // Plaza Rivadavia (semáforo)
  { lat: -38.7180, lng: -62.2660, speedKmH: 25, status: "En movimiento" as const }, // San Martín
  { lat: -38.7160, lng: -62.2680, speedKmH: 35, status: "En movimiento" as const }, // Av. Alem & Rodríguez
  { lat: -38.7140, lng: -62.2700, speedKmH: 40, status: "En movimiento" as const }, // Av. Alem & 11 de Abril
  { lat: -38.7115, lng: -62.2725, speedKmH: 45, status: "En movimiento" as const }, // Av. Alem & Perú
  { lat: -38.7085, lng: -62.2755, speedKmH: 50, status: "En movimiento" as const }, // Av. Alem & Cuyo
  { lat: -38.7050, lng: -62.2770, speedKmH: 35, status: "En movimiento" as const }, // Parque de Mayo (Rotonda)
  { lat: -38.7030, lng: -62.2700, speedKmH: 45, status: "En movimiento" as const }, // Av. Urquiza
  { lat: -38.7040, lng: -62.2580, speedKmH: 38, status: "En movimiento" as const }, // Ingreso Depósito Norte (límite 25 -> Exceso!)
  { lat: -38.7050, lng: -62.2540, speedKmH: 20, status: "En movimiento" as const }, // Interior Depósito Norte
  { lat: -38.7060, lng: -62.2510, speedKmH: 35, status: "En movimiento" as const }, // Salida Depósito Norte
  { lat: -38.7120, lng: -62.2570, speedKmH: 40, status: "En movimiento" as const }, // Retorno por Sarmiento
  { lat: -38.7170, lng: -62.2620, speedKmH: 30, status: "En movimiento" as const }, // Sarmiento & Estomba
];

// Vehículo 3: Iveco Stralis (IJ 789 KL) - Camino Sesquicentenario -> Acceso Puerto
const ROUTE_CORNERS_3 = [
  { lat: -38.7250, lng: -62.2400, speedKmH: 60, status: "En movimiento" as const }, // Camino Sesquicentenario
  { lat: -38.7290, lng: -62.2460, speedKmH: 70, status: "En movimiento" as const }, // Sesquicentenario tramo medio
  { lat: -38.7340, lng: -62.2540, speedKmH: 75, status: "En movimiento" as const }, // Recta rápida
  { lat: -38.7390, lng: -62.2650, speedKmH: 65, status: "En movimiento" as const }, // Rotonda Grünbein / White
  { lat: -38.7430, lng: -62.2760, speedKmH: 50, status: "En movimiento" as const }, // Acceso Galván
  { lat: -38.7460, lng: -62.2860, speedKmH: 30, status: "En movimiento" as const }, // Puerto Galván
  { lat: -38.7460, lng: -62.2860, speedKmH: 0, status: "Ralentí" as const },        // Espera en balanza
  { lat: -38.7420, lng: -62.2780, speedKmH: 45, status: "En movimiento" as const }, // Retorno por Dasso
  { lat: -38.7350, lng: -62.2600, speedKmH: 60, status: "En movimiento" as const }, // Vuelta a anillo
  { lat: -38.7280, lng: -62.2450, speedKmH: 65, status: "En movimiento" as const },
];

// Vehículo 4: Toyota Hilux (MN 012 OP) - Anillo Céntrico & Base Central
const ROUTE_CORNERS_4 = [
  { lat: -38.7150, lng: -62.2550, speedKmH: 35, status: "En movimiento" as const }, // Sarmiento
  { lat: -38.7130, lng: -62.2600, speedKmH: 40, status: "En movimiento" as const }, // Zapiola
  { lat: -38.7150, lng: -62.2640, speedKmH: 35, status: "En movimiento" as const }, // Estomba
  { lat: -38.7180, lng: -62.2660, speedKmH: 20, status: "En movimiento" as const }, // Ingreso Base Central
  { lat: -38.7190, lng: -62.2670, speedKmH: 0, status: "Detenido" as const },       // Parada en Base
  { lat: -38.7200, lng: -62.2680, speedKmH: 25, status: "En movimiento" as const }, // Salida Base Central
  { lat: -38.7220, lng: -62.2620, speedKmH: 42, status: "En movimiento" as const }, // Chiclana
  { lat: -38.7180, lng: -62.2570, speedKmH: 38, status: "En movimiento" as const }, // Av. Cerri
];

export const BAHIA_BLANCA_ROUTES: Record<number, RouteWaypoint[]> = {
  1: generateDensePath(ROUTE_CORNERS_1, 16),
  2: generateDensePath(ROUTE_CORNERS_2, 16),
  3: generateDensePath(ROUTE_CORNERS_3, 22),
  4: generateDensePath(ROUTE_CORNERS_4, 15),
};

// -------------------------------------------------------------
// Live Simulator State Machine
// -------------------------------------------------------------

class FleetSimulationEngine {
  private routeIndices: Map<number, number> = new Map();
  private insideGeofences: Map<number, Set<number>> = new Map();
  private timer: any = null;
  private isRunning: boolean = false;
  private intervalMs: number = 1200; // Smooth 1.2s ping interval
  private currentVehicles: MockVehiculo[] = [];
  private activeGeofences: Geofence[] = [];

  constructor() {
    this.currentVehicles = [...mockVehiculos];
    this.activeGeofences = [...INITIAL_MOCK_GEOFENCES];
    this.initInitialGeofenceState();
  }

  private initInitialGeofenceState() {
    this.currentVehicles.forEach((v) => {
      const set = new Set<number>();
      this.activeGeofences.forEach((g) => {
        if (g.activa && isVehicleInsideGeofence(v.lat, v.lng, g)) {
          set.add(g.id);
        }
      });
      this.insideGeofences.set(v.id, set);
      this.routeIndices.set(v.id, 0);
    });
  }

  public setGeofences(geofences: Geofence[]) {
    this.activeGeofences = geofences.filter((g) => g.activa);
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIntervalMs(): number {
    return this.intervalMs;
  }

  public setIntervalMs(ms: number) {
    this.intervalMs = ms;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (typeof window !== "undefined") {
      localStorage.setItem("trackops_sim_active", "true");
    }

    this.timer = setInterval(() => {
      this.step();
    }, this.intervalMs);

    this.emitStateChange();
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("trackops_sim_active", "false");
    }
    this.emitStateChange();
  }

  public toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  public reset() {
    this.currentVehicles = [...mockVehiculos];
    this.initInitialGeofenceState();
    this.emitVehiclesUpdated();
  }

  public step() {
    const alertsGenerated: SimulatedAlert[] = [];

    // Advance each vehicle
    this.currentVehicles = this.currentVehicles.map((veh) => {
      const waypoints = BAHIA_BLANCA_ROUTES[veh.id];
      if (!waypoints || waypoints.length === 0) return veh;

      let nextIndex = (this.routeIndices.get(veh.id) ?? 0) + 1;
      if (nextIndex >= waypoints.length) {
        nextIndex = 0;
      }
      this.routeIndices.set(veh.id, nextIndex);

      const target = waypoints[nextIndex];
      const previousInsideSet = this.insideGeofences.get(veh.id) || new Set<number>();
      const currentInsideSet = new Set<number>();

      // Check all active geofences
      this.activeGeofences.forEach((geo) => {
        if (!geo.activa) return;

        const isInside = isVehicleInsideGeofence(target.lat, target.lng, geo);

        if (isInside) {
          currentInsideSet.add(geo.id);

          // 1. Check Entry Event
          if (!previousInsideSet.has(geo.id)) {
            alertsGenerated.push({
              id: `alert-enter-${veh.id}-${geo.id}-${Date.now()}`,
              timestamp: new Date(),
              vehicleId: veh.id,
              patente: veh.patente,
              tipo: "ENTER",
              titulo: `Ingreso a Geocerca: ${geo.nombre}`,
              mensaje: `El vehículo ${veh.patente} (${veh.modelo}) ingresó a la zona "${geo.nombre}" a ${target.speedKmH} km/h.`,
              severidad: "BAJA",
              geofenceNombre: geo.nombre,
              velocidadActual: target.speedKmH,
              lat: target.lat,
              lng: target.lng,
            });
          }

          // 2. Check Speed Limit Violation Event
          if (geo.speedLimit && target.speedKmH > geo.speedLimit) {
            alertsGenerated.push({
              id: `alert-speed-${veh.id}-${geo.id}-${Date.now()}`,
              timestamp: new Date(),
              vehicleId: veh.id,
              patente: veh.patente,
              tipo: "SPEED_LIMIT",
              titulo: `Exceso de Velocidad en ${geo.nombre}`,
              mensaje: `El móvil ${veh.patente} circula a ${target.speedKmH} km/h (Máxima permitida: ${geo.speedLimit} km/h en "${geo.nombre}").`,
              severidad: target.speedKmH >= geo.speedLimit + 20 ? "CRITICA" : "ALTA",
              geofenceNombre: geo.nombre,
              velocidadActual: target.speedKmH,
              limiteVelocidad: geo.speedLimit,
              lat: target.lat,
              lng: target.lng,
            });
          }
        } else {
          // 3. Check Exit Event
          if (previousInsideSet.has(geo.id)) {
            alertsGenerated.push({
              id: `alert-exit-${veh.id}-${geo.id}-${Date.now()}`,
              timestamp: new Date(),
              vehicleId: veh.id,
              patente: veh.patente,
              tipo: "EXIT",
              titulo: `Salida de Geocerca: ${geo.nombre}`,
              mensaje: `El vehículo ${veh.patente} (${veh.modelo}) salió de la zona delimitada "${geo.nombre}".`,
              severidad: "MEDIA",
              geofenceNombre: geo.nombre,
              velocidadActual: target.speedKmH,
              lat: target.lat,
              lng: target.lng,
            });
          }
        }
      });

      this.insideGeofences.set(veh.id, currentInsideSet);

      const hasActiveAlert = alertsGenerated.some((a) => a.vehicleId === veh.id && a.severidad !== "BAJA");

      return {
        ...veh,
        lat: target.lat,
        lng: target.lng,
        velocidad: `${target.speedKmH} km/h`,
        estado: target.status,
        ultimaActualizacion: "Hace instantes",
        hasAlert: hasActiveAlert || veh.hasAlert,
        alertasCount: (veh.alertasCount || 0) + (hasActiveAlert ? 1 : 0),
      };
    });

    // Broadcast updates
    this.emitVehiclesUpdated();

    // Broadcast alerts
    alertsGenerated.forEach((alert) => {
      this.emitAlert(alert);
    });
  }

  public getVehicles(): MockVehiculo[] {
    return this.currentVehicles;
  }

  private emitVehiclesUpdated() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("trackops:vehicles-updated", {
          detail: { vehicles: this.currentVehicles },
        })
      );
    }
  }

  private emitAlert(alert: SimulatedAlert) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("trackops:simulation-alert", {
          detail: { alert },
        })
      );
    }
  }

  private emitStateChange() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("trackops:simulation-state-change", {
          detail: { isRunning: this.isRunning, intervalMs: this.intervalMs },
        })
      );
    }
  }
}

// Global Singleton Simulator instance
export const simulationEngine = new FleetSimulationEngine();
