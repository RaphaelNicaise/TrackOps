"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap, Polygon, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import { Car, Truck as TruckIcon, AlertTriangle, X, Bell, ArrowUpRight, Route, Gauge, Clock, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Geofence } from "@/types/geofence";

// Fix Leaflet's default icon path issues with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

if (typeof window !== "undefined") {
  (window as any).L = L;
  try {
    require("leaflet.markercluster");
  } catch {}

  // Guard against Leaflet _leaflet_pos unmount transition errors
  if (L) {
    if (L.DomUtil) {
      const origGetPosition = L.DomUtil.getPosition;
      L.DomUtil.getPosition = function (el: any) {
        if (!el) return new L.Point(0, 0);
        try {
          return origGetPosition(el);
        } catch {
          return new L.Point(0, 0);
        }
      };
    }
    if ((L.Map as any)?.prototype?._getMapPanePos) {
      const origGetMapPanePos = (L.Map as any).prototype._getMapPanePos;
      (L.Map as any).prototype._getMapPanePos = function () {
        if (!this._mapPane) return new L.Point(0, 0);
        try {
          return origGetMapPanePos.call(this);
        } catch {
          return new L.Point(0, 0);
        }
      };
    }
    // Guard against Polyline / Polygon _projectLatlngs recursion crash on null/invalid coords or cross-module LatLng instanceof failures
    if (L.Polyline && (L.Polyline.prototype as any)) {
      // @ts-ignore - patching private Leaflet method for null-guard
      (L.Polyline.prototype as any)._projectLatlngs = function (latlngs: any, result: any, projectedBounds: any) {
        if (!latlngs || !Array.isArray(latlngs) || latlngs.length === 0) return;

        const first = latlngs[0];
        const flat =
          first instanceof L.LatLng ||
          (first != null && typeof first === "object" && ("lat" in first || "lng" in first)) ||
          (Array.isArray(first) && typeof first[0] === "number");

        if (flat) {
          const ring: any[] = [];
          for (let i = 0; i < latlngs.length; i++) {
            if (!latlngs[i]) continue;
            try {
              const pt = this._map.latLngToLayerPoint(latlngs[i]);
              ring.push(pt);
              projectedBounds.extend(pt);
            } catch {}
          }
          result.push(ring);
        } else {
          for (let i = 0; i < latlngs.length; i++) {
            if (latlngs[i]) {
              this._projectLatlngs(latlngs[i], result, projectedBounds);
            }
          }
        }
      };
    }
  }
}

const defaultCenter = { lat: -38.7183, lng: -62.2663 }; // Bahia Blanca

interface FleetMapProps {
  vehiculos?: any[];
  geofences?: Geofence[];
  showGeofences?: boolean;
  isListOpen?: boolean;
  focusedVehicleId?: number | null;
  setFocusedVehicleId?: (id: number | null) => void;
  isFullscreen?: boolean;
}

function MapFullscreenHandler({ isFullscreen }: { isFullscreen?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen, map]);
  return null;
}

function GeofencesGroup({
  geofences = [],
  showGeofences = true,
}: {
  geofences: Geofence[];
  showGeofences: boolean;
}) {
  if (!showGeofences || !geofences || geofences.length === 0) return null;

  return (
    <>
      {geofences.map((g) => {
        if (!g) return null;
        const color = g.color || "#3b82f6";
        const opacity = g.opacidad ?? 0.25;

        if (g.tipo === "Polígono" && Array.isArray(g.coordenadas) && g.coordenadas.length >= 3) {
          const validCoords: [number, number][] = [];
          for (const pt of g.coordenadas) {
            if (Array.isArray(pt) && pt.length >= 2) {
              const lat = Number(pt[0]);
              const lng = Number(pt[1]);
              if (!isNaN(lat) && !isNaN(lng)) {
                validCoords.push([lat, lng]);
              }
            } else if (pt && typeof pt === "object" && "lat" in pt && "lng" in pt) {
              const lat = Number((pt as any).lat);
              const lng = Number((pt as any).lng);
              if (!isNaN(lat) && !isNaN(lng)) {
                validCoords.push([lat, lng]);
              }
            }
          }

          if (validCoords.length < 3) return null;

          return (
            <Polygon
              key={`geofence-${g.id}`}
              positions={validCoords}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: opacity,
                weight: 2,
                dashArray: g.activa ? undefined : "5, 5",
              }}
            >
              <Popup closeButton={false}>
                <div className="p-1 min-w-[190px] text-slate-900 dark:text-slate-100 font-sans">
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{g.nombre}</span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        g.activa
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-500/15 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {g.activa ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  {g.descripcion && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1.5">
                      {g.descripcion}
                    </p>
                  )}
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Tipo:</span>
                      <span className="font-semibold text-foreground">{g.tipo}</span>
                    </div>
                    {g.speedLimit && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Límite vel:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {g.speedLimit} km/h
                        </span>
                      </div>
                    )}
                    {g.targetType && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Asignación:</span>
                        <span className="font-semibold text-foreground">
                          {g.targetType === "ALL" ? "Toda la flota" : g.targetType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        }

        if (g.tipo === "Círculo" && g.centro && g.radio) {
          let centerLatLng: [number, number] | null = null;
          if (Array.isArray(g.centro) && g.centro.length >= 2) {
            const lat = Number(g.centro[0]);
            const lng = Number(g.centro[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              centerLatLng = [lat, lng];
            }
          } else if (g.centro && typeof g.centro === "object" && "lat" in g.centro && "lng" in g.centro) {
            const lat = Number((g.centro as any).lat);
            const lng = Number((g.centro as any).lng);
            if (!isNaN(lat) && !isNaN(lng)) {
              centerLatLng = [lat, lng];
            }
          }

          const radius = Number(g.radio);
          if (!centerLatLng || isNaN(radius) || radius <= 0) return null;

          return (
            <Circle
              key={`geofence-${g.id}`}
              center={centerLatLng}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: opacity,
                weight: 2,
                dashArray: g.activa ? undefined : "5, 5",
              }}
            >
              <Popup closeButton={false}>
                <div className="p-1 min-w-[190px] text-slate-900 dark:text-slate-100 font-sans">
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{g.nombre}</span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        g.activa
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-500/15 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {g.activa ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  {g.descripcion && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1.5">
                      {g.descripcion}
                    </p>
                  )}
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Radio:</span>
                      <span className="font-semibold text-foreground">{radius}m</span>
                    </div>
                    {g.speedLimit && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Límite vel:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {g.speedLimit} km/h
                        </span>
                      </div>
                    )}
                    {g.targetType && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Asignación:</span>
                        <span className="font-semibold text-foreground">
                          {g.targetType === "ALL" ? "Toda la flota" : g.targetType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        }

        return null;
      })}
    </>
  );
}

function VehicleClusterGroup({
  vehiculos,
  setFocusedVehicleId,
}: {
  vehiculos: any[];
  setFocusedVehicleId?: (id: number | null) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    if (typeof (L as any).markerClusterGroup !== "function") {
      if (typeof window !== "undefined") {
        (window as any).L = L;
        require("leaflet.markercluster");
      }
    }

    // Create marker cluster group with custom minimalist amber/dark icon
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 16,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 38 : count < 50 ? 44 : 50;
        return L.divIcon({
          html: `<div style="width: ${size}px; height: ${size}px; line-height: 1;" class="relative flex items-center justify-center rounded-full bg-[#1E2227] text-white font-bold text-xs shadow-xl border-2 border-[#F2B705] hover:scale-110 transition-transform duration-200 cursor-pointer">
            <span class="tracking-tight">${count}</span>
            <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#F2B705] border border-[#1E2227]"></span>
          </div>`,
          className: "bg-transparent border-none",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    clusterGroupRef.current = clusterGroup;

    // Add markers for each vehicle
    const validVehiculos = Array.isArray(vehiculos)
      ? vehiculos.filter(
          (v) =>
            v &&
            typeof v.lat === "number" &&
            !isNaN(v.lat) &&
            typeof v.lng === "number" &&
            !isNaN(v.lng)
        )
      : [];

    validVehiculos.forEach((v) => {
      let bgClass = "bg-emerald-500";
      let textClass = "text-emerald-500";
      if (v.estado === "Ralentí") {
        bgClass = "bg-amber-500";
        textClass = "text-amber-500";
      } else if (v.estado === "Detenido") {
        bgClass = "bg-slate-500";
        textClass = "text-slate-500";
      }
      if (v.hasAlert) {
        bgClass = "bg-destructive";
        textClass = "text-destructive";
      }

      const isTruck = v.tipo === "Camión" || v.tipo === "Camioneta";
      const iconSvg = isTruck
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${textClass}"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${textClass}"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

      const alertBadge = v.hasAlert
        ? `<div class="absolute -bottom-2 bg-destructive text-destructive-foreground text-[8px] font-bold px-1 rounded-sm shadow-sm flex items-center gap-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>`
        : "";

      const iconHtml = `<div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-card border shadow-lg cursor-pointer">
        ${iconSvg}
        <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${bgClass}"></div>
        ${alertBadge}
      </div>`;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "bg-transparent border-none",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([v.lat, v.lng], { icon: customIcon });
      marker.bindPopup(`<span class="font-semibold text-sm">${v.patente}</span> - <span class="text-xs text-muted-foreground">${v.tipo}</span>`);
      marker.on("click", () => {
        setFocusedVehicleId?.(v.id);
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, vehiculos, setFocusedVehicleId]);

  return null;
}

function MapBounds({ vehiculos, isListOpen, focusedVehicleId }: { vehiculos: any[]; isListOpen: boolean; focusedVehicleId: number | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (!vehiculos || vehiculos.length === 0) return;
    
    const timer = setTimeout(() => {
      if (!map || !(map as any)._loaded || !(map as any)._mapPane) return;
      try {
        map.invalidateSize();
      } catch {}

      let bounds;
      
      if (focusedVehicleId) {
        const focusedVehicle = vehiculos.find(v => v.id === focusedVehicleId);
        if (focusedVehicle) {
          bounds = L.latLngBounds([focusedVehicle.lat, focusedVehicle.lng], [focusedVehicle.lat, focusedVehicle.lng]);
        }
      }
      
      if (!bounds) {
        // Create bounds from all vehicle coordinates
        bounds = L.latLngBounds(vehiculos.map(v => [v.lat, v.lng]));
      }
      
      const isMobile = window.innerWidth < 768;
      
      // Fit bounds, adding extra padding on the left if the sidebar is open on desktop
      // so the vehicles are centered in the VISIBLE portion of the map.
      try {
        map.fitBounds(bounds, {
          paddingTopLeft: [isListOpen && !isMobile ? 380 : 50, 50],
          paddingBottomRight: [50, 50],
          maxZoom: focusedVehicleId ? 16 : 15,
          animate: true,
          duration: 1.5
        });
      } catch {}
    }, 200);

    return () => {
      clearTimeout(timer);
      try {
        map.stop();
      } catch {}
    };
  }, [vehiculos, map, isListOpen, focusedVehicleId]);

  return null;
}

export default function FleetMap({
  vehiculos = [],
  geofences = [],
  showGeofences = true,
  isListOpen = true,
  focusedVehicleId = null,
  setFocusedVehicleId,
  isFullscreen = false,
}: FleetMapProps) {
  const router = useRouter();
  const focusedVehicle = focusedVehicleId ? vehiculos.find(v => v.id === focusedVehicleId) : null;
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (panelRef.current) {
      L.DomEvent.disableClickPropagation(panelRef.current);
      L.DomEvent.disableScrollPropagation(panelRef.current);
    }
  }, [focusedVehicle]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={[defaultCenter.lat, defaultCenter.lng]} 
        zoom={12} 
        scrollWheelZoom={true} 
        zoomSnap={0.25}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={120}
        wheelDebounceTime={40}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />
        <MapFullscreenHandler isFullscreen={isFullscreen} />
        <MapBounds vehiculos={vehiculos} isListOpen={isListOpen} focusedVehicleId={focusedVehicleId} />
        <GeofencesGroup geofences={geofences} showGeofences={showGeofences} />
        <VehicleClusterGroup vehiculos={vehiculos} setFocusedVehicleId={setFocusedVehicleId} />
      </MapContainer>

      {/* Floating Vehicle Info Panel */}
      {focusedVehicle && (
        <div
          ref={panelRef}
          className={`absolute bottom-6 z-[1000] w-[90%] max-w-sm transition-all duration-300 ease-in-out pointer-events-auto ${
            isListOpen
              ? "left-4 md:left-[380px] md:translate-x-0"
              : "left-1/2 -translate-x-1/2"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex items-start justify-between gap-3 p-4 pb-3 border-b border-border/50">
              <div
                className="group min-w-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/panel/control-flota/vehiculos/${focusedVehicle.id}`);
                }}
              >
                <h3 className="font-bold text-lg flex items-center gap-2 truncate group-hover:text-primary transition-colors">
                  {focusedVehicle.patente}
                  {focusedVehicle.hasAlert && (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-destructive animate-pulse" />
                  )}
                </h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{focusedVehicle.tipo}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-1 shrink-0 rounded-full hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedVehicleId?.(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-muted-foreground" />
                <div className="leading-tight">
                  <span className="font-semibold text-sm">{focusedVehicle.velocidad}</span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5 opacity-70" />
                    {focusedVehicle.ultimaActualizacion}
                  </span>
                </div>
              </div>
              {focusedVehicle.hasAlert ? (
                <Link
                  href={`/panel/monitoreo/alertas?patente=${encodeURIComponent(focusedVehicle.patente)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors px-2 py-1 rounded-md"
                  title="Ver alertas de este vehículo"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {focusedVehicle.alertasCount} {focusedVehicle.alertasCount === 1 ? 'Alerta' : 'Alertas'}
                </Link>
              ) : (
                <Link
                  href={`/panel/monitoreo/alertas?patente=${encodeURIComponent(focusedVehicle.patente)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-medium text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors px-2 py-1 rounded-md"
                  title="Ver historial de alertas"
                >
                  Sin alertas
                </Link>
              )}
            </div>

            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/panel/control-flota/vehiculos/${focusedVehicle.id}`);
                }}
              >
                <ArrowUpRight className="w-4 h-4" />
                Ver vehículo
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Link href={`/panel/monitoreo/alertas?patente=${encodeURIComponent(focusedVehicle.patente)}`}>
                  <Bell className="w-4 h-4" />
                  Ver alertas
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}