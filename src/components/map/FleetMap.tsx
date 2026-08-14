"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { Car, Truck as TruckIcon, AlertTriangle, X, Bell, Route, Gauge } from "lucide-react";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Button } from "@/components/ui/button";

// Fix Leaflet's default icon path issues with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const defaultCenter = { lat: -38.7183, lng: -62.2663 }; // Bahia Blanca

interface FleetMapProps {
  vehiculos?: any[];
  isListOpen?: boolean;
  focusedVehicleId?: number | null;
  setFocusedVehicleId?: (id: number | null) => void;
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
  const [mounted, setMounted] = useState(false);
  
  const focusedVehicle = focusedVehicleId ? vehiculos.find(v => v.id === focusedVehicleId) : null;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-muted/20 animate-pulse flex items-center justify-center">Cargando mapa...</div>;

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
        
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          showCoverageOnHover={false}
          iconCreateFunction={(cluster: any) => {
            return L.divIcon({
              html: `<div class="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-background ring-2 ring-primary/20">${cluster.getChildCount()}</div>`,
              className: 'custom-cluster-icon',
              iconSize: [40, 40],
            });
          }}
        >
          {vehiculos.map((v) => {
            let bgClass = "bg-emerald-500";
            if (v.estado === "Ralentí") bgClass = "bg-amber-500";
            if (v.estado === "Detenido") bgClass = "bg-slate-500";
            if (v.hasAlert) bgClass = "bg-destructive";

            const iconHtml = renderToString(
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-card border shadow-lg">
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

            return (
              <Marker 
                key={v.id} 
                position={[v.lat, v.lng]} 
                icon={customIcon}
                eventHandlers={{
                  click: () => {
                    setFocusedVehicleId?.(v.id);
                  }
                }}
              />
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Floating Vehicle Info Panel */}
      {focusedVehicle && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md">
          <div className="bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex justify-between items-start p-4 border-b border-border/50">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {focusedVehicle.patente}
                  {focusedVehicle.hasAlert && (
                    <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
                  )}
                </h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{focusedVehicle.tipo}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => setFocusedVehicleId?.(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{focusedVehicle.kilometraje}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  {focusedVehicle.hasAlert ? (
                    <span className="flex items-center gap-1.5 text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                      <Bell className="w-4 h-4" />
                      {focusedVehicle.alertasCount} {focusedVehicle.alertasCount === 1 ? 'Alerta' : 'Alertas'}
                    </span>
                  ) : (
                    <span className="text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">
                      Sin alertas
                    </span>
                  )}
                </div>
              </div>
              
              <Button className="w-full gap-2">
                <Route className="w-4 h-4" />
                Ver Recorrido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
