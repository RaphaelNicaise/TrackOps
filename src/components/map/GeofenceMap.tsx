"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Circle,
  Polyline,
  Popup,
  ZoomControl,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Square,
  Circle as CircleIcon,
  Edit3,
  Hand,
  RotateCcw,
  Trash2,
  Plus,
  Move,
  Info,
  Shield,
  Truck,
  Gauge,
  MapPin,
  Check,
} from "lucide-react";
import { Geofence, GeofenceFormData, DrawingMode } from "@/types/geofence";

// Re-export Geofence type for backward compatibility
export type { Geofence, GeofenceFormData, DrawingMode };

// Fix standard Leaflet default icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default,
  iconUrl: require("leaflet/dist/images/marker-icon.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
});

export interface GeofenceMapProps {
  geofences?: Geofence[];
  isListOpen?: boolean;
  focusedGeofenceId?: number | null;
  setFocusedGeofenceId?: (id: number | null) => void;
  // Interactive editing props
  isEditing?: boolean;
  draftGeofence?: GeofenceFormData | null;
  onDraftChange?: (draft: GeofenceFormData) => void;
  drawingMode?: DrawingMode;
  setDrawingMode?: (mode: DrawingMode) => void;
  onSelectGeofence?: (id: number) => void;
}

// ---------------------------------------------------------------------------
// Geometry Helpers
// ---------------------------------------------------------------------------

function getPolygonCentroid(coords: [number, number][]): [number, number] {
  if (!coords || coords.length === 0) return [-38.7183, -62.2663];
  let latSum = 0;
  let lngSum = 0;
  coords.forEach(([lat, lng]) => {
    latSum += lat;
    lngSum += lng;
  });
  return [latSum / coords.length, lngSum / coords.length];
}

function getRadiusHandlePosition(center: [number, number], radioMeters: number): [number, number] {
  const [lat, lng] = center;
  // Meters per degree longitude at given latitude
  const metersPerLngDegree = 111320 * Math.cos((lat * Math.PI) / 180);
  const deltaLng = radioMeters / metersPerLngDegree;
  return [lat, lng + deltaLng];
}

function getCircleBounds(centro: [number, number], radioMeters: number): L.LatLngBounds {
  return L.latLng(centro[0], centro[1]).toBounds(radioMeters);
}

// ---------------------------------------------------------------------------
// Custom Leaflet DivIcons
// ---------------------------------------------------------------------------

function createVertexIcon(color: string, index: number): L.DivIcon {
  return L.divIcon({
    className: "leaflet-custom-div-icon",
    html: `
      <div style="width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: grab;">
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #ffffff; border: 2.5px solid ${color}; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; transition: transform 0.15s ease;">
          <div style="width: 4px; height: 4px; border-radius: 50%; background-color: ${color};"></div>
        </div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function createMidpointIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "leaflet-custom-div-icon",
    html: `
      <div style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.95); border: 1.5px solid ${color}; box-shadow: 0 1px 4px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: ${color}; line-height: 1; transition: all 0.15s ease;">
          +
        </div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function createCenterIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "leaflet-custom-div-icon",
    html: `
      <div style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: move;">
        <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #0f172a; border: 2px solid ${color}; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: ${color};">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="5 9 2 12 5 15"></polyline>
            <polyline points="9 5 12 2 15 5"></polyline>
            <polyline points="15 19 12 22 9 19"></polyline>
            <polyline points="19 9 22 12 19 15"></polyline>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="22"></line>
          </svg>
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function createRadiusIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "leaflet-custom-div-icon",
    html: `
      <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: ew-resize;">
        <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #ffffff; border: 2px solid ${color}; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: ${color};">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m18 8 4 4-4 4"></path>
            <path d="M2 12h20"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// ---------------------------------------------------------------------------
// Map Auto Bounds Component
// ---------------------------------------------------------------------------

function MapBounds({
  geofences,
  isListOpen,
  focusedGeofenceId,
  isEditing,
  draftGeofence,
}: {
  geofences: Geofence[];
  isListOpen: boolean;
  focusedGeofenceId: number | null;
  isEditing?: boolean;
  draftGeofence?: GeofenceFormData | null;
}) {
  const map = useMap();

  useEffect(() => {
    // Avoid jarring auto-fits while actively drawing/editing
    if (isEditing) {
      if (focusedGeofenceId && draftGeofence) {
        let bounds: L.LatLngBounds | undefined;
        if (draftGeofence.tipo === "Polígono" && draftGeofence.coordenadas && draftGeofence.coordenadas.length >= 3) {
          bounds = L.latLngBounds(draftGeofence.coordenadas);
        } else if (draftGeofence.tipo === "Círculo" && draftGeofence.centro && draftGeofence.radio) {
          bounds = getCircleBounds(draftGeofence.centro, draftGeofence.radio);
        }
        if (bounds) {
          map.fitBounds(bounds, {
            paddingTopLeft: [isListOpen ? 380 : 50, 50],
            paddingBottomRight: [50, 50],
            maxZoom: 16,
            animate: true,
            duration: 1,
          });
        }
      }
      return;
    }

    if (!geofences || geofences.length === 0) return;

    const timer = setTimeout(() => {
      map.invalidateSize();

      let bounds: L.LatLngBounds | undefined;

      if (focusedGeofenceId) {
        const focused = geofences.find((g) => g.id === focusedGeofenceId);
        if (focused) {
          if (focused.tipo === "Polígono" && focused.coordenadas && focused.coordenadas.length > 0) {
            bounds = L.latLngBounds(focused.coordenadas);
          } else if (focused.tipo === "Círculo" && focused.centro && focused.radio) {
            bounds = getCircleBounds(focused.centro, focused.radio);
          }
        }
      }

      if (!bounds) {
        const allLatLngs: L.LatLngExpression[] = [];
        geofences.forEach((g) => {
          if (g.tipo === "Polígono" && g.coordenadas) {
            allLatLngs.push(...g.coordenadas);
          } else if (g.tipo === "Círculo" && g.centro && g.radio) {
            const circleBounds = getCircleBounds(g.centro, g.radio);
            allLatLngs.push(circleBounds.getNorthWest(), circleBounds.getSouthEast());
          }
        });

        if (allLatLngs.length > 0) {
          bounds = L.latLngBounds(allLatLngs);
        }
      }

      if (bounds) {
        const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
        map.fitBounds(bounds, {
          paddingTopLeft: [isListOpen && !isMobile ? 380 : 50, 50],
          paddingBottomRight: [50, 50],
          maxZoom: 16,
          animate: true,
          duration: 1.2,
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [geofences, map, isListOpen, focusedGeofenceId, isEditing, draftGeofence]);

  return null;
}

// ---------------------------------------------------------------------------
// Interactive Drawing & Cursor Event Handler Sub-component
// ---------------------------------------------------------------------------

function MapDrawingHandler({
  drawingMode,
  setDrawingMode,
  draftGeofence,
  onDraftChange,
  mousePos,
  setMousePos,
}: {
  drawingMode: DrawingMode;
  setDrawingMode?: (mode: DrawingMode) => void;
  draftGeofence?: GeofenceFormData | null;
  onDraftChange?: (draft: GeofenceFormData) => void;
  mousePos: [number, number] | null;
  setMousePos: (pos: [number, number] | null) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (drawingMode === "draw_polygon") {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const coords = draftGeofence?.coordenadas || [];

        // If clicking close to the first point with 3+ vertices, close polygon!
        if (coords.length >= 3) {
          const firstPointPx = map.latLngToContainerPoint(L.latLng(coords[0]));
          const clickPx = map.latLngToContainerPoint(e.latlng);
          if (firstPointPx.distanceTo(clickPx) < 25) {
            setDrawingMode?.("edit_vertices");
            return;
          }
        }

        const newCoords: [number, number][] = [...coords, [lat, lng]];
        onDraftChange?.({
          ...draftGeofence,
          nombre: draftGeofence?.nombre || "Nueva Geocerca",
          tipo: "Polígono",
          color: draftGeofence?.color || "#3b82f6",
          opacidad: draftGeofence?.opacidad ?? 0.25,
          activa: draftGeofence?.activa ?? true,
          targetType: draftGeofence?.targetType || "ALL",
          alertEvents: draftGeofence?.alertEvents || ["EXIT"],
          coordenadas: newCoords,
        });
      } else if (drawingMode === "draw_circle") {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const defaultRadius = draftGeofence?.radio || 300;

        onDraftChange?.({
          ...draftGeofence,
          nombre: draftGeofence?.nombre || "Nueva Geocerca Circular",
          tipo: "Círculo",
          color: draftGeofence?.color || "#10b981",
          opacidad: draftGeofence?.opacidad ?? 0.25,
          activa: draftGeofence?.activa ?? true,
          targetType: draftGeofence?.targetType || "ALL",
          alertEvents: draftGeofence?.alertEvents || ["EXIT"],
          centro: [lat, lng],
          radio: defaultRadius,
        });

        // Move directly to vertex/radius editing
        setDrawingMode?.("edit_vertices");
      }
    },
    mousemove(e) {
      if (drawingMode === "draw_polygon") {
        setMousePos([e.latlng.lat, e.latlng.lng]);
      } else if (mousePos !== null) {
        setMousePos(null);
      }
    },
    dblclick(e) {
      if (drawingMode === "draw_polygon") {
        const coords = draftGeofence?.coordenadas || [];
        if (coords.length >= 3) {
          L.DomEvent.stopPropagation(e);
          setDrawingMode?.("edit_vertices");
        }
      }
    },
  });

  return null;
}

// ---------------------------------------------------------------------------
// Main GeofenceMap Component
// ---------------------------------------------------------------------------

export default function GeofenceMap({
  geofences = [],
  isListOpen = true,
  focusedGeofenceId = null,
  setFocusedGeofenceId,
  isEditing = false,
  draftGeofence = null,
  onDraftChange,
  drawingMode = "none",
  setDrawingMode,
  onSelectGeofence,
}: GeofenceMapProps) {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handlers for Toolbar actions
  const handleUndoPoint = useCallback(() => {
    if (!draftGeofence?.coordenadas || draftGeofence.coordenadas.length === 0) return;
    const newCoords = draftGeofence.coordenadas.slice(0, -1);
    onDraftChange?.({
      ...draftGeofence,
      coordenadas: newCoords,
    });
  }, [draftGeofence, onDraftChange]);

  const handleClear = useCallback(() => {
    if (!draftGeofence) return;
    onDraftChange?.({
      ...draftGeofence,
      coordenadas: [],
      centro: undefined,
      radio: 300,
    });
  }, [draftGeofence, onDraftChange]);

  // Polygon centroid translation
  const polygonCentroid = useMemo(() => {
    if (draftGeofence?.tipo === "Polígono" && draftGeofence?.coordenadas && draftGeofence.coordenadas.length > 0) {
      return getPolygonCentroid(draftGeofence.coordenadas);
    }
    return null;
  }, [draftGeofence]);

  const draftColor = draftGeofence?.color || "#3b82f6";
  const draftOpacity = draftGeofence?.opacidad ?? 0.3;

  if (!mounted) return null;

  const currentMode = drawingMode;

  return (
    <div className="h-full w-full relative select-none">
      {/* Embedded CSS for custom leaflet div icons */}
      <style>{`
        .leaflet-custom-div-icon {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* Floating Glassmorphism Map Toolbar */}
      {(isEditing || drawingMode !== "none") && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[450] flex flex-col items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1 bg-background/95 dark:bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-1.5 transition-all">
            {/* Polygon Tool */}
            <button
              type="button"
              onClick={() => {
                setDrawingMode?.("draw_polygon");
                if (draftGeofence && draftGeofence.tipo !== "Polígono") {
                  onDraftChange?.({
                    ...draftGeofence,
                    tipo: "Polígono",
                    coordenadas: [],
                  });
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentMode === "draw_polygon"
                  ? "bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Dibujar Polígono"
            >
              <Square className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Polígono</span>
            </button>

            {/* Circle Tool */}
            <button
              type="button"
              onClick={() => {
                setDrawingMode?.("draw_circle");
                if (draftGeofence && draftGeofence.tipo !== "Círculo") {
                  onDraftChange?.({
                    ...draftGeofence,
                    tipo: "Círculo",
                    centro: undefined,
                    radio: 300,
                  });
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentMode === "draw_circle"
                  ? "bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Dibujar Círculo"
            >
              <CircleIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Círculo</span>
            </button>

            {/* Edit Vertices Tool */}
            <button
              type="button"
              onClick={() => setDrawingMode?.("edit_vertices")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentMode === "edit_vertices"
                  ? "bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Editar Vértices"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </button>

            {/* Pan / Navigate Tool */}
            <button
              type="button"
              onClick={() => setDrawingMode?.("none")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentMode === "none"
                  ? "bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Navegar Mapa"
            >
              <Hand className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Navegar</span>
            </button>

            <div className="h-5 w-[1px] bg-border mx-0.5" />

            {/* Undo point button */}
            <button
              type="button"
              onClick={handleUndoPoint}
              disabled={!draftGeofence?.coordenadas || draftGeofence.coordenadas.length === 0}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Deshacer último punto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Clear button */}
            <button
              type="button"
              onClick={handleClear}
              disabled={
                (!draftGeofence?.coordenadas || draftGeofence.coordenadas.length === 0) && !draftGeofence?.centro
              }
              className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Limpiar trazo"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Dynamic contextual guidance badge */}
          <div className="bg-slate-950/85 backdrop-blur-md text-slate-200 border border-slate-800 text-[11px] font-medium px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
            <Info className="h-3 w-3 text-amber-400 shrink-0" />
            {currentMode === "draw_polygon" && (
              <span>
                {draftGeofence?.coordenadas && draftGeofence.coordenadas.length >= 3
                  ? "Click en el primer punto o doble click para cerrar el polígono"
                  : "Click en el mapa para añadir vértices del polígono"}
              </span>
            )}
            {currentMode === "draw_circle" && <span>Click en el mapa para posicionar el centro del círculo</span>}
            {currentMode === "edit_vertices" && draftGeofence?.tipo === "Polígono" && (
              <span>Arrastrá los vértices o el centro • Click en (+) para insertar vértice</span>
            )}
            {currentMode === "edit_vertices" && draftGeofence?.tipo === "Círculo" && (
              <span>Arrastrá el centro para mover • Arrastrá el borde este para regular el radio</span>
            )}
            {currentMode === "none" && <span>Modo navegación libre del mapa</span>}
          </div>
        </div>
      )}

      {/* Leaflet Map Container */}
      <MapContainer
        center={[-38.7183, -62.2663]}
        zoom={13}
        scrollWheelZoom={true}
        doubleClickZoom={drawingMode === "none"}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />

        {/* Map Viewport auto-fit */}
        <MapBounds
          geofences={geofences}
          isListOpen={isListOpen}
          focusedGeofenceId={focusedGeofenceId}
          isEditing={isEditing}
          draftGeofence={draftGeofence}
        />

        {/* Drawing & Mouse Listeners */}
        <MapDrawingHandler
          drawingMode={drawingMode}
          setDrawingMode={setDrawingMode}
          draftGeofence={draftGeofence}
          onDraftChange={onDraftChange}
          mousePos={mousePos}
          setMousePos={setMousePos}
        />

        {/* ================================================================= */}
        {/* DRAFT GEOFENCE RENDERING & INTERACTIVE VERTEX EDITING */}
        {/* ================================================================= */}
        {isEditing && draftGeofence && (
          <>
            {/* --- Polygon Draft Mode --- */}
            {draftGeofence.tipo === "Polígono" && draftGeofence.coordenadas && (
              <>
                {/* Active Polygon Surface */}
                {draftGeofence.coordenadas.length >= 3 && (
                  <Polygon
                    positions={draftGeofence.coordenadas}
                    pathOptions={{
                      color: draftColor,
                      fillColor: draftColor,
                      fillOpacity: draftOpacity,
                      weight: 3,
                      dashArray: drawingMode === "draw_polygon" ? "6, 6" : undefined,
                    }}
                  />
                )}

                {/* Incomplete Polygon Polyline while drawing */}
                {draftGeofence.coordenadas.length >= 2 && draftGeofence.coordenadas.length < 3 && (
                  <Polyline
                    positions={draftGeofence.coordenadas}
                    pathOptions={{ color: draftColor, weight: 3, dashArray: "4, 4" }}
                  />
                )}

                {/* Live dashed cursor preview guide */}
                {drawingMode === "draw_polygon" &&
                  mousePos &&
                  draftGeofence.coordenadas.length > 0 && (
                    <>
                      <Polyline
                        positions={[
                          draftGeofence.coordenadas[draftGeofence.coordenadas.length - 1],
                          mousePos,
                        ]}
                        pathOptions={{ color: draftColor, weight: 2, dashArray: "5, 5", opacity: 0.8 }}
                      />
                      {draftGeofence.coordenadas.length >= 2 && (
                        <Polyline
                          positions={[mousePos, draftGeofence.coordenadas[0]]}
                          pathOptions={{ color: draftColor, weight: 1.5, dashArray: "3, 6", opacity: 0.5 }}
                        />
                      )}
                    </>
                  )}

                {/* Draggable Polygon Vertices */}
                {draftGeofence.coordenadas.map((coord, idx) => (
                  <Marker
                    key={`vertex-${idx}-${draftGeofence.coordenadas?.length}`}
                    position={coord}
                    draggable={drawingMode === "edit_vertices" || drawingMode === "draw_polygon"}
                    icon={createVertexIcon(draftColor, idx)}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const pos = marker.getLatLng();
                        const newCoords = [...(draftGeofence.coordenadas || [])];
                        newCoords[idx] = [pos.lat, pos.lng];
                        onDraftChange?.({
                          ...draftGeofence,
                          coordenadas: newCoords,
                        });
                      },
                      contextmenu: (e) => {
                        L.DomEvent.stopPropagation(e);
                        const coords = draftGeofence.coordenadas || [];
                        if (coords.length > 3) {
                          const newCoords = coords.filter((_, i) => i !== idx);
                          onDraftChange?.({
                            ...draftGeofence,
                            coordenadas: newCoords,
                          });
                        }
                      },
                    }}
                  />
                ))}

                {/* Ghost Midpoint Handles (+) to insert vertices */}
                {drawingMode === "edit_vertices" &&
                  draftGeofence.coordenadas.length >= 3 &&
                  draftGeofence.coordenadas.map((coord, idx) => {
                    const coords = draftGeofence.coordenadas!;
                    const nextCoord = coords[(idx + 1) % coords.length];
                    const midLat = (coord[0] + nextCoord[0]) / 2;
                    const midLng = (coord[1] + nextCoord[1]) / 2;
                    const midPos: [number, number] = [midLat, midLng];

                    return (
                      <Marker
                        key={`midpoint-${idx}`}
                        position={midPos}
                        draggable={true}
                        icon={createMidpointIcon(draftColor)}
                        eventHandlers={{
                          click: (e) => {
                            L.DomEvent.stopPropagation(e);
                            const newCoords = [...coords];
                            newCoords.splice(idx + 1, 0, midPos);
                            onDraftChange?.({
                              ...draftGeofence,
                              coordenadas: newCoords,
                            });
                          },
                          dragend: (e) => {
                            const marker = e.target;
                            const pos = marker.getLatLng();
                            const newCoords = [...coords];
                            newCoords.splice(idx + 1, 0, [pos.lat, pos.lng]);
                            onDraftChange?.({
                              ...draftGeofence,
                              coordenadas: newCoords,
                            });
                          },
                        }}
                      />
                    );
                  })}

                {/* Draggable Polygon Centroid Translation Handle */}
                {drawingMode === "edit_vertices" &&
                  polygonCentroid &&
                  draftGeofence.coordenadas.length >= 3 && (
                    <Marker
                      position={polygonCentroid}
                      draggable={true}
                      icon={createCenterIcon(draftColor)}
                      eventHandlers={{
                        dragend: (e) => {
                          const marker = e.target;
                          const pos = marker.getLatLng();
                          const deltaLat = pos.lat - polygonCentroid[0];
                          const deltaLng = pos.lng - polygonCentroid[1];
                          const newCoords = (draftGeofence.coordenadas || []).map(
                            ([lat, lng]) => [lat + deltaLat, lng + deltaLng] as [number, number]
                          );
                          onDraftChange?.({
                            ...draftGeofence,
                            coordenadas: newCoords,
                          });
                        },
                      }}
                    />
                  )}
              </>
            )}

            {/* --- Circle Draft Mode --- */}
            {draftGeofence.tipo === "Círculo" && draftGeofence.centro && draftGeofence.radio && (
              <>
                {/* Active Circle Surface */}
                <Circle
                  center={draftGeofence.centro}
                  radius={draftGeofence.radio}
                  pathOptions={{
                    color: draftColor,
                    fillColor: draftColor,
                    fillOpacity: draftOpacity,
                    weight: 3,
                  }}
                />

                {/* Center Translation Handle */}
                <Marker
                  position={draftGeofence.centro}
                  draggable={drawingMode === "edit_vertices" || drawingMode === "draw_circle"}
                  icon={createCenterIcon(draftColor)}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const pos = marker.getLatLng();
                      onDraftChange?.({
                        ...draftGeofence,
                        centro: [pos.lat, pos.lng],
                      });
                    },
                  }}
                />

                {/* Radius Resizing Handle */}
                <Marker
                  position={getRadiusHandlePosition(draftGeofence.centro, draftGeofence.radio)}
                  draggable={drawingMode === "edit_vertices" || drawingMode === "draw_circle"}
                  icon={createRadiusIcon(draftColor)}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const pos = marker.getLatLng();
                      const centerLatLng = L.latLng(draftGeofence.centro![0], draftGeofence.centro![1]);
                      const newDistance = centerLatLng.distanceTo(pos);
                      onDraftChange?.({
                        ...draftGeofence,
                        radio: Math.max(10, Math.round(newDistance)),
                      });
                    },
                  }}
                />
              </>
            )}
          </>
        )}

        {/* ================================================================= */}
        {/* NON-EDITING GEOFENCES RENDERING */}
        {/* ================================================================= */}
        {geofences.map((g) => {
          // If currently editing this exact geofence, render only the interactive draft version
          if (isEditing && draftGeofence?.id === g.id) {
            return null;
          }

          const isFocused = focusedGeofenceId === g.id;
          const baseOpacity = g.opacidad ?? 0.25;
          const fillOpacity = isFocused ? Math.min(0.7, baseOpacity + 0.25) : baseOpacity;
          const weight = isFocused ? 3.5 : 2;

          const eventHandlers = {
            click: () => {
              setFocusedGeofenceId?.(g.id);
              onSelectGeofence?.(g.id);
            },
          };

          const popupContent = (
            <Popup className="custom-geofence-popup" closeButton={false}>
              <div className="p-1 min-w-[200px] text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="truncate">{g.nombre}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      g.activa ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-600"
                    }`}
                  >
                    {g.activa ? "Activa" : "Inactiva"}
                  </span>
                </div>

                {g.descripcion && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{g.descripcion}</p>
                )}

                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1.5 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Tipo:
                    </span>
                    <span className="font-semibold">{g.tipo}</span>
                  </div>
                  {g.targetType && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Asignación:
                      </span>
                      <span className="font-semibold">
                        {g.targetType === "ALL"
                          ? "Toda la flota"
                          : g.targetVehicles?.length
                          ? `${g.targetVehicles.length} vehículos`
                          : g.targetType}
                      </span>
                    </div>
                  )}
                  {g.speedLimit && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Gauge className="h-3 w-3" /> Límite:
                      </span>
                      <span className="font-semibold text-amber-600">{g.speedLimit} km/h</span>
                    </div>
                  )}
                </div>

                <div className="mt-2.5 pt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFocusedGeofenceId?.(g.id);
                      onSelectGeofence?.(g.id);
                    }}
                    className="text-xs font-semibold px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors"
                  >
                    Centrar
                  </button>
                </div>
              </div>
            </Popup>
          );

          if (g.tipo === "Polígono" && g.coordenadas && g.coordenadas.length > 0) {
            return (
              <Polygon
                key={g.id}
                positions={g.coordenadas}
                pathOptions={{
                  color: g.color,
                  fillColor: g.color,
                  fillOpacity,
                  weight,
                  dashArray: isFocused ? "4, 4" : undefined,
                }}
                eventHandlers={eventHandlers}
              >
                {popupContent}
              </Polygon>
            );
          } else if (g.tipo === "Círculo" && g.centro && g.radio) {
            return (
              <Circle
                key={g.id}
                center={g.centro}
                radius={g.radio}
                pathOptions={{
                  color: g.color,
                  fillColor: g.color,
                  fillOpacity,
                  weight,
                  dashArray: isFocused ? "4, 4" : undefined,
                }}
                eventHandlers={eventHandlers}
              >
                {popupContent}
              </Circle>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
}
