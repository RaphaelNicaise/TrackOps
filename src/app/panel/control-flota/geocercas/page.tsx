"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Filter,
  Shield,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Geofence, GeofenceFormData, DrawingMode } from "@/types/geofence";
import type { MockVehiculo } from "@/lib/mock-vehicles";
import { GeofenceCard } from "@/components/geofences/GeofenceCard";
import { GeofenceForm } from "@/components/geofences/GeofenceForm";

// Dynamically import Leaflet Map to avoid SSR window errors
const GeofenceMap = dynamic(() => import("@/components/map/GeofenceMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-900 flex items-center justify-center text-slate-400">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Cargando mapa interactivo...</span>
      </div>
    </div>
  ),
});

type PageMode = "list" | "create" | "edit";
type TypeFilter = "Todos" | "Polígono" | "Círculo" | "Activas" | "Inactivas";

export default function GeocercasPage() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<MockVehiculo[]>([]);
  const [mode, setMode] = useState<PageMode>("list");
  const [isListOpen, setIsListOpen] = useState(true);
  const [focusedGeofenceId, setFocusedGeofenceId] = useState<number | null>(null);

  // Form & Map Drawing State
  const [draftGeofence, setDraftGeofence] = useState<GeofenceFormData | null>(null);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("none");
  const [isSaving, setIsSaving] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("Todos");

  // Fetch geofences from API on mount
  const fetchGeofences = useCallback(async () => {
    try {
      const res = await fetch("/api/geofences");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGeofences(data);
          return;
        }
      }
    } catch (error) {
      console.error("Could not fetch geofences from API:", error);
    }
  }, []);

  // Fetch real fleet for the assigner
  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch("/api/vehicles");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAvailableVehicles(data);
        }
      }
    } catch (error) {
      console.warn("Could not fetch vehicles from API:", error);
    }
  }, []);

  useEffect(() => {
    fetchGeofences();
    fetchVehicles();
  }, [fetchGeofences, fetchVehicles]);

  // Filtered geofences list
  const filteredGeofences = useMemo(() => {
    return geofences.filter((g) => {
      const matchesSearch =
        search.trim() === "" ||
        g.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (g.descripcion && g.descripcion.toLowerCase().includes(search.toLowerCase()));

      let matchesFilter = true;
      if (typeFilter === "Polígono") matchesFilter = g.tipo === "Polígono";
      else if (typeFilter === "Círculo") matchesFilter = g.tipo === "Círculo";
      else if (typeFilter === "Activas") matchesFilter = g.activa;
      else if (typeFilter === "Inactivas") matchesFilter = !g.activa;

      return matchesSearch && matchesFilter;
    });
  }, [geofences, search, typeFilter]);

  // Active counts for the header badge
  const activeCount = useMemo(() => geofences.filter((g) => g.activa).length, [geofences]);

  // Reset focus if search changes and focused item is filtered out
  useEffect(() => {
    if (focusedGeofenceId && !filteredGeofences.find((g) => g.id === focusedGeofenceId)) {
      setFocusedGeofenceId(null);
    }
  }, [search, typeFilter, filteredGeofences, focusedGeofenceId]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleStartCreate = () => {
    const defaultCenter: [number, number] = [-38.7183, -62.2663];
    const initialPolygonCoords: [number, number][] = [
      [-38.715, -62.268],
      [-38.715, -62.258],
      [-38.722, -62.258],
      [-38.722, -62.268],
    ];

    setDraftGeofence({
      nombre: "Nueva Geocerca",
      descripcion: "",
      tipo: "Polígono",
      color: "#3B82F6",
      opacidad: 0.25,
      coordenadas: initialPolygonCoords,
      centro: defaultCenter,
      radio: 500,
      activa: true,
      targetType: "ALL",
      targetVehicles: [],
      targetCategories: [],
      targetGroups: [],
      alertEvents: ["EXIT"],
      speedLimit: 40,
      actionTypes: ["UI", "EMAIL"],
      emailRecipients: "",
    });

    setDrawingMode("draw_polygon");
    setMode("create");
    setIsListOpen(true);
    setFocusedGeofenceId(null);
  };

  const handleStartEdit = (geofence: Geofence) => {
    setDraftGeofence({ ...geofence });
    setDrawingMode("edit_vertices");
    setMode("edit");
    setIsListOpen(true);
    setFocusedGeofenceId(geofence.id);
  };

  const handleCancelForm = () => {
    setDraftGeofence(null);
    setDrawingMode("none");
    setMode("list");
  };

  const handleSave = async () => {
    if (!draftGeofence) return;
    setIsSaving(true);

    try {
      if (mode === "create") {
        const res = await fetch("/api/geofences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftGeofence),
        });

        if (res.ok) {
          const created = await res.json();
          setGeofences((prev) => [created, ...prev]);
          setFocusedGeofenceId(created.id);
        } else {
          const fallbackNew: Geofence = {
            ...draftGeofence,
            id: Date.now(),
          };
          setGeofences((prev) => [fallbackNew, ...prev]);
          setFocusedGeofenceId(fallbackNew.id);
        }
      } else if (mode === "edit" && draftGeofence.id) {
        const res = await fetch(`/api/geofences/${draftGeofence.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftGeofence),
        });

        if (res.ok) {
          const updated = await res.json();
          setGeofences((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
          setFocusedGeofenceId(updated.id);
        } else {
          setGeofences((prev) =>
            prev.map((g) => (g.id === draftGeofence.id ? ({ ...draftGeofence } as Geofence) : g))
          );
        }
      }

      setMode("list");
      setDraftGeofence(null);
      setDrawingMode("none");
    } catch (error) {
      console.error("Error saving geofence:", error);
      if (mode === "create") {
        const fallbackNew: Geofence = {
          ...draftGeofence,
          id: Date.now(),
        };
        setGeofences((prev) => [fallbackNew, ...prev]);
      } else if (mode === "edit" && draftGeofence.id) {
        setGeofences((prev) =>
          prev.map((g) => (g.id === draftGeofence.id ? ({ ...draftGeofence } as Geofence) : g))
        );
      }
      setMode("list");
      setDraftGeofence(null);
      setDrawingMode("none");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/geofences/${id}`, { method: "DELETE" });
    } catch (error) {
      console.warn("Delete API error, removing from local state:", error);
    }
    setGeofences((prev) => prev.filter((g) => g.id !== id));
    if (focusedGeofenceId === id) setFocusedGeofenceId(null);
  };

  const handleToggleActive = async (id: number) => {
    const current = geofences.find((g) => g.id === id);
    if (!current) return;

    const newActive = !current.activa;
    setGeofences((prev) =>
      prev.map((g) => (g.id === id ? { ...g, activa: newActive } : g))
    );

    try {
      await fetch(`/api/geofences/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: newActive }),
      });
    } catch (error) {
      console.warn("Toggle API error:", error);
    }
  };

  const handleSelectGeofence = (id: number) => {
    const target = geofences.find((g) => g.id === id);
    if (target) {
      handleStartEdit(target);
    } else {
      setFocusedGeofenceId(id);
    }
  };

  return (
    <div className="absolute inset-0 flex">
      {/* Absolute Map Background */}
      <div className="absolute inset-0 z-0">
        <GeofenceMap
          geofences={geofences}
          isListOpen={isListOpen}
          focusedGeofenceId={focusedGeofenceId}
          setFocusedGeofenceId={setFocusedGeofenceId}
          isEditing={mode !== "list"}
          draftGeofence={draftGeofence}
          onDraftChange={setDraftGeofence}
          drawingMode={drawingMode}
          setDrawingMode={setDrawingMode}
          onSelectGeofence={handleSelectGeofence}
          onStartEdit={handleStartEdit}
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
        {/* ================================================================= */}
        {/* CREATE / EDIT FORM VIEW */}
        {/* ================================================================= */}
        {mode !== "list" && draftGeofence && (
          <GeofenceForm
            initialData={mode === "edit" ? geofences.find((g) => g.id === draftGeofence.id) : undefined}
            draftData={draftGeofence}
            onChange={setDraftGeofence}
            onSave={handleSave}
            onCancel={handleCancelForm}
            drawingMode={drawingMode}
            setDrawingMode={setDrawingMode}
            isSaving={isSaving}
            availableVehicles={availableVehicles}
          />
        )}

        {/* ================================================================= */}
        {/* GEOFENCES LIST VIEW */}
        {/* ================================================================= */}
        {mode === "list" && (
          <div className="flex flex-col h-full select-none">
            {/* Header & Controls */}
            <div className="p-5 border-b border-border/50 flex flex-col gap-4 bg-background shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Geocercas
                  <div className="flex items-center text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm ml-1.5 translate-y-[1px]">
                    {activeCount}/{geofences.length} Activas
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 shrink-0 gap-2 px-3 bg-card text-sm font-medium border-muted-foreground/20"
                    >
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      {typeFilter}
                      <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    {(["Todos", "Polígono", "Círculo", "Activas", "Inactivas"] as TypeFilter[]).map(
                      (type) => (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => setTypeFilter(type)}
                          className={`cursor-pointer ${
                            typeFilter === type ? "bg-primary/10 font-bold text-primary" : ""
                          }`}
                        >
                          {type}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={handleStartCreate}
                  className="h-9 shrink-0 gap-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Nueva
                </Button>
              </div>
            </div>

            {/* Geofence List - Continuous Flush List matching mapa */}
            <div className="flex-1 overflow-y-auto border-t border-border/40 scroll-smooth">
              {filteredGeofences.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-6">
                  No se encontraron geocercas.
                </div>
              ) : (
                filteredGeofences.map((g) => (
                  <GeofenceCard
                    key={g.id}
                    geofence={g}
                    isSelected={focusedGeofenceId === g.id}
                    onSelect={() => handleSelectGeofence(g.id)}
                    onEdit={() => handleStartEdit(g)}
                    onDelete={() => handleDelete(g.id)}
                    onToggleActive={() => handleToggleActive(g.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
