"use client";

import React, { useState } from "react";
import {
  Edit3,
  Trash2,
  Square,
  Circle as CircleIcon,
  Truck,
  Users,
  Globe,
  AlertTriangle,
  Zap,
  ChevronRight,
  Shield,
} from "lucide-react";
import { Geofence } from "@/types/geofence";
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

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  const hasExitAlert = geofence.alertEvents?.includes("EXIT");

  return (
    <>
      <div
        onClick={onSelect}
        className={`group relative w-full px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 border-b border-border/60 text-left ${
          isSelected
            ? "bg-amber-500/[0.08]"
            : "hover:bg-amber-500/[0.04]"
        }`}
      >
        {/* Left indicator bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 ${
            isSelected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          }`}
          style={{ backgroundColor: geofence.color || "#F2B705" }}
        />

        <div className="flex-1 min-w-0 pr-3 pl-1">
          {/* Top Row: Active status dot + Name + Alert + Geofence Type */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center justify-center shrink-0 w-2.5 h-2.5">
              {geofence.activa ? (
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ backgroundColor: geofence.color || "#10B981" }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: geofence.color || "#10B981" }}
                  />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              )}
            </div>

            <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5 truncate">
              {geofence.nombre}
              {hasExitAlert && (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive animate-pulse shrink-0" />
              )}
            </span>

            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider ml-auto shrink-0 flex items-center gap-1">
              {geofence.tipo === "Polígono" ? (
                <Square className="w-2.5 h-2.5 text-muted-foreground/70" />
              ) : (
                <CircleIcon className="w-2.5 h-2.5 text-muted-foreground/70" />
              )}
              {geofence.tipo}
            </span>
          </div>

          {/* Bottom Row: State Badge + Fleet Target + Speed / Rules */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div
              className={`flex items-center text-[10px] px-2 py-0.5 rounded border font-semibold tracking-wide shrink-0 transition-colors hover:brightness-95 ${
                geofence.activa
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-slate-500/10 text-slate-600 border-slate-500/20"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive(!geofence.activa);
              }}
              title="Click para activar/desactivar"
            >
              <span
                className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
                style={{ backgroundColor: geofence.activa ? "#10b981" : "#64748b" }}
              />
              {geofence.activa ? "Activa" : "Inactiva"}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground ml-auto">
              <span className="flex items-center gap-1 font-medium text-foreground text-[11px] truncate max-w-[130px]" title={fleetSummary.label}>
                <FleetIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                {fleetSummary.label}
              </span>

              {geofence.speedLimit && geofence.speedLimit > 0 ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 shrink-0">
                  <Zap className="w-3 h-3 text-amber-500" />
                  {geofence.speedLimit} km/h
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] opacity-70 shrink-0">
                  <Shield className="w-3 h-3" />
                  {geofence.alertEvents?.length || 0} reglas
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Arrow / Hover Action buttons */}
        <div className="shrink-0 pl-1 flex items-center gap-0.5">
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
              onClick={onEdit}
              title="Editar geocerca"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => setShowDeleteDialog(true)}
              title="Eliminar geocerca"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground/30 transition-all duration-200 group-hover:text-amber-500 group-hover:translate-x-0.5" />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              ¿Eliminar geocerca?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground/80">
              ¿Estás seguro de que deseas eliminar la geocerca{" "}
              <strong className="text-foreground">&ldquo;{geofence.nombre}&rdquo;</strong>?
              Esta acción no se puede deshacer.
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
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
