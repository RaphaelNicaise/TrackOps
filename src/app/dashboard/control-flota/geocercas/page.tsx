"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Map, PanelLeftClose, PanelLeftOpen, Plus, MapPin, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Geofence } from "@/components/map/GeofenceMap";

const GeofenceMap = dynamic(() => import("@/components/map/GeofenceMap"), {
  ssr: false,
});

const mockGeofences: Geofence[] = [
  {
    id: 1,
    nombre: "Base Operativa Central",
    tipo: "Polígono",
    color: "#3b82f6", // blue
    activa: true,
    coordenadas: [
      [-38.7180, -62.2660],
      [-38.7180, -62.2600],
      [-38.7230, -62.2600],
      [-38.7230, -62.2660]
    ]
  },
  {
    id: 2,
    nombre: "Zona de Carga Sur",
    tipo: "Círculo",
    color: "#10b981", // emerald
    activa: true,
    centro: [-38.7300, -62.2800],
    radio: 800
  },
  {
    id: 3,
    nombre: "Taller Mecánico",
    tipo: "Polígono",
    color: "#f59e0b", // amber
    activa: false,
    coordenadas: [
      [-38.7100, -62.2500],
      [-38.7100, -62.2450],
      [-38.7130, -62.2450],
      [-38.7130, -62.2500]
    ]
  }
];

export default function GeocercasPage() {
  const [isListOpen, setIsListOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [focusedGeofenceId, setFocusedGeofenceId] = useState<number | null>(null);

  const filteredGeofences = useMemo(() => {
    return mockGeofences.filter((g) => {
      return g.nombre.toLowerCase().includes(search.toLowerCase());
    });
  }, [search]);

  // Reset focus if search changes and focused item is filtered out
  useEffect(() => {
    if (focusedGeofenceId && !filteredGeofences.find(g => g.id === focusedGeofenceId)) {
      setFocusedGeofenceId(null);
    }
  }, [search, filteredGeofences, focusedGeofenceId]);

  return (
    <div className="absolute inset-0 flex">
      {/* Absolute Map Background */}
      <div className="absolute inset-0 z-0">
        <GeofenceMap 
          geofences={filteredGeofences} 
          isListOpen={isListOpen} 
          focusedGeofenceId={focusedGeofenceId} 
          setFocusedGeofenceId={setFocusedGeofenceId} 
        />
      </div>

      {/* Floating Toggle Button (if closed) */}
      {!isListOpen && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 z-20 shadow-md bg-background border rounded-full h-12 w-12 transition-all hover:scale-105 [&>svg]:!size-6"
          onClick={() => setIsListOpen(true)}
        >
          <PanelLeftOpen />
        </Button>
      )}

      {/* Collapsible Sidebar */}
      <div
        className={`relative z-10 bg-background/95 backdrop-blur-xl border-r border-border shadow-2xl transition-transform duration-300 ease-in-out flex flex-col h-full w-[360px] ${
          isListOpen ? "translate-x-0" : "-translate-x-full absolute"
        }`}
      >
        {/* Header & Controls */}
        <div className="p-5 border-b border-border/50 flex flex-col gap-4 bg-background shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Geocercas
              <div className="flex items-center text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm ml-1.5 translate-y-[1px]">
                {mockGeofences.length} Total
              </div>
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full text-muted-foreground hover:bg-muted transition-colors [&>svg]:!size-6"
              onClick={() => setIsListOpen(false)}
            >
              <PanelLeftClose />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar geocerca..."
                className="pl-9 bg-card border-muted-foreground/20 h-9 text-sm focus-visible:ring-1 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Button className="h-9 shrink-0 gap-1.5 px-3">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
        </div>

        {/* Geofence List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
          {filteredGeofences.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground mt-10">
              No se encontraron geocercas.
            </div>
          ) : (
            filteredGeofences.map((g) => (
              <div
                key={g.id}
                onClick={() => {
                  setFocusedGeofenceId(g.id);
                  if (window.innerWidth < 768) {
                    setIsListOpen(false);
                  }
                }}
                className={`group relative p-3.5 bg-card/80 backdrop-blur-sm border rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                  focusedGeofenceId === g.id ? "border-primary shadow-md ring-1 ring-primary/30" : "hover:border-primary/40"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center shrink-0 w-3 h-3 ml-1">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 shadow-sm" style={{ backgroundColor: g.color }}></span>
                    </div>
                    <div>
                      <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                        {g.nombre}
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{g.tipo}</div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center text-[10px] px-2 py-1 rounded-md border font-semibold tracking-wide shadow-sm shrink-0 ${
                    g.activa ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                  }`}>
                    {g.activa ? "Activa" : "Inactiva"}
                  </div>
                </div>

                <div className="flex items-center justify-end mt-3 pt-3 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
