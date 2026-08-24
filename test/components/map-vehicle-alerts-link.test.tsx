import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/panel/control-flota/vehiculos/1",
}));

// Mock leaflet styles and plugins
vi.mock("leaflet/dist/leaflet.css", () => ({}));
vi.mock("leaflet.markercluster/dist/MarkerCluster.css", () => ({}));
vi.mock("leaflet.markercluster/dist/MarkerCluster.Default.css", () => ({}));
vi.mock("leaflet.markercluster", () => ({}));

// Mock react-leaflet
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  ZoomControl: () => <div data-testid="zoom-control" />,
  useMap: () => ({
    invalidateSize: vi.fn(),
    fitBounds: vi.fn(),
    stop: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
  }),
  Polygon: ({ children }: any) => <div>{children}</div>,
  Circle: ({ children }: any) => <div>{children}</div>,
  Popup: ({ children }: any) => <div>{children}</div>,
}));

// Mock leaflet
const { mockL } = vi.hoisted(() => {
  const L = {
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
    DomUtil: { getPosition: vi.fn() },
    DomEvent: {
      disableClickPropagation: vi.fn(),
      disableScrollPropagation: vi.fn(),
    },
    Map: { prototype: {} },
    latLngBounds: vi.fn().mockReturnValue({}),
    markerClusterGroup: vi.fn().mockReturnValue({
      addLayer: vi.fn(),
      getChildCount: vi.fn().mockReturnValue(5),
    }),
    divIcon: vi.fn().mockReturnValue({}),
    marker: vi.fn().mockReturnValue({
      bindPopup: vi.fn(),
      on: vi.fn(),
    }),
    Point: vi.fn(),
  };
  return { mockL: L };
});

if (typeof global !== "undefined") {
  (global as any).L = mockL;
}

vi.mock("leaflet", () => {
  return { default: mockL, ...mockL };
});

// Mock dialogs in vehiculo-detail to avoid open dialog rendering issues
vi.mock("@/components/dashboard/vehiculos/vehicle-dialogs", () => ({
  EditVehicleDialog: () => <div data-testid="edit-vehicle-dialog" />,
  DeleteVehicleButton: () => <div data-testid="delete-vehicle-button" />,
}));

vi.mock("@/components/dashboard/vehiculos/documentos", () => ({
  VehiculoDocumentos: () => <div data-testid="vehiculo-documentos" />,
}));

import { VehiculoDetail, VehiculoDetailData } from "@/components/dashboard/vehiculos/vehiculo-detail";
import FleetMap from "@/components/map/FleetMap";
import { MapaView } from "@/app/panel/mapa/mapa-view";

describe("Task 7: Direct Alert Filter Links in Map and Vehicle Cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. VehiculoDetail Alert Filter Navigation Links", () => {
    const mockVehicle: VehiculoDetailData = {
      id: 10,
      empresaId: 1,
      patente: "AB 123 CD",
      marca: "Toyota",
      modelo: "Hilux",
      anio: 2023,
      tipo: "camioneta",
      chasis: "8AJBA3CD",
      kilometrajeActual: 15400,
      rto: new Date("2027-01-01"),
    };

    it("renders a direct link to filtered alerts in the vehicle detail header actions", () => {
      const html = renderToStaticMarkup(<VehiculoDetail vehicle={mockVehicle} />);
      const expectedHref = `/panel/monitoreo/alertas?patente=${encodeURIComponent(mockVehicle.patente)}`;

      expect(html).toContain(expectedHref);
      expect(html).toContain("Ver Alertas");
    });

    it("renders alert navigation link inside vencimientos y alertas section", () => {
      const html = renderToStaticMarkup(<VehiculoDetail vehicle={mockVehicle} />);
      const expectedHref = `/panel/monitoreo/alertas?patente=${encodeURIComponent(mockVehicle.patente)}`;

      expect(html).toContain("Vencimientos y alertas");
      expect(html).toContain(expectedHref);
    });

    it("correctly encodes special characters in vehicle plate for alert filter URL", () => {
      const vehicleWithSpecialChars: VehiculoDetailData = {
        ...mockVehicle,
        patente: "AF 999 ZZ/1",
      };
      const html = renderToStaticMarkup(<VehiculoDetail vehicle={vehicleWithSpecialChars} />);
      const expectedHref = `/panel/monitoreo/alertas?patente=${encodeURIComponent("AF 999 ZZ/1")}`;

      expect(html).toContain(expectedHref);
    });
  });

  describe("2. FleetMap Focused Vehicle Info Panel Alert Links", () => {
    const mockVehiclesList = [
      {
        id: 1,
        patente: "AB 123 CD",
        tipo: "Camión",
        lat: -38.7183,
        lng: -62.2663,
        velocidad: "64 km/h",
        estado: "En movimiento",
        ultimaActualizacion: "Hace 2 min",
        online: true,
        hasAlert: true,
        alertasCount: 2,
      },
      {
        id: 2,
        patente: "AF 888 ZZ",
        tipo: "Auto",
        lat: -38.72,
        lng: -62.27,
        velocidad: "0 km/h",
        estado: "Detenido",
        ultimaActualizacion: "Hace 10 min",
        online: true,
        hasAlert: false,
        alertasCount: 0,
      },
    ];

    it("renders clickable alert badge linking to filtered alerts when focused vehicle has alerts", () => {
      const html = renderToStaticMarkup(
        <FleetMap
          vehiculos={mockVehiclesList}
          focusedVehicleId={1}
        />
      );

      const expectedHref = `/panel/monitoreo/alertas?patente=${encodeURIComponent("AB 123 CD")}`;
      expect(html).toContain(expectedHref);
      expect(html).toContain("2 Alertas");
    });

    it("renders clickable 'Sin alertas' badge linking to filtered alerts when vehicle has no alerts", () => {
      const html = renderToStaticMarkup(
        <FleetMap
          vehiculos={mockVehiclesList}
          focusedVehicleId={2}
        />
      );

      const expectedHref = `/panel/monitoreo/alertas?patente=${encodeURIComponent("AF 888 ZZ")}`;
      expect(html).toContain(expectedHref);
      expect(html).toContain("Sin alertas");
    });

    it("renders a dedicated 'Ver alertas' action button in the vehicle popup panel", () => {
      const html = renderToStaticMarkup(
        <FleetMap
          vehiculos={mockVehiclesList}
          focusedVehicleId={1}
        />
      );

      const expectedHref = `/panel/monitoreo/alertas?patente=${encodeURIComponent("AB 123 CD")}`;
      expect(html).toContain(expectedHref);
      expect(html).toContain("Ver alertas");
    });
  });

  describe("3. MapaPage Sidebar Vehicle List Alert Indicator Links", () => {
    it("renders alert link on vehicle items with active alerts in the sidebar list", () => {
      const html = renderToStaticMarkup(
        <MapaView
          initialVehicles={[
            {
              id: 9,
              patente: "AB 123 CD",
              marca: "Ford",
              modelo: "Ranger",
              anio: 2021,
              tipo: "Camioneta",
              chasis: "-",
              kilometrajeActual: 1000,
              rto: null,
              docCount: 0,
              estado: "Detenido",
              velocidad: "0 km/h",
              ultimaActualizacion: "Hace 1 min",
              online: true,
              hasAlert: true,
              lat: -38.71,
              lng: -62.26,
              kilometraje: "1.000 km",
              alertasCount: 1,
            },
          ]}
        />
      );

      expect(html).toContain("/panel/monitoreo/alertas?patente=");
    });
  });
});
