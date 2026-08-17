"use client";

import React, { useState } from "react";
import {
  MapPin,
  Edit3,
  Trash2,
  Square,
  Circle as CircleIcon,
  Truck,
  Users,
  Globe,
  AlertTriangle,
  LogIn,
  Zap,
  Clock,
  Navigation,
} from "lucide-react";
import { Geofence } from "@/types/geofence";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface GeofenceCardProps {
  geofence: Geofence;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
}

export function GeofenceCard({
  geofence,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
}: GeofenceCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fleet summary helper
  const fleetSummary = (() => {
    switch (geofence.targetType) {
      case "CATEGORY": {
        const count = geofence.targetCategories?.length || 0;
        if (count === 1) {
          return { label: geofence.targetCategories![0], icon: Truck };
        }
        return {
          label: count > 0 ? `${count} Categorías` : "Por Categoría",
          icon: Truck,
        };
      }
      case "VEHICLES": {
        const count = geofence.targetVehicles?.length || 0;
        return {
          label: count === 1 ? "1 Vehículo" : `${count} Vehículos`,
          icon: Truck,
        };
      }
      case "GROUP": {
        const count = geofence.targetGroups?.length || 0;
        if (count === 1) {
          return { label: geofence.targetGroups![0], icon: Users };
        }
        return {
          label: count > 0 ? `${count} Grupos` : "Por Grupo",
          icon: Users,
        };
      }
      case "ALL":
      default:
        return { label: "Toda la flota", icon: Globe };
    }
  })();

  const FleetIcon = fleetSummary.icon;

  // Rule tags
  const rules: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string }[] = [];

  if (geofence.alertEvents?.includes("EXIT")) {
    rules.push({
      id: "exit",
      label: "Salida",
      icon: AlertTriangle,
      colorClass: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    });
  }
  if (geofence.alertEvents?.includes("ENTER")) {
    rules.push({
      id: "enter",
      label: "Ingreso",
      icon: LogIn,
      colorClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    });
  }
  if (geofence.alertEvents?.includes("SPEED_LIMIT") || (geofence.speedLimit && geofence.speedLimit > 0)) {
    rules.push({
      id: "speed",
      label: `Max ${geofence.speedLimit || 0} km/h`,
      icon: Zap,
      colorClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    });
  }
  if (geofence.alertEvents?.includes("SCHEDULE")) {
    rules.push({
      id: "schedule",
      label: "Horario",
      icon: Clock,
      colorClass: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    });
  }

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  return (
    <>
      <div
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left ${
          isSelected
            ? "bg-card border-amber-500/80 shadow-md ring-1 ring-amber-500/30"
            : "bg-card/75 hover:bg-card border-border/70 hover:border-border hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        {/* Left Color Indicator Bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
          style={{ backgroundColor: geofence.color || "#3B82F6" }}
        />

        <div className="p-3.5 pl-4 sm:pl-4.5 space-y-2.5">
          {/* Top Line: Color Dot + Name + Type Badge + Active Switch */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-white/20"
                style={{ backgroundColor: geofence.color || "#3B82F6" }}
              />
              <span className="font-bold text-sm tracking-tight text-foreground truncate">
                {geofence.nombre}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4.5 font-medium border-border/60 text-muted-foreground shrink-0 flex items-center gap-1 bg-muted/40"
              >
                {geofence.tipo === "Polígono" ? (
                  <>
                    <Square className="h-2.5 w-2.5" />
                    <span>Polígono</span>
                  </>
                ) : (
                  <>
                    <CircleIcon className="h-2.5 w-2.5" />
                    <span>Círculo</span>
                  </>
                )}
              </Badge>
            </div>

            {/* Quick Toggle Switch for Activa */}
            <div
              className="flex items-center gap-1.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  geofence.activa
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                {geofence.activa ? "Activa" : "Inactiva"}
              </span>
              <Switch
                checked={geofence.activa}
                onCheckedChange={(checked) => onToggleActive(checked)}
                className="scale-75 origin-right data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>

          {/* Description if present */}
          {geofence.descripcion && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {geofence.descripcion}
            </p>
          )}

          {/* Middle: Fleet Assignment Tag + Rule Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {/* Fleet Assignment summary tag */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/70 text-foreground border border-border/50">
              <FleetIcon className="h-3 w-3 text-muted-foreground" />
              <span>{fleetSummary.label}</span>
            </span>

            {/* Rule Tags */}
            {rules.map((rule) => {
              const RuleIcon = rule.icon;
              return (
                <span
                  key={rule.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${rule.colorClass}`}
                >
                  <RuleIcon className="h-2.5 w-2.5" />
                  <span>{rule.label}</span>
                </span>
              );
            })}
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Navigation className="h-3 w-3 text-amber-500" />
              <span>Centrar en mapa</span>
            </button>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onEdit}
                title="Editar geocerca"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                title="Eliminar geocerca"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog Modal */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              ¿Eliminar geocerca?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground/80">
              ¿Estás seguro de que deseas eliminar permanentemente la geocerca{" "}
              <strong className="text-foreground">&ldquo;{geofence.nombre}&rdquo;</strong>?
              Esta acción revocará todas las alertas y asignaciones asociadas a esta zona.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar Geocerca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
