"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search,
  Car,
  Truck,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  Pause,
  Navigation,
  Clock,
  Wifi,
  Filter,
  ChevronDown,
  ChevronRight,
  Gauge,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Shield,
  MapPin,
  Radio,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { MockVehiculo } from "@/lib/mock-vehicles";
import { Geofence } from "@/types/geofence";
import type { SitioRow } from "@/types/flota-viajes";
import { simulationEngine, type SimulatedAlert } from "@/lib/fleet-simulation";
import { appAlert } from "@/lib/alerts";
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

type MapVehicle = Omit<MockVehiculo, "lat" | "lng"> & { lat: number | null; lng: number | null };

const TIPO_LABELS: Record<string, string> = {
  auto: "Auto",
  camioneta: "Camioneta",
  utilitario: "Utilitario",
  camion: "Camión",
};

function normalizeVehicle(raw: any): MapVehicle {
  const tipoLabel = TIPO_LABELS[String(raw?.tipo ?? "").toLowerCase()];
  return {
    ...raw,
    tipo: tipoLabel ?? (raw?.tipo as string) ?? "Auto",
    estado: raw?.estado ?? "Sin señal",
    velocidad: raw?.velocidad ?? "—",
    ultimaActualizacion: raw?.ultimaActualizacion ?? "Sin datos",
    online: raw?.online ?? false,
    hasAlert: raw?.hasAlert ?? false,
    lat: typeof raw?.lat === "number" ? raw.lat : null,
    lng: typeof raw?.lng === "number" ? raw.lng : null,
  };
}

const getStateColor = (estado: string) => {
  switch (estado) {
    case 'En movimiento': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'Ralentí': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Detenido': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getStateIcon = (estado: string) => {
  switch (estado) {
    case 'En movimiento': return <Navigation className="w-3 h-3 mr-1" />;
    case 'Ralentí': return <Activity className="w-3 h-3 mr-1" />;
    case 'Detenido': return <Pause className="w-3 h-3 mr-1" />;
    default: return null;
  }
};

export function MapaView({
  initialVehicles,
}: {
  initialVehicles?: MockVehiculo[];
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isListOpen, setIsListOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<VehicleType | "Todos">("Todos");
  const [focusedVehicleId, setFocusedVehicleId] = useState<number | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [showGeofences, setShowGeofences] = useState(true);
  const [sitios, setSitios] = useState<SitioRow[]>([]);
  const [showSitios, setShowSitios] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vehicles, setVehicles] = useState<MapVehicle[]>(() =>
    (initialVehicles ?? []).map(normalizeVehicle)
  );
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [activeSimAlert, setActiveSimAlert] = useState<SimulatedAlert | null>(null);

  // Sync with Simulation Engine on mount & listen to live ticks
  useEffect(() => {
    setIsSimRunning(simulationEngine.getIsRunning());

    if (typeof window !== "undefined" && localStorage.getItem("trackops_sim_active") === "true") {
      if (!simulationEngine.getIsRunning()) {
        simulationEngine.start();
        setIsSimRunning(true);
      }
    }

    const handleVehiclesUpdated = (e: any) => {
      if (e.detail?.vehicles && Array.isArray(e.detail.vehicles)) {
        setVehicles(e.detail.vehicles.map(normalizeVehicle));
      }
    };

    const handleSimulationState = (e: any) => {
      if (e.detail) {
        setIsSimRunning(e.detail.isRunning);
      }
    };

    const handleSimAlert = (e: any) => {
      if (e.detail?.alert) {
        const alert: SimulatedAlert = e.detail.alert;
        setActiveSimAlert(alert);
        setTimeout(() => {
          setActiveSimAlert((current) => (current?.id === alert.id ? null : current));
        }, 5500);
      }
    };

    window.addEventListener("trackops:vehicles-updated", handleVehiclesUpdated);
    window.addEventListener("trackops:simulation-state-change", handleSimulationState);
    window.addEventListener("trackops:simulation-alert", handleSimAlert);

    return () => {
      window.removeEventListener("trackops:vehicles-updated", handleVehiclesUpdated);
      window.removeEventListener("trackops:simulation-state-change", handleSimulationState);
      window.removeEventListener("trackops:simulation-alert", handleSimAlert);
    };
  }, []);

  // Fetch real fleet from DB on mount (la cuenta demo recibe su flota simulada)
  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setVehicles(data.map(normalizeVehicle));
        }
      })
      .catch((err) => console.error("Error fetching vehicles:", err));
  }, []);

  // Fetch real geofences from DB on mount
  useEffect(() => {
    fetch("/api/geofences")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setGeofences(data);
          simulationEngine.setGeofences(data);
        }
      })
      .catch((err) => console.error("Error fetching geofences:", err));
  }, []);

  // Fetch sitios from DB on mount
  useEffect(() => {
    fetch("/api/sitios")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setSitios(data);
        }
      })
      .catch((err) => console.error("Error fetching sitios:", err));
  }, []);

  // Listen to fullscreen changes (e.g. Esc key pressed)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (mapContainerRef.current?.requestFullscreen) {
        mapContainerRef.current.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request error:", err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn("Fullscreen exit error:", err);
        });
      }
    }
  };

  const filteredVehiculos = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch = v.patente.toLowerCase().includes(search.toLowerCase()) || v.tipo.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "Todos" || v.tipo === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [vehicles, search, typeFilter]);

  // Solo vehículos con posición conocida se dibujan en el mapa
  const locatedVehiculos = useMemo(
    () =>
      filteredVehiculos.filter(
        (v): v is MockVehiculo & { lat: number; lng: number } =>
          v.lat !== null && v.lng !== null
      ),
    [filteredVehiculos]
  );

  const onlineCount = useMemo(() => vehicles.filter((v) => v.online).length, [vehicles]);

  // Reset focused vehicle if filters change
  useEffect(() => {
    setFocusedVehicleId(null);
  }, [search, typeFilter]);

  return (
    <div ref={mapContainerRef} className="absolute inset-0 flex bg-background">
      {/* Absolute Map Background */}
      <div className="absolute inset-0 z-0">
        <FleetMap
          vehiculos={locatedVehiculos}
          geofences={geofences}
          showGeofences={showGeofences}
          sitios={sitios}
          showSitios={showSitios}
          isListOpen={isListOpen} 
          focusedVehicleId={focusedVehicleId} 
          setFocusedVehicleId={setFocusedVehicleId} 
          isFullscreen={isFullscreen}
        />
      </div>

      {/* Top Right Controls: Fullscreen, Geocercas, Sitios & Simulación */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-center gap-2">
        {/* Toggle Live Fleet Simulation Button */}
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-xl shadow-lg transition-all backdrop-blur-md select-none hover:scale-105 ${
            isSimRunning
              ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-500 ring-2 ring-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-background/95 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          onClick={() => {
            simulationEngine.toggle();
            const nextState = !isSimRunning;
            if (nextState) {
              appAlert.success("Simulación de telemetría en vivo iniciada (Bahía Blanca)");
            } else {
              appAlert.info("Simulación de movimiento pausada");
            }
          }}
          title={isSimRunning ? "Pausar simulación en vivo (Bahía Blanca)" : "Iniciar simulación de telemetría en vivo (Bahía Blanca)"}
        >
          <Radio
            className={`w-4 h-4 transition-transform ${
              isSimRunning ? "animate-pulse text-emerald-500" : ""
            }`}
          />
        </Button>

        {/* Fullscreen Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl shadow-lg transition-all bg-background/95 backdrop-blur-md border-border hover:bg-muted hover:scale-105 text-foreground select-none"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Salir de pantalla completa (Esc)" : "Pantalla completa"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>

        {/* Toggle Geofences Shield Button */}
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-xl shadow-lg transition-all backdrop-blur-md select-none hover:scale-105 ${
            showGeofences
              ? "bg-background/95 border-amber-500/50 text-amber-500 ring-1 ring-amber-500/25 hover:bg-amber-500/10"
              : "bg-background/90 border-border text-muted-foreground/60 hover:text-foreground hover:bg-muted"
          }`}
          onClick={() => setShowGeofences((prev) => !prev)}
          title={showGeofences ? "Ocultar geocercas en el mapa" : "Mostrar geocercas en el mapa"}
        >
          <Shield
            className={`w-4 h-4 transition-colors ${
              showGeofences ? "text-amber-500 fill-amber-500/20" : "text-muted-foreground"
            }`}
          />
        </Button>

        {/* Toggle Sitios Button */}
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 rounded-xl shadow-lg transition-all backdrop-blur-md select-none hover:scale-105 ${
            showSitios
              ? "bg-background/95 border-blue-500/50 text-blue-500 ring-1 ring-blue-500/25 hover:bg-blue-500/10"
              : "bg-background/90 border-border text-muted-foreground/60 hover:text-foreground hover:bg-muted"
          }`}
          onClick={() => setShowSitios((prev) => !prev)}
          title={showSitios ? "Ocultar sitios de interés en el mapa" : "Mostrar sitios de interés en el mapa"}
        >
          <MapPin
            className={`w-4 h-4 transition-colors ${
              showSitios ? "text-blue-500 fill-blue-500/20" : "text-muted-foreground"
            }`}
          />
        </Button>
      </div>

      {/* Live Simulation Floating Alert Banner */}
      {activeSimAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-3 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3 ${
              activeSimAlert.severidad === "CRITICA" || activeSimAlert.severidad === "ALTA"
                ? "bg-destructive/90 border-destructive/80 text-destructive-foreground shadow-destructive/20"
                : activeSimAlert.tipo === "SPEED_LIMIT"
                ? "bg-amber-600/90 border-amber-500/80 text-white shadow-amber-500/20"
                : "bg-blue-600/90 border-blue-500/80 text-white shadow-blue-500/20"
            }`}
          >
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs tracking-tight truncate">{activeSimAlert.titulo}</span>
                <span className="text-[10px] font-mono opacity-80 shrink-0">
                  {activeSimAlert.timestamp.toLocaleTimeString("es-AR")}
                </span>
              </div>
              <p className="text-[11px] mt-0.5 opacity-90 line-clamp-2">
                {activeSimAlert.mensaje}
              </p>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm ml-1.5 translate-y-[1px]">
                <Wifi className="h-3 w-3 mr-1" />
                {onlineCount}/{vehicles.length} Online
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
        <div className="flex-1 overflow-y-auto border-t border-border/40 scroll-smooth">
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
                className={`group relative w-full px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 border-b border-border/60 text-left ${
                  focusedVehicleId === v.id
                    ? "bg-amber-500/[0.08]"
                    : "hover:bg-amber-500/[0.04]"
                }`}
              >
                {/* Left amber indicator bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 ${
                    focusedVehicleId === v.id
                      ? "bg-[#F2B705] opacity-100"
                      : "bg-[#F2B705] opacity-0 group-hover:opacity-100"
                  }`}
                />

                <div className="flex-1 min-w-0 pr-3 pl-1">
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
                        <Link
                          href={`/panel/monitoreo/alertas?patente=${encodeURIComponent(v.patente)}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Ver alertas de este vehículo"
                          className="hover:scale-110 transition-transform cursor-pointer"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive animate-pulse shrink-0" />
                        </Link>
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
