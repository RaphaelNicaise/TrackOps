"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  Radio,
  X,
} from "lucide-react";
import {
  Schedule,
  ScheduleViolation,
  VehicleGroup,
} from "@/types/schedule";
import {
  INITIAL_MOCK_SCHEDULES,
  INITIAL_MOCK_VIOLATIONS,
} from "@/lib/mock-schedules";
import { INITIAL_MOCK_GROUPS } from "@/lib/mock-vehicle-groups";
import { mockVehiculos, MockVehiculo } from "@/lib/mock-vehicles";
import {
  ScheduleCard,
  ScheduleModal,
  ViolationsTable,
} from "@/components/schedules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function UsageSchedulesPage() {
  // State
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_MOCK_SCHEDULES);
  const [violations, setViolations] = useState<ScheduleViolation[]>(INITIAL_MOCK_VIOLATIONS);
  const [groups, setGroups] = useState<VehicleGroup[]>(INITIAL_MOCK_GROUPS);
  const [vehicles] = useState<MockVehiculo[]>(mockVehiculos);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingViolations, setIsLoadingViolations] = useState(false);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<"policies" | "violations">("policies");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] = useState<Schedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Schedules from API
  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/schedules");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSchedules(data);
        }
      }
    } catch (error) {
      console.warn("Could not fetch schedules from API, keeping fallback:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Violations from API
  const fetchViolations = useCallback(async () => {
    setIsLoadingViolations(true);
    try {
      const res = await fetch("/api/schedules/violations");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setViolations(data);
        }
      }
    } catch (error) {
      console.warn("Could not fetch violations from API, keeping fallback:", error);
    } finally {
      setIsLoadingViolations(false);
    }
  }, []);

  // Fetch Groups from API
  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/vehicle-groups");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGroups(data);
        }
      }
    } catch (error) {
      console.warn("Could not fetch groups from API, keeping fallback:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSchedules();
    fetchViolations();
    fetchGroups();
  }, [fetchSchedules, fetchViolations, fetchGroups]);

  // Refresh all
  const handleRefresh = async () => {
    await Promise.all([fetchSchedules(), fetchViolations(), fetchGroups()]);
  };

  // KPI Calculations
  const totalSchedules = schedules.length;
  const activeSchedulesCount = useMemo(
    () => schedules.filter((s) => s.activo).length,
    [schedules]
  );
  const inactiveSchedulesCount = totalSchedules - activeSchedulesCount;

  // Fleet coverage calculation
  const coveredVehiclesCount = useMemo(() => {
    const coveredIds = new Set<number>();
    const activePolicies = schedules.filter((s) => s.activo);

    for (const schedule of activePolicies) {
      if (schedule.targetType === "ALL") {
        vehicles.forEach((v) => coveredIds.add(v.id));
        break;
      }
      if (schedule.targetType === "VEHICLES" && schedule.targetVehicles) {
        schedule.targetVehicles.forEach((id) => coveredIds.add(id));
      }
      if (schedule.targetType === "CATEGORY" && schedule.targetCategories) {
        vehicles.forEach((v) => {
          if (schedule.targetCategories?.includes(v.tipo)) {
            coveredIds.add(v.id);
          }
        });
      }
      if (schedule.targetType === "GROUP" && schedule.targetGroups) {
        schedule.targetGroups.forEach((groupNameOrId) => {
          const group = groups.find(
            (g) => g.nombre === groupNameOrId || String(g.id) === groupNameOrId
          );
          if (group && group.vehicleIds) {
            group.vehicleIds.forEach((id) => coveredIds.add(id));
          }
        });
      }
    }
    return coveredIds.size;
  }, [schedules, groups, vehicles]);

  const fleetCoveragePercentage = useMemo(() => {
    if (vehicles.length === 0) return 0;
    return Math.min(100, Math.round((coveredVehiclesCount / vehicles.length) * 100));
  }, [coveredVehiclesCount, vehicles.length]);

  // Average tolerance minutes across active schedules
  const avgTolerance = useMemo(() => {
    if (schedules.length === 0) return 5;
    const sum = schedules.reduce((acc, s) => acc + (s.toleranciaMinutos || 5), 0);
    return Math.round(sum / schedules.length);
  }, [schedules]);

  // Filtered schedules for Tab 1
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      // Status filter
      if (statusFilter === "ACTIVE" && !s.activo) return false;
      if (statusFilter === "INACTIVE" && s.activo) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = s.nombre.toLowerCase().includes(q);
        const matchesDesc = s.descripcion?.toLowerCase().includes(q) ?? false;
        const matchesGroup = s.targetGroups?.some((g) => g.toLowerCase().includes(q)) ?? false;
        const matchesCategory = s.targetCategories?.some((c) => c.toLowerCase().includes(q)) ?? false;
        const matchesVehicle = s.targetVehicles?.some((vId) => {
          const v = vehicles.find((veh) => veh.id === vId);
          return v ? v.patente.toLowerCase().includes(q) : false;
        }) ?? false;

        if (!matchesName && !matchesDesc && !matchesGroup && !matchesCategory && !matchesVehicle) {
          return false;
        }
      }

      return true;
    });
  }, [schedules, statusFilter, search, vehicles]);

  // Schedule Modal Handlers
  const handleOpenCreateModal = () => {
    setSelectedScheduleForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (schedule: Schedule) => {
    setSelectedScheduleForEdit(schedule);
    setIsModalOpen(true);
  };

  const handleDuplicateSchedule = (schedule: Schedule) => {
    const duplicated: Schedule = {
      ...schedule,
      id: 0, // id 0 signals a new schedule to the modal/page
      nombre: `${schedule.nombre} (Copia)`,
      activo: false,
    };
    setSelectedScheduleForEdit(duplicated);
    setIsModalOpen(true);
  };

  // Toggle active
  const handleToggleActive = async (id: number, active: boolean) => {
    const previousSchedules = [...schedules];
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, activo: active } : s))
    );

    try {
      const res = await fetch(`/api/schedules/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: active }),
      });
      if (!res.ok) {
        throw new Error("Error al alternar estado del horario");
      }
    } catch (error) {
      console.error("Error toggling schedule:", error);
      setSchedules(previousSchedules);
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async (id: number) => {
    const previousSchedules = [...schedules];
    setSchedules((prev) => prev.filter((s) => s.id !== id));

    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Error al eliminar el horario");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      setSchedules(previousSchedules);
    }
  };

  // Save schedule (create or edit)
  const handleSaveSchedule = async (scheduleData: Partial<Schedule>) => {
    setIsSaving(true);
    try {
      const isEditing = Boolean(selectedScheduleForEdit?.id && selectedScheduleForEdit.id > 0);

      if (isEditing && selectedScheduleForEdit) {
        // Update existing
        const res = await fetch(`/api/schedules/${selectedScheduleForEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scheduleData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Error al actualizar el horario");
        }

        const updated: Schedule = await res.json();
        setSchedules((prev) =>
          prev.map((s) => (s.id === selectedScheduleForEdit.id ? updated : s))
        );
      } else {
        // Create new
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scheduleData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Error al crear el horario");
        }

        const created: Schedule = await res.json();
        setSchedules((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
      setSelectedScheduleForEdit(null);
    } catch (error) {
      console.error("Error saving schedule:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Horarios de Uso
              </h1>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-semibold uppercase">
                Control de Flota
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Control de franjas horarias operativas, asignación a flota y alertas de uso fuera de horario
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isLoadingViolations}
            className="h-9 gap-1.5 rounded-xl border-border/80 text-xs"
            title="Recargar datos"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isLoading || isLoadingViolations ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          <Button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-9 gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Nueva Franja Horaria</span>
          </Button>
        </div>
      </div>

      {/* Top Bento KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Políticas Activas */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Políticas Activas
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {activeSchedulesCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              de {totalSchedules} reglas
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{
                  width: `${
                    totalSchedules > 0
                      ? Math.round((activeSchedulesCount / totalSchedules) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {totalSchedules > 0
                ? Math.round((activeSchedulesCount / totalSchedules) * 100)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* KPI 2: Cobertura de Flota */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cobertura de Flota
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {coveredVehiclesCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              de {vehicles.length} móviles
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${fleetCoveragePercentage}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {fleetCoveragePercentage}%
            </span>
          </div>
        </div>

        {/* KPI 3: Infracciones Detectadas */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Infracciones Registradas
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                violations.length > 0
                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {violations.length}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              eventos totales
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
            Uso no autorizado detectado
          </p>
        </div>

        {/* KPI 4: Monitoreo en Vivo */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Monitoreo en Vivo
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm font-bold text-foreground">
              Motor de Detección Activo
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Tolerancia configurada: ~{avgTolerance} min
          </p>
        </div>
      </div>

      {/* Main Tabs and Content */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "policies" | "violations")}
        className="space-y-4"
      >
        {/* Navigation & Action Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-3">
          <TabsList className="grid grid-cols-2 w-full md:w-auto h-10 p-1 bg-muted/60 rounded-xl">
            <TabsTrigger
              value="policies"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-lg transition-all"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Políticas de Horario</span>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-bold rounded-md bg-muted-foreground/15"
              >
                {totalSchedules}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="violations"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-lg transition-all"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Registro de Infracciones</span>
              <Badge
                variant="secondary"
                className={`h-5 px-1.5 text-[10px] font-bold rounded-md ${
                  violations.length > 0
                    ? "bg-red-500/20 text-red-500 border border-red-500/30"
                    : "bg-muted-foreground/15 text-muted-foreground"
                }`}
              >
                {violations.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1 Controls (Search & Status Filter) */}
          {activeTab === "policies" && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Box */}
              <div className="relative min-w-[220px] flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar regla o móvil..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-8.5 pr-8 text-xs rounded-xl bg-background border-border/80 focus-visible:ring-amber-500/30"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border/60">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === "ALL"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos ({totalSchedules})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === "ACTIVE"
                      ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Activas ({activeSchedulesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("INACTIVE")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === "INACTIVE"
                      ? "bg-background text-slate-600 dark:text-slate-400 shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Inactivas ({inactiveSchedulesCount})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Policies Grid */}
        <TabsContent value="policies" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
          {filteredSchedules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onToggleActive={(active) => handleToggleActive(schedule.id, active)}
                  onEdit={() => handleOpenEditModal(schedule)}
                  onDuplicate={() => handleDuplicateSchedule(schedule)}
                  onDelete={() => handleDeleteSchedule(schedule.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {search || statusFilter !== "ALL"
                  ? "No se encontraron políticas de horario"
                  : "Aún no has configurado políticas de horario"}
              </h3>
              <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
                {search || statusFilter !== "ALL"
                  ? "Probá ajustando los términos de búsqueda o quitando los filtros aplicados."
                  : "Definí franjas horarias operativas para fiscalizar el uso de vehículos comerciales, de guardia o gerenciales."}
              </p>
              <div className="mt-5 flex gap-2">
                {search || statusFilter !== "ALL" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("ALL");
                    }}
                    className="text-xs rounded-xl"
                  >
                    Restablecer filtros
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="h-9 gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-xs"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Crear la primera política</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Violations Table */}
        <TabsContent value="violations" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
          <ViolationsTable
            violations={violations}
            isLoading={isLoadingViolations}
          />
        </TabsContent>
      </Tabs>

      {/* Schedule Create / Edit / Duplicate Modal */}
      <ScheduleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        schedule={selectedScheduleForEdit}
        onSave={handleSaveSchedule}
        isSaving={isSaving}
        availableGroups={groups}
        availableVehicles={vehicles}
      />
    </div>
  );
}
