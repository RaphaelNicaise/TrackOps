"use client";

import React, { useMemo, useState } from "react";
import {
  Truck,
  Car,
  Layers,
  Users,
  Search,
  Check,
  X,
  Sparkles,
  Wrench,
  Navigation,
  Shield,
  Package,
  Zap,
} from "lucide-react";
import { ScheduleTargetType, VehicleGroup } from "@/types/schedule";
import { mockVehiculos, MockVehiculo } from "@/lib/mock-vehicles";
import { INITIAL_MOCK_GROUPS } from "@/lib/mock-vehicle-groups";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ScheduleFleetAssignerProps {
  targetType: ScheduleTargetType;
  targetVehicles?: number[];
  targetCategories?: string[];
  targetGroups?: string[];
  onChange: (updates: {
    targetType: ScheduleTargetType;
    targetVehicles?: number[];
    targetCategories?: string[];
    targetGroups?: string[];
  }) => void;
  availableGroups?: VehicleGroup[];
  availableVehicles?: MockVehiculo[];
  disabled?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  truck: Truck,
  layers: Layers,
  wrench: Wrench,
  navigation: Navigation,
  shield: Shield,
  package: Package,
  zap: Zap,
  car: Car,
  users: Users,
};

export function ScheduleFleetAssigner({
  targetType = "ALL",
  targetVehicles = [],
  targetCategories = [],
  targetGroups = [],
  onChange,
  availableGroups = INITIAL_MOCK_GROUPS,
  availableVehicles = mockVehiculos,
  disabled = false,
}: ScheduleFleetAssignerProps) {
  const [vehicleSearch, setVehicleSearch] = useState("");

  // Categories computed dynamically from vehicle list
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Auto: 0,
      Camioneta: 0,
      Utilitario: 0,
      Camión: 0,
    };
    availableVehicles.forEach((v) => {
      const type = v.tipo || "Auto";
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [availableVehicles]);

  const availableCategories = Object.keys(categoryCounts);

  // Filtered vehicles for specific vehicle list
  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.toLowerCase().trim();
    if (!q) return availableVehicles;
    return availableVehicles.filter((v) => {
      return (
        v.patente.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        v.tipo.toLowerCase().includes(q)
      );
    });
  }, [vehicleSearch, availableVehicles]);

  // Selected vehicles objects for chip display
  const selectedVehicleObjects = useMemo(() => {
    return availableVehicles.filter((v) => targetVehicles.includes(v.id));
  }, [targetVehicles, availableVehicles]);

  // Toggle Category
  const handleToggleCategory = (cat: string) => {
    const current = targetCategories || [];
    const exists = current.includes(cat);
    const updated = exists ? current.filter((c) => c !== cat) : [...current, cat];
    onChange({
      targetType: "CATEGORY",
      targetCategories: updated,
      targetVehicles,
      targetGroups,
    });
  };

  // Toggle Single Vehicle
  const handleToggleVehicle = (id: number) => {
    const current = targetVehicles || [];
    const exists = current.includes(id);
    const updated = exists ? current.filter((vId) => vId !== id) : [...current, id];
    onChange({
      targetType: "VEHICLES",
      targetVehicles: updated,
      targetCategories,
      targetGroups,
    });
  };

  // Select all filtered / Deselect all
  const handleSelectAllVehicles = () => {
    const allFilteredIds = filteredVehicles.map((v) => v.id);
    const combined = Array.from(new Set([...(targetVehicles || []), ...allFilteredIds]));
    onChange({
      targetType: "VEHICLES",
      targetVehicles: combined,
      targetCategories,
      targetGroups,
    });
  };

  const handleDeselectAllVehicles = () => {
    const filteredIdsSet = new Set(filteredVehicles.map((v) => v.id));
    const remaining = (targetVehicles || []).filter((id) => !filteredIdsSet.has(id));
    onChange({
      targetType: "VEHICLES",
      targetVehicles: remaining,
      targetCategories,
      targetGroups,
    });
  };

  // Toggle Group (by name or id string)
  const handleToggleGroup = (groupName: string) => {
    const current = targetGroups || [];
    const exists = current.includes(groupName);
    const updated = exists ? current.filter((g) => g !== groupName) : [...current, groupName];
    onChange({
      targetType: "GROUP",
      targetGroups: updated,
      targetVehicles,
      targetCategories,
    });
  };

  return (
    <div className="space-y-4">
      {/* Target Type Selector Segmented Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-muted/70 rounded-2xl border border-border/60">
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange({
              targetType: "ALL",
              targetVehicles,
              targetCategories,
              targetGroups,
            })
          }
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all ${
            targetType === "ALL"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          }`}
        >
          <Truck className="h-3.5 w-3.5" />
          <span>Toda la Flota</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange({
              targetType: "CATEGORY",
              targetVehicles,
              targetCategories,
              targetGroups,
            })
          }
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all ${
            targetType === "CATEGORY"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Por Categoría</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange({
              targetType: "GROUP",
              targetVehicles,
              targetCategories,
              targetGroups,
            })
          }
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all ${
            targetType === "GROUP"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Por Grupo</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange({
              targetType: "VEHICLES",
              targetVehicles,
              targetCategories,
              targetGroups,
            })
          }
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all ${
            targetType === "VEHICLES"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          }`}
        >
          <Car className="h-3.5 w-3.5" />
          <span>Específicos</span>
        </button>
      </div>

      {/* ----------------- TAB: ALL FLOTA ----------------- */}
      {targetType === "ALL" && (
        <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Asignación Global a Toda la Flota
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Este horario de uso se fiscalizará en los {availableVehicles.length} vehículos
                de la empresa de manera predeterminada, incluyendo nuevas incorporaciones.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <Badge key={cat} variant="secondary" className="text-xs py-1 px-2.5">
                {cat}: <strong className="ml-1 text-foreground">{count}</strong>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB: CATEGORY ----------------- */}
      {targetType === "CATEGORY" && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Seleccioná los tipos de vehículos donde se aplicará este horario de uso:
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {availableCategories.map((category) => {
              const isChecked = targetCategories.includes(category);
              const count = categoryCounts[category] || 0;
              return (
                <button
                  key={category}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleCategory(category)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between shadow-xs ${
                    isChecked
                      ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/40"
                      : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                        isChecked
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-background"
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{category}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {count} vehículo{count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={isChecked ? "default" : "secondary"}
                    className="text-[10px] h-5 px-1.5 font-bold"
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {targetCategories.length === 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Seleccioná al menos una categoría para asignar el horario.
            </p>
          )}
        </div>
      )}

      {/* ----------------- TAB: GROUP ----------------- */}
      {targetType === "GROUP" && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Asigná este horario de uso a uno o varios grupos operativos:
          </div>

          <div className="space-y-2">
            {availableGroups.map((group) => {
              const isChecked =
                targetGroups.includes(group.nombre) ||
                targetGroups.includes(group.id.toString());
              const GroupIcon = ICON_MAP[group.icono?.toLowerCase()] || Users;
              const vehicleCount = group.vehicleIds?.length || 0;

              return (
                <button
                  key={group.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleGroup(group.nombre)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between shadow-xs ${
                    isChecked
                      ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/40"
                      : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-xl border flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isChecked ? `${group.color}25` : undefined,
                        borderColor: isChecked ? group.color : undefined,
                        color: group.color || "#3B82F6",
                      }}
                    >
                      <GroupIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground flex items-center gap-2">
                        {group.nombre}
                        <Badge variant="outline" className="text-[10px] font-mono h-4 px-1.5 py-0">
                          {vehicleCount} veh.
                        </Badge>
                      </div>
                      {group.descripcion && (
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {group.descripcion}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ml-2 ${
                      isChecked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-background"
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {targetGroups.length === 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Seleccioná al menos un grupo de flota para aplicar el horario.
            </p>
          )}
        </div>
      )}

      {/* ----------------- TAB: SPECIFIC VEHICLES ----------------- */}
      {targetType === "VEHICLES" && (
        <div className="space-y-3">
          {/* Search and Bulk Selection Actions */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por patente, marca o modelo..."
                value={vehicleSearch}
                disabled={disabled}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="pl-8.5 h-8.5 text-xs bg-card/60"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={handleSelectAllVehicles}
              className="h-8.5 text-xs px-2.5 rounded-xl shrink-0"
              title="Seleccionar todos los visibles"
            >
              Todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={handleDeselectAllVehicles}
              className="h-8.5 text-xs px-2.5 rounded-xl shrink-0"
              title="Deseleccionar todos"
            >
              Limpiar
            </Button>
          </div>

          {/* Selected chips area */}
          {selectedVehicleObjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-muted/40 rounded-xl border border-border/50">
              <div className="w-full text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between mb-1">
                <span>Seleccionados ({selectedVehicleObjects.length})</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      targetType: "VEHICLES",
                      targetVehicles: [],
                      targetCategories,
                      targetGroups,
                    })
                  }
                  className="text-destructive hover:underline capitalize text-[10px]"
                >
                  Quitar todos
                </button>
              </div>
              {selectedVehicleObjects.map((v) => (
                <span
                  key={v.id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-card border border-border text-[11px] font-mono font-medium shadow-2xs"
                >
                  <span className="font-bold text-foreground">{v.patente}</span>
                  <span className="text-muted-foreground text-[10px]">
                    {v.marca} {v.modelo}
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleToggleVehicle(v.id)}
                    className="hover:bg-muted rounded p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Scrollable Vehicle List */}
          <div className="max-h-52 overflow-y-auto rounded-xl border border-border/70 divide-y divide-border/50 bg-card">
            {filteredVehicles.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No se encontraron vehículos para &quot;{vehicleSearch}&quot;.
              </div>
            ) : (
              filteredVehicles.map((v) => {
                const isSelected = targetVehicles.includes(v.id);
                return (
                  <div
                    key={v.id}
                    onClick={() => !disabled && handleToggleVehicle(v.id)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs select-none hover:bg-muted/40 ${
                      isSelected ? "bg-primary/5 font-medium" : ""
                    } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-background"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="font-mono font-bold text-foreground flex items-center gap-2">
                          {v.patente}
                          <Badge
                            variant="outline"
                            className="text-[10px] font-sans font-normal py-0 px-1.5 h-4"
                          >
                            {v.tipo}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {v.marca} {v.modelo} {v.anio ? `(${v.anio})` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          v.online
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                            : "bg-slate-400"
                        }`}
                      />
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {v.velocidad}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
