"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Filter,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  Square,
  Circle as CircleIcon,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Geofence, GeofenceFormData, DrawingMode, GeofenceType } from "@/types/geofence";
import { INITIAL_MOCK_GEOFENCES } from "@/lib/mock-geofences";
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
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type TypeFilter = "ALL" | "Polígono" | "Círculo";

export default function GeocercasPage() {
  const [geofences, setGeofences] = useState<Geofence[]>(INITIAL_MOCK_GEOFENCES);
  const [mode, setMode] = useState<PageMode>("list");
  const [isListOpen, setIsListOpen] = useState(true);
  const [focusedGeofenceId, setFocusedGeofenceId] = useState<number | null>(null);

  // Form & Map Drawing State
  const [draftGeofence, setDraftGeofence] = useState<GeofenceFormData | null>(null);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("none");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  // Fetch geofences from API on mount
  const fetchGeofences = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/geofences");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setGeofences(data);
          return;
        }
      }
      setGeofences(INITIAL_MOCK_GEOFENCES);
    } catch (error) {
      console.warn("Could not fetch geofences from API, falling back to mock dataset:", error);
      setGeofences(INITIAL_MOCK_GEOFENCES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  // Filtered geofences list for 'list' mode
  const filteredGeofences = useMemo(() => {
    return geofences.filter((g) => {
      const matchesSearch =
        search.trim() === "" ||
        g.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (g.descripcion && g.descripcion.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && g.activa) ||
        (statusFilter === "INACTIVE" && !g.activa);

      const matchesType = typeFilter === "ALL" || g.tipo === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [geofences, search, statusFilter, typeFilter]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = geofences.length;
    const active = geofences.filter((g) => g.activa).length;
    const polygons = geofences.filter((g) => g.tipo === "Polígono").length;
    const circles = geofences.filter((g) => g.tipo === "Círculo").length;
    return { total, active, polygons, circles };
  }, [geofences]);

  // CRUD Actions
  const handleStartCreate = () => {
    const newDraft: GeofenceFormData = {
      nombre: "",
      descripcion: "",
      tipo: "Polígono",
      color: "#3B82F6",
      opacidad: 0.25,
      activa: true,
      targetType: "ALL",
      alertEvents: ["EXIT"],
      actionTypes: ["UI"],
      coordenadas: [
        [-38.7140, -62.2620],
        [-38.7140, -62.2700],
        [-38.7220, -62.2700],
        [-38.7220, -62.2620],
      ],
    };
    setDraftGeofence(newDraft);
    setMode("create");
    setDrawingMode("edit_vertices");
    setFocusedGeofenceId(null);
    setIsListOpen(true);
  };

  const handleStartEdit = (geofence: Geofence) => {
    setDraftGeofence({ ...geofence });
    setMode("edit");
    setDrawingMode("edit_vertices");
    setFocusedGeofenceId(geofence.id);
    setIsListOpen(true);
  };

  const handleCancelForm = () => {
    setMode("list");
    setDraftGeofence(null);
    setDrawingMode("none");
  };

  const handleSave = async () => {
    if (!draftGeofence || !draftGeofence.nombre?.trim()) return;

    setIsSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/geofences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftGeofence),
        });

        if (res.ok) {
          const created: Geofence = await res.json();
          setGeofences((prev) => [created, ...prev.filter((g) => g.id !== created.id)]);
          setFocusedGeofenceId(created.id);
        } else {
          // Fallback optimistic creation
          const newGeofence: Geofence = {
            ...draftGeofence,
            id: Date.now(),
            nombre: draftGeofence.nombre || "Nueva Geocerca",
            tipo: draftGeofence.tipo || "Polígono",
            color: draftGeofence.color || "#3B82F6",
            activa: draftGeofence.activa ?? true,
          };
          setGeofences((prev) => [newGeofence, ...prev]);
          setFocusedGeofenceId(newGeofence.id);
        }
      } else if (mode === "edit" && draftGeofence.id) {
        const res = await fetch(`/api/geofences/${draftGeofence.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftGeofence),
        });

        if (res.ok) {
          const updated: Geofence = await res.json();
          setGeofences((prev) =>
            prev.map((g) => (g.id === updated.id ? updated : g))
          );
          setFocusedGeofenceId(updated.id);
        } else {
          // Fallback optimistic update
          setGeofences((prev) =>
            prev.map((g) =>
              g.id === draftGeofence.id ? ({ ...g, ...draftGeofence } as Geofence) : g
            )
          );
          setFocusedGeofenceId(draftGeofence.id);
        }
      }

      setMode("list");
      setDraftGeofence(null);
      setDrawingMode("none");
    } catch (error) {
      console.error("Error saving geofence:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/geofences/${id}`, { method: "DELETE" });
    } catch (error) {
      console.warn("API delete failed:", error);
    } finally {
      setGeofences((prev) => prev.filter((g) => g.id !== id));
      if (focusedGeofenceId === id) {
        setFocusedGeofenceId(null);
      }
    }
  };

  const handleToggleActive = async (id: number, active: boolean) => {
    // Optimistic state update
    setGeofences((prev) =>
      prev.map((g) => (g.id === id ? { ...g, activa: active } : g))
    );

    try {
      await fetch(`/api/geofences/${id}/toggle`, {
        method: "PATCH",
      });
    } catch (error) {
      console.warn("API toggle active failed:", error);
    }
  };

  const handleSelectGeofence = (id: number) => {
    setFocusedGeofenceId(id);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsListOpen(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  };

  const hasActiveFilters = search !== "" || statusFilter !== "ALL" || typeFilter !== "ALL";

  return (
    <div className="absolute inset-0 flex overflow-hidden">
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
        />
      </div>

      {/* Floating Toggle Button (visible when sidebar is closed) */}
      {!isListOpen && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 z-20 shadow-2xl bg-background/90 backdrop-blur-md border border-border/80 rounded-2xl h-11 w-11 transition-all hover:scale-105"
          onClick={() => setIsListOpen(true)}
          title="Abrir panel de geocercas"
        >
          <PanelLeftOpen className="h-5 w-5 text-foreground" />
        </Button>
      )}

      {/* Collapsible Responsive Sidebar */}
      <div
        className={`relative z-10 bg-background/95 backdrop-blur-2xl border-r border-border/80 shadow-2xl transition-all duration-300 ease-in-out flex flex-col h-full w-full sm:w-[400px] lg:w-[420px] shrink-0 ${
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
          />
        )}

        {/* ================================================================= */}
        {/* GEOFENCES LIST & SEARCH VIEW */}
        {/* ================================================================= */}
        {mode === "list" && (
          <div className="flex flex-col h-full select-none">
            {/* Header & Main Controls */}
            <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col gap-3 bg-card/40 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg tracking-tight text-foreground flex items-center gap-2">
                      Geocercas
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {geofences.length} Total
                      </span>
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Zonas de control perimetral y reglas de alerta
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setIsListOpen(false)}
                    title="Ocultar panel"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Metrics Banner */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-card/70 border border-border/60 rounded-xl p-2 text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    Activas
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.active} / {metrics.total}
                  </div>
                </div>

                <div className="bg-card/70 border border-border/60 rounded-xl p-2 text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    Polígonos
                  </div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {metrics.polygons}
                  </div>
                </div>

                <div className="bg-card/70 border border-border/60 rounded-xl p-2 text-center shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    Círculos
                  </div>
                  <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {metrics.circles}
                  </div>
                </div>
              </div>

              {/* Search Bar and "+ Nueva Geocerca" Button */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o descripción..."
                    className="pl-8.5 bg-card/80 border-border/70 h-9 text-xs focus-visible:ring-1 transition-all rounded-xl"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleStartCreate}
                  className="h-9 shrink-0 gap-1.5 px-3.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nueva</span>
                </Button>
              </div>

              {/* Filters Pills */}
              <div className="flex items-center justify-between gap-1 text-[11px] pt-0.5">
                {/* Status Toggle Pills */}
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      statusFilter === "ALL"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ACTIVE")}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      statusFilter === "ACTIVE"
                        ? "bg-card text-emerald-600 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Activas
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("INACTIVE")}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      statusFilter === "INACTIVE"
                        ? "bg-card text-slate-600 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Inactivas
                  </button>
                </div>

                {/* Type Filter Pills */}
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
                  <button
                    type="button"
                    onClick={() => setTypeFilter("ALL")}
                    className={`px-1.5 py-0.5 rounded-md font-semibold transition-all ${
                      typeFilter === "ALL"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Todos los tipos"
                  >
                    Tipos
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("Polígono")}
                    className={`p-1 rounded-md font-semibold transition-all ${
                      typeFilter === "Polígono"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Sólo Polígonos"
                  >
                    <Square className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("Círculo")}
                    className={`p-1 rounded-md font-semibold transition-all ${
                      typeFilter === "Círculo"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Sólo Círculos"
                  >
                    <CircleIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Geofence Cards List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scroll-smooth">
              {filteredGeofences.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-muted-foreground/60" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      No se encontraron geocercas
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hasActiveFilters
                        ? "Ninguna geocerca coincide con los filtros actuales."
                        : "Comenzá creando tu primera geocerca en el mapa."}
                    </p>
                  </div>

                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                      className="text-xs h-8 gap-1.5 rounded-xl mt-1"
                    >
                      <RotateCcw className="h-3 w-3" /> Limpiar Filtros
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleStartCreate}
                      className="text-xs h-8 gap-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 mt-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> + Nueva Geocerca
                    </Button>
                  )}
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
                    onToggleActive={(active) => handleToggleActive(g.id, active)}
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
