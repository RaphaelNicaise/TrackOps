"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Circle, Popup, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { renderToString } from "react-dom/server";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default,
  iconUrl: require("leaflet/dist/images/marker-icon.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
});

export interface Geofence {
  id: number;
  nombre: string;
  tipo: "Polígono" | "Círculo";
  color: string;
  coordenadas?: [number, number][]; // For Polygon
  centro?: [number, number]; // For Circle
  radio?: number; // For Circle in meters
  activa: boolean;
}

interface GeofenceMapProps {
  geofences?: Geofence[];
  isListOpen?: boolean;
  focusedGeofenceId?: number | null;
  setFocusedGeofenceId?: (id: number | null) => void;
}

function MapBounds({ geofences, isListOpen, focusedGeofenceId }: { geofences: Geofence[]; isListOpen: boolean; focusedGeofenceId: number | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (!geofences || geofences.length === 0) return;
    
    const timer = setTimeout(() => {
      map.invalidateSize();

      let bounds;
      
      if (focusedGeofenceId) {
        const focused = geofences.find(g => g.id === focusedGeofenceId);
        if (focused) {
          if (focused.tipo === "Polígono" && focused.coordenadas) {
            bounds = L.latLngBounds(focused.coordenadas);
          } else if (focused.tipo === "Círculo" && focused.centro && focused.radio) {
            const circle = L.circle(focused.centro, { radius: focused.radio });
            bounds = circle.getBounds();
          }
        }
      }
      
      if (!bounds) {
        // Create bounds from all geofences
        const allLatLngs: L.LatLngExpression[] = [];
        geofences.forEach(g => {
          if (g.tipo === "Polígono" && g.coordenadas) {
            allLatLngs.push(...g.coordenadas);
          } else if (g.tipo === "Círculo" && g.centro && g.radio) {
            const circle = L.circle(g.centro, { radius: g.radio });
            allLatLngs.push(circle.getBounds().getNorthWest(), circle.getBounds().getSouthEast());
          }
        });
        
        if (allLatLngs.length > 0) {
          bounds = L.latLngBounds(allLatLngs);
        }
      }
      
      if (bounds) {
        const isMobile = window.innerWidth < 768;
        
        map.fitBounds(bounds, {
          paddingTopLeft: [isListOpen && !isMobile ? 380 : 50, 50],
          paddingBottomRight: [50, 50],
          maxZoom: 16,
          animate: true,
          duration: 1.5
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [geofences, map, isListOpen, focusedGeofenceId]);

  return null;
}

export default function GeofenceMap({ geofences = [], isListOpen = true, focusedGeofenceId = null, setFocusedGeofenceId }: GeofenceMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={[-38.7183, -62.2663]} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />
        <MapBounds geofences={geofences} isListOpen={isListOpen} focusedGeofenceId={focusedGeofenceId} />
        
        {geofences.map((g) => {
          const isFocused = focusedGeofenceId === g.id;
          const fillOpacity = isFocused ? 0.4 : 0.2;
          const weight = isFocused ? 3 : 2;
          
          if (g.tipo === "Polígono" && g.coordenadas) {
            return (
              <Polygon 
                key={g.id}
                positions={g.coordenadas}
                pathOptions={{ color: g.color, fillColor: g.color, fillOpacity, weight }}
                eventHandlers={{
                  click: () => setFocusedGeofenceId?.(g.id)
                }}
              />
            );
          } else if (g.tipo === "Círculo" && g.centro && g.radio) {
            return (
              <Circle
                key={g.id}
                center={g.centro}
                radius={g.radio}
                pathOptions={{ color: g.color, fillColor: g.color, fillOpacity, weight }}
                eventHandlers={{
                  click: () => setFocusedGeofenceId?.(g.id)
                }}
              />
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
}
