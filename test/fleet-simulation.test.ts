import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDistanceMeters,
  isPointInPolygon,
  isPointInCircle,
  isVehicleInsideGeofence,
  simulationEngine,
  BAHIA_BLANCA_ROUTES,
} from "@/lib/fleet-simulation";
import type { Geofence } from "@/types/geofence";

describe("Fleet Simulation Engine (Bahía Blanca)", () => {
  let listeners: Record<string, Function[]> = {};

  beforeEach(() => {
    listeners = {};
    (globalThis as any).window = {
      dispatchEvent: vi.fn((event: any) => {
        const cbs = listeners[event.type] || [];
        cbs.forEach((cb) => cb(event));
        return true;
      }),
      addEventListener: vi.fn((type: string, cb: Function) => {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(cb);
      }),
      removeEventListener: vi.fn((type: string, cb: Function) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((fn) => fn !== cb);
        }
      }),
    };
    (globalThis as any).localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    (globalThis as any).CustomEvent = class CustomEvent {
      type: string;
      detail: any;
      constructor(type: string, init?: any) {
        this.type = type;
        this.detail = init?.detail;
      }
    };

    simulationEngine.stop();
    simulationEngine.reset();
  });

  afterEach(() => {
    simulationEngine.stop();
  });

  it("calculates haversine distance between two coordinates accurately", () => {
    // Distance between Bahía Blanca Plaza Rivadavia and Base Central (~300-600m)
    const dist = getDistanceMeters(-38.7196, -62.2654, -38.7180, -62.2660);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(500);
  });

  it("detects point in polygon properly", () => {
    const squarePoly: [number, number][] = [
      [-38.7150, -62.2630],
      [-38.7150, -62.2690],
      [-38.7210, -62.2690],
      [-38.7210, -62.2630],
    ];

    // Inside point
    expect(isPointInPolygon([-38.7180, -62.2660], squarePoly)).toBe(true);

    // Outside point
    expect(isPointInPolygon([-38.7500, -62.3000], squarePoly)).toBe(false);
  });

  it("detects point in circle properly", () => {
    const center: [number, number] = [-38.7300, -62.2800];
    const radiusMeters = 800;

    // Inside center
    expect(isPointInCircle([-38.7300, -62.2800], center, radiusMeters)).toBe(true);

    // Point ~100m away (inside)
    expect(isPointInCircle([-38.7305, -62.2805], center, radiusMeters)).toBe(true);

    // Point 2km away (outside)
    expect(isPointInCircle([-38.7500, -62.2800], center, radiusMeters)).toBe(false);
  });

  it("evaluates isVehicleInsideGeofence for polygon and circle types", () => {
    const polyGeofence: Geofence = {
      id: 1,
      empresaId: 1,
      nombre: "Test Poly",
      tipo: "Polígono",
      color: "#3B82F6",
      coordenadas: [
        [-38.7150, -62.2630],
        [-38.7150, -62.2690],
        [-38.7210, -62.2690],
        [-38.7210, -62.2630],
      ],
      activa: true,
      targetType: "ALL",
      alertEvents: ["EXIT"],
    };

    expect(isVehicleInsideGeofence(-38.7180, -62.2660, polyGeofence)).toBe(true);
    expect(isVehicleInsideGeofence(-38.7500, -62.2660, polyGeofence)).toBe(false);

    const circleGeofence: Geofence = {
      id: 2,
      empresaId: 1,
      nombre: "Test Circle",
      tipo: "Círculo",
      color: "#10B981",
      centro: [-38.7300, -62.2800],
      radio: 800,
      activa: true,
      targetType: "ALL",
      alertEvents: ["EXIT", "SPEED_LIMIT"],
      speedLimit: 40,
    };

    expect(isVehicleInsideGeofence(-38.7300, -62.2800, circleGeofence)).toBe(true);
    expect(isVehicleInsideGeofence(-38.7600, -62.2800, circleGeofence)).toBe(false);
  });

  it("steps the simulation and updates vehicle positions along Bahía Blanca routes", () => {
    const initialVehicles = simulationEngine.getVehicles();
    expect(initialVehicles.length).toBeGreaterThan(0);

    const initialLat = initialVehicles[0].lat;
    const initialLng = initialVehicles[0].lng;

    // Trigger step
    simulationEngine.step();

    const steppedVehicles = simulationEngine.getVehicles();
    const veh1 = steppedVehicles.find((v) => v.id === 1);
    expect(veh1).toBeDefined();
    expect(veh1!.lat).toBe(BAHIA_BLANCA_ROUTES[1][1].lat);
    expect(veh1!.lng).toBe(BAHIA_BLANCA_ROUTES[1][1].lng);
  });

  it("handles start, stop, interval and reset lifecycle correctly", () => {
    expect(simulationEngine.getIsRunning()).toBe(false);

    simulationEngine.start();
    expect(simulationEngine.getIsRunning()).toBe(true);

    simulationEngine.setIntervalMs(1500);
    expect(simulationEngine.getIntervalMs()).toBe(1500);

    simulationEngine.stop();
    expect(simulationEngine.getIsRunning()).toBe(false);

    simulationEngine.reset();
    expect(simulationEngine.getVehicles().length).toBeGreaterThan(0);
  });

  it("generates simulation alerts when vehicles exceed speed limits or trigger events", () => {
    const alertListener = vi.fn();
    window.addEventListener("trackops:simulation-alert", alertListener);

    // Run several steps to traverse through geofences and speed limits
    for (let i = 0; i < 5; i++) {
      simulationEngine.step();
    }

    expect(alertListener).toHaveBeenCalled();
    window.removeEventListener("trackops:simulation-alert", alertListener);
  });
});
