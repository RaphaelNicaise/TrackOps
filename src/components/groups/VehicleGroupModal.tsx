"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Layers,
  Wrench,
  Shield,
  Navigation,
  Package,
  Zap,
  Car,
  Users,
  Search,
  Check,
  X,
  Sparkles,
  Pipette,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { VehicleGroup } from "@/types/schedule";
import { mockVehiculos } from "@/lib/mock-vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface VehicleGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: VehicleGroup | null;
  onSave: (groupData: Partial<VehicleGroup>) => Promise<void> | void;
  isSaving?: boolean;
}

export const GROUP_COLOR_PRESETS = [
  { hex: "#3B82F6", label: "Azul" },
  { hex: "#10B981", label: "Esmeralda" },
  { hex: "#F2B705", label: "Ámbar TrackOps" },
  { hex: "#EF4444", label: "Rojo" },
  { hex: "#8B5CF6", label: "Púrpura" },
  { hex: "#EC4899", label: "Rosa" },
  { hex: "#06B6D4", label: "Cian" },
  { hex: "#F97316", label: "Naranja" },
];

export const GROUP_ICON_OPTIONS = [
  { id: "truck", label: "Camión", icon: Truck },
  { id: "layers", label: "Capas", icon: Layers },
  { id: "wrench", label: "Técnica", icon: Wrench },
  { id: "navigation", label: "Ruta", icon: Navigation },
  { id: "shield", label: "Control", icon: Shield },
  { id: "package", label: "Carga", icon: Package },
  { id: "zap", label: "Urgente", icon: Zap },
  { id: "car", label: "Livianos", icon: Car },
  { id: "users", label: "Equipo", icon: Users },
];

export function VehicleGroupModal({
  open,
  onOpenChange,
  group,
  onSave,
  isSaving = false,
}: VehicleGroupModalProps) {
  const isEditing = Boolean(group?.id);

  // Form State
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [icono, setIcono] = useState("truck");
  const [vehicleIds, setVehicleIds] = useState<number[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state on open/group change
  useEffect(() => {
    if (open) {
      if (group) {
        setNombre(group.nombre || "");
        setDescripcion(group.descripcion || "");
        setColor(group.color || "#3B82F6");
        setIcono(group.icono || "truck");
        setVehicleIds(group.vehicleIds ? [...group.vehicleIds] : []);
      } else {
        setNombre("");
        setDescripcion("");
        setColor("#3B82F6");
        setIcono("truck");
        setVehicleIds([]);
      }
      setVehicleSearch("");
      setErrorMessage(null);
    }
  }, [open, group]);

  // Filtered vehicles based on search
  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.toLowerCase().trim();
    if (!q) return mockVehiculos;
    return mockVehiculos.filter((v) => {
      return (
        v.patente.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        v.tipo.toLowerCase().includes(q)
      );
    });
  }, [vehicleSearch]);

  // Selected vehicle items for chip preview
  const selectedVehicles = useMemo(() => {
    return vehicleIds.map((id) => {
      const found = mockVehiculos.find((v) => v.id === id);
      return {
        id,
        patente: found ? found.patente : `Móvil #${id}`,
        marca: found?.marca || "",
        modelo: found?.modelo || "",
      };
    });
  }, [vehicleIds]);

  // Toggle vehicle selection
  const handleToggleVehicle = (id: number) => {
    setVehicleIds((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]
    );
  };

  // Select all filtered vehicles
  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredVehicles.map((v) => v.id);
    setVehicleIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  // Deselect all filtered vehicles
  const handleDeselectAllFiltered = () => {
    const idsToRemove = new Set(filteredVehicles.map((v) => v.id));
    setVehicleIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMessage("El nombre del grupo es obligatorio.");
      return;
    }

    setErrorMessage(null);
    try {
      await onSave({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        color,
        icono,
        vehicleIds,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Error al guardar el grupo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              {isEditing ? "Editar Grupo de Vehículos" : "Nuevo Grupo de Vehículos"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configurá las características del grupo operativo y asigná los móviles de la flota.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Group Details (Name & Description) */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="group-name" className="text-xs font-semibold">
                Nombre del Grupo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="group-name"
                placeholder="Ej. Logística Urbana, Mantenimiento Preventivo, Turno Noche..."
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="h-10 text-sm bg-card"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group-desc" className="text-xs font-semibold">
                Descripción (opcional)
              </Label>
              <Input
                id="group-desc"
                placeholder="Ej. Vehículos asignados a distribución en zona centro"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="h-10 text-sm bg-card"
              />
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Color Identificador
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              {GROUP_COLOR_PRESETS.map((preset) => {
                const isSelected = color.toUpperCase() === preset.hex.toUpperCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setColor(preset.hex)}
                    className={`relative h-8 w-8 rounded-xl transition-all duration-150 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-md"
                        : "opacity-85 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.label}
                  >
                    {isSelected && (
                      <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] stroke-[3]" />
                    )}
                  </button>
                );
              })}

              {/* Custom Color Input */}
              <div className="relative flex items-center ml-1">
                <label
                  htmlFor="custom-group-color"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-input bg-card hover:bg-muted text-xs font-medium cursor-pointer transition-colors shadow-xs"
                  title="Color personalizado"
                >
                  <Pipette className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px]">Otro</span>
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: color }}
                  />
                </label>
                <input
                  id="custom-group-color"
                  type="color"
                  value={color.startsWith("#") && color.length === 7 ? color : "#3B82F6"}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          {/* Icon Selector */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ícono del Grupo
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {GROUP_ICON_OPTIONS.map((opt) => {
                const isSelected = icono.toLowerCase() === opt.id.toLowerCase();
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIcono(opt.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-xs ring-1 ring-primary/40"
                        : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-[10px] tracking-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vehicle Picker */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold">
                  Móviles Asignados
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Seleccioná los vehículos que formarán parte de este grupo operativo.
                </p>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {vehicleIds.length} de {mockVehiculos.length} seleccionados
              </Badge>
            </div>

            {/* Search & Bulk Select Actions */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por patente, marca o modelo..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="pl-8.5 h-8.5 text-xs bg-card"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllFiltered}
                className="h-8.5 text-xs px-2.5 rounded-xl shrink-0"
              >
                Todos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAllFiltered}
                className="h-8.5 text-xs px-2.5 rounded-xl shrink-0"
              >
                Limpiar
              </Button>
            </div>

            {/* Selected Chips Strip */}
            {selectedVehicles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-muted/40 border border-border/50">
                {selectedVehicles.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-card border border-border text-[11px] font-mono font-medium shadow-2xs"
                  >
                    <span className="font-bold text-foreground">{v.patente}</span>
                    {v.modelo && (
                      <span className="text-muted-foreground text-[10px]">
                        {v.modelo}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleVehicle(v.id)}
                      className="hover:bg-muted rounded p-0.5 text-muted-foreground hover:text-destructive"
                      title="Quitar"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Vehicle List */}
            <div className="max-h-52 overflow-y-auto rounded-xl border border-border/70 divide-y divide-border/50 bg-card">
              {filteredVehicles.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No se encontraron vehículos para &quot;{vehicleSearch}&quot;.
                </div>
              ) : (
                filteredVehicles.map((v) => {
                  const isChecked = vehicleIds.includes(v.id);
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleToggleVehicle(v.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs select-none hover:bg-muted/40 ${
                        isChecked ? "bg-primary/5 font-medium" : ""
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

          {/* Footer Actions */}
          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !nombre.trim()}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEditing ? "Guardar Cambios" : "Crear Grupo"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
