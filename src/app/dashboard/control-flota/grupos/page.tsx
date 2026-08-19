"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Layers,
  Truck,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
  Car,
  CheckCircle2,
  FolderPlus,
  Sparkles,
} from "lucide-react";
import { VehicleGroup } from "@/types/schedule";
import { INITIAL_MOCK_GROUPS } from "@/lib/mock-vehicle-groups";
import { mockVehiculos } from "@/lib/mock-vehicles";
import { VehicleGroupCard, VehicleGroupModal } from "@/components/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function VehicleGroupsPage() {
  const [groups, setGroups] = useState<VehicleGroup[]>(INITIAL_MOCK_GROUPS);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] =
    useState<VehicleGroup | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch groups from API with fallback
  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/vehicle-groups");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGroups(data);
          return;
        }
      }
    } catch (error) {
      console.warn("Could not fetch groups from API, keeping fallback:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Filtered groups by search query
  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return groups;
    return groups.filter((g) => {
      const nameMatch = g.nombre.toLowerCase().includes(q);
      const descMatch = g.descripcion?.toLowerCase().includes(q) ?? false;
      return nameMatch || descMatch;
    });
  }, [groups, search]);

  // KPI Calculations
  const totalGroups = groups.length;
  const uniqueAssignedVehicleIds = useMemo(() => {
    const ids = new Set<number>();
    groups.forEach((g) => {
      (g.vehicleIds || []).forEach((vId) => ids.add(vId));
    });
    return ids;
  }, [groups]);

  const vehiclesInGroups = uniqueAssignedVehicleIds.size;
  const totalFleetVehicles = mockVehiculos.length;
  const vehiclesWithoutGroup = Math.max(
    0,
    totalFleetVehicles - vehiclesInGroups
  );

  // Handlers
  const handleOpenCreateModal = () => {
    setSelectedGroupForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (group: VehicleGroup) => {
    setSelectedGroupForEdit(group);
    setIsModalOpen(true);
  };

  const handleSaveGroup = async (groupData: Partial<VehicleGroup>) => {
    setIsSaving(true);
    try {
      if (selectedGroupForEdit) {
        // Update group
        const res = await fetch(
          `/api/vehicle-groups/${selectedGroupForEdit.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(groupData),
          }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Error al actualizar el grupo");
        }
        const updated = await res.json();
        setGroups((prev) =>
          prev.map((g) => (g.id === selectedGroupForEdit.id ? updated : g))
        );
      } else {
        // Create new group
        const res = await fetch("/api/vehicle-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupData),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Error al crear el grupo");
        }
        const created = await res.json();
        setGroups((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      setSelectedGroupForEdit(null);
    } catch (error) {
      console.error("Error saving group:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    const previousGroups = [...groups];
    setGroups((prev) => prev.filter((g) => g.id !== groupId));

    try {
      const res = await fetch(`/api/vehicle-groups/${groupId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Error al eliminar el grupo");
      }
    } catch (error) {
      console.error("Error deleting group, reverting state:", error);
      setGroups(previousGroups);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Grupos de Vehículos
              </h1>
              <p className="text-xs text-muted-foreground">
                Segmentá tu flota en grupos operativos para aplicar geocercas,
                horarios y reglas de control.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchGroups}
            disabled={isLoading}
            className="h-9 gap-1.5 rounded-xl border-border/80 text-xs"
            title="Recargar grupos"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          <Button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-9 gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Nuevo Grupo</span>
          </Button>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* KPI 1: Grupos Operativos */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Grupos Operativos
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {totalGroups}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              activos
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Segmentos de flota configurados
          </p>
        </div>

        {/* KPI 2: Vehículos Asignados */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vehículos en Grupos
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {vehiclesInGroups}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              de {totalFleetVehicles} móviles
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Móviles asignados al menos a un grupo
          </p>
        </div>

        {/* KPI 3: Vehículos sin Grupo */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sin Grupo Asignado
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {vehiclesWithoutGroup}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              móviles
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {vehiclesWithoutGroup === 0
              ? "Toda la flota tiene grupo asignado"
              : "Pendientes de vinculación operativa"}
          </p>
        </div>
      </div>

      {/* Action Bar (Search & Filter) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción de grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-card rounded-xl border-border/70"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Mostrando <strong>{filteredGroups.length}</strong> de{" "}
            <strong>{groups.length}</strong> grupos
          </span>
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSearch("")}
              className="h-7 px-2 text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg"
            >
              Limpiar filtro
            </Button>
          )}
        </div>
      </div>

      {/* Groups Grid / Empty State */}
      {filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
            {search ? (
              <Search className="h-6 w-6 text-muted-foreground" />
            ) : (
              <FolderPlus className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-base font-bold text-foreground">
            {search
              ? "No se encontraron resultados"
              : "No hay grupos de vehículos creados"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {search
              ? `No se encontró ningún grupo que coincida con "${search}". Probá con otro término de búsqueda.`
              : "Creá tu primer grupo de vehículos para empezar a estructurar y gestionar tu flota de manera organizada."}
          </p>
          <div className="mt-5">
            {search ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
                className="rounded-xl text-xs"
              >
                Limpiar búsqueda
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleOpenCreateModal}
                className="gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs shadow-xs"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Crear Primer Grupo</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => (
            <VehicleGroupCard
              key={group.id}
              group={group}
              onEdit={() => handleOpenEditModal(group)}
              onDelete={() => handleDeleteGroup(group.id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Group Modal */}
      <VehicleGroupModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setSelectedGroupForEdit(null);
        }}
        group={selectedGroupForEdit}
        onSave={handleSaveGroup}
        isSaving={isSaving}
      />
    </div>
  );
}
