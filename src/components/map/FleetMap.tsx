"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { Car, Truck as TruckIcon, AlertTriangle } from "lucide-react";

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
}

function MapBounds({ vehiculos, isListOpen, focusedVehicleId }: { vehiculos: any[]; isListOpen: boolean; focusedVehicleId: number | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (!vehiculos || vehiculos.length === 0) return;
    
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
    
    // Fit bounds, adding extra padding on the left if the sidebar is open
    // so the vehicles are centered in the VISIBLE portion of the map.
    map.fitBounds(bounds, {
      paddingTopLeft: [isListOpen ? 380 : 50, 50],
      paddingBottomRight: [50, 50],
      maxZoom: focusedVehicleId ? 16 : 15,
      animate: true,
      duration: 1.5
    });
  }, [vehiculos, map, isListOpen, focusedVehicleId]);

  return null;
}

export default function FleetMap({ vehiculos = [], isListOpen = true, focusedVehicleId = null }: FleetMapProps) {
  const [mounted, setMounted] = useState(false);

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
              {/* Status Indicator Dot */}
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
            popupAnchor: [0, -16]
          });

          return (
            <Marker key={v.id} position={[v.lat, v.lng]} icon={customIcon}>
              <Popup className="rounded-xl overflow-hidden shadow-xl border-0">
                <div className="p-1 min-w-[140px]">
                  <div className="font-bold text-sm mb-1">{v.patente}</div>
                  <div className="text-xs text-muted-foreground">{v.tipo}</div>
                  <div className="mt-2 text-xs font-semibold flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${bgClass}`} />
                    {v.estado}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{v.velocidad}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
