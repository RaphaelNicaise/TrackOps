"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Car, Truck, PanelLeftClose, PanelLeftOpen, Activity, Pause, Navigation, Clock, Wifi, Filter, ChevronDown, ChevronRight, Gauge, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockVehiculos } from "@/lib/mock-vehicles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FleetMap = dynamic(() => import("@/components/map/FleetMap"), {
  ssr: false,
});

type VehicleType = 'Auto' | 'Camioneta' | 'Utilitario' | 'Camión';

const getStateColor = (estado: string) => {
  switch (estado) {
    case 'En movimiento': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'Ralentí': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'Detenido': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  }
};

const getStateIcon = (estado: string) => {
  switch (estado) {
    case 'En movimiento': return <Navigation className="w-3 h-3 mr-1" />;
    case 'Ralentí': return <Activity className="w-3 h-3 mr-1" />;
    case 'Detenido': return <Pause className="w-3 h-3 mr-1" />;
  }
};

export default function MapaPage() {
  const [isListOpen, setIsListOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<VehicleType | "Todos">("Todos");
  const [focusedVehicleId, setFocusedVehicleId] = useState<number | null>(null);

  const filteredVehiculos = useMemo(() => {
    return mockVehiculos.filter((v) => {
      const matchesSearch = v.patente.toLowerCase().includes(search.toLowerCase()) || v.tipo.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "Todos" || v.tipo === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter]);

  // Reset focused vehicle if filters change
  useEffect(() => {
    setFocusedVehicleId(null);
  }, [search, typeFilter]);

  return (
    <div className="absolute inset-0 flex">
      {/* Absolute Map Background */}
      <div className="absolute inset-0 z-0">
        <FleetMap 
          vehiculos={filteredVehiculos} 
          isListOpen={isListOpen} 
          focusedVehicleId={focusedVehicleId} 
          setFocusedVehicleId={setFocusedVehicleId} 
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
              <Truck className="h-5 w-5 text-primary" />
              Estado de Flota
              <div className="flex items-center text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm ml-1.5 translate-y-[1px]">
                <Wifi className="h-3 w-3 mr-1" />
                {mockVehiculos.length}/{mockVehiculos.length} Online
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
                placeholder="Buscar patente o tipo..."
                className="pl-9 bg-card border-muted-foreground/20 h-9 text-sm focus-visible:ring-1 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 shrink-0 gap-2 px-3 bg-card text-sm font-medium border-muted-foreground/20">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  {typeFilter}
                  <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                {['Todos', 'Auto', 'Camioneta', 'Utilitario', 'Camión'].map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => setTypeFilter(type as any)}
                    className={`cursor-pointer ${typeFilter === type ? 'bg-primary/10 font-bold text-primary' : ''}`}
                  >
                    {type}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Vehicle List - Continuous Flush List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60 border-t border-border/40 scroll-smooth">
          {filteredVehiculos.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-6">
              No se encontraron vehículos.
            </div>
          ) : (
            filteredVehiculos.map((v) => (
              <div
                key={v.id}
                onClick={() => {
                  setFocusedVehicleId(v.id);
                  if (window.innerWidth < 768) {
                    setIsListOpen(false);
                  }
                }}
                className={`group relative w-full px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 border-l-4 text-left ${
                  focusedVehicleId === v.id
                    ? "border-l-amber-500 bg-amber-500/[0.08]"
                    : "border-l-transparent hover:border-l-amber-500 hover:bg-amber-500/[0.04]"
                }`}
              >
                <div className="flex-1 min-w-0 pr-3">
                  {/* Top Row: Online status dot + Plate + Alert + Vehicle Type */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex items-center justify-center shrink-0 w-2.5 h-2.5">
                      {v.online ? (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/30"></span>
                      )}
                    </div>
                    <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5 truncate">
                      {v.patente}
                      {v.hasAlert && (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive animate-pulse shrink-0" />
                      )}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider ml-auto shrink-0">
                      {v.tipo}
                    </span>
                  </div>

                  {/* Bottom Row: State Badge + Speed + Last Update */}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className={`flex items-center text-[10px] px-2 py-0.5 rounded border font-semibold tracking-wide shrink-0 ${getStateColor(v.estado)}`}>
                      {getStateIcon(v.estado)}
                      {v.estado}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground ml-auto">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Gauge className="w-3 h-3 text-muted-foreground" />
                        {v.velocidad}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] opacity-70">
                        <Clock className="w-3 h-3" />
                        {v.ultimaActualizacion}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Arrow / Chevron */}
                <div className="shrink-0 pl-1">
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 transition-all duration-200 group-hover:text-amber-500 group-hover:translate-x-0.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
