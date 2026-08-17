"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import "leaflet.markercluster";
import { renderToString } from "react-dom/server";
import { Car, Truck as TruckIcon, AlertTriangle, X, Bell, ArrowUpRight, Route, Gauge } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
}

const defaultCenter = { lat: -38.7183, lng: -62.2663 }; // Bahia Blanca

interface FleetMapProps {
  vehiculos?: any[];
  isListOpen?: boolean;
  focusedVehicleId?: number | null;
  setFocusedVehicleId?: (id: number | null) => void;
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
    vehiculos.forEach((v) => {
      let bgClass = "bg-emerald-500";
      if (v.estado === "Ralentí") bgClass = "bg-amber-500";
      if (v.estado === "Detenido") bgClass = "bg-slate-500";
      if (v.hasAlert) bgClass = "bg-destructive";

      const iconHtml = renderToString(
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-card border shadow-lg cursor-pointer">
          {v.tipo === "Camión" || v.tipo === "Camioneta" ? (
            <TruckIcon className={`w-4 h-4 ${bgClass.replace('bg-', 'text-')}`} />
          ) : (
            <Car className={`w-4 h-4 ${bgClass.replace('bg-', 'text-')}`} />
          )}
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${bgClass}`} />
          {v.hasAlert && (
            <div className="absolute -bottom-2 bg-destructive text-destructive-foreground text-[8px] font-bold px-1 rounded-sm shadow-sm flex items-center gap-0.5">
              <AlertTriangle className="w-2 h-2" />
            </div>
          )}
        </div>
      );

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
      map.invalidateSize();

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
      map.fitBounds(bounds, {
        paddingTopLeft: [isListOpen && !isMobile ? 380 : 50, 50],
        paddingBottomRight: [50, 50],
        maxZoom: focusedVehicleId ? 16 : 15,
        animate: true,
        duration: 1.5
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [vehiculos, map, isListOpen, focusedVehicleId]);

  return null;
}

export default function FleetMap({ vehiculos = [], isListOpen = true, focusedVehicleId = null, setFocusedVehicleId }: FleetMapProps) {
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
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />
        <MapBounds vehiculos={vehiculos} isListOpen={isListOpen} focusedVehicleId={focusedVehicleId} />
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
                  router.push(`/dashboard/control-flota/vehiculos/${focusedVehicle.id}`);
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
                  <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">
                    Últ. registro
                  </span>
                </div>
              </div>
              {focusedVehicle.hasAlert ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                  <Bell className="w-3.5 h-3.5" />
                  {focusedVehicle.alertasCount} {focusedVehicle.alertasCount === 1 ? 'Alerta' : 'Alertas'}
                </span>
              ) : (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">
                  Sin alertas
                </span>
              )}
            </div>

            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/control-flota/vehiculos/${focusedVehicle.id}`);
                }}
              >
                <ArrowUpRight className="w-4 h-4" />
                Ver vehículo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Route className="w-4 h-4" />
                Ver recorrido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}