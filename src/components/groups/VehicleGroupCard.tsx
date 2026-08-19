"use client";

import React, { useState } from "react";
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
  Sparkles,
  Edit3,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { VehicleGroup } from "@/types/schedule";
import { mockVehiculos } from "@/lib/mock-vehicles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface VehicleGroupCardProps {
  group: VehicleGroup;
  onEdit: () => void;
  onDelete: () => void;
}

export const GROUP_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  truck: Truck,
  layers: Layers,
  wrench: Wrench,
  navigation: Navigation,
  shield: Shield,
  package: Package,
  zap: Zap,
  car: Car,
  users: Users,
  sparkles: Sparkles,
};

export function getGroupIcon(
  iconName?: string
): React.ComponentType<{ className?: string }> {
  if (!iconName) return Layers;
  const key = iconName.toLowerCase().trim();
  return GROUP_ICON_MAP[key] || Layers;
}

export function VehicleGroupCard({
  group,
  onEdit,
  onDelete,
}: VehicleGroupCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const IconComponent = getGroupIcon(group.icono);

  // Resolve vehicles from mock data
  const assignedVehicles = (group.vehicleIds || []).map((id) => {
    const found = mockVehiculos.find((v) => v.id === id);
    return {
      id,
      patente: found ? found.patente : `Móvil #${id}`,
      modelo: found ? `${found.marca} ${found.modelo}` : "",
      tipo: found?.tipo || "Vehículo",
      online: found?.online ?? false,
    };
  });

  const memberCount = assignedVehicles.length;
  const maxPreview = 3;
  const visibleVehicles = assignedVehicles.slice(0, maxPreview);
  const remainingCount = memberCount - maxPreview;

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  const groupColor = group.color || "#3B82F6";

  return (
    <>
      <div className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
        {/* Color accent left bar */}
        <div
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-200 group-hover:w-1.5"
          style={{ backgroundColor: groupColor }}
        />

        {/* Top section: Icon + Title + Count badge */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: `${groupColor}15`,
                  borderColor: `${groupColor}40`,
                  color: groupColor,
                }}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold tracking-tight text-foreground">
                  {group.nombre}
                </h3>
                <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">
                  {group.descripcion || "Sin descripción"}
                </p>
              </div>
            </div>

            <Badge
              variant="secondary"
              className="shrink-0 font-semibold text-xs px-2.5 py-0.5 rounded-full border border-border/60"
            >
              {memberCount} {memberCount === 1 ? "móvil" : "móviles"}
            </Badge>
          </div>

          {/* Member Vehicles Pills Preview */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mb-2">
              <span>Vehículos Asignados</span>
              {memberCount > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground/80">
                  {memberCount} total
                </span>
              )}
            </div>

            {memberCount === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground border border-dashed border-border">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Sin vehículos en este grupo</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visibleVehicles.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-2 py-1 text-xs font-mono font-medium text-foreground transition-colors hover:bg-muted"
                    title={v.modelo ? `${v.patente} (${v.modelo})` : v.patente}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        v.online
                          ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                          : "bg-slate-400"
                      }`}
                    />
                    <span className="font-bold">{v.patente}</span>
                    {v.modelo && (
                      <span className="text-[10px] text-muted-foreground font-sans truncate max-w-[80px]">
                        {v.modelo}
                      </span>
                    )}
                  </span>
                ))}

                {remainingCount > 0 && (
                  <span className="inline-flex items-center rounded-lg border border-border/70 bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground">
                    +{remainingCount} más
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full mr-1"
              style={{ backgroundColor: groupColor }}
            />
            <span className="capitalize">{group.icono}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-xl gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Editar</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-xl gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              ¿Eliminar grupo de vehículos?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground/80">
              ¿Estás seguro de que deseas eliminar el grupo{" "}
              <strong className="text-foreground">&ldquo;{group.nombre}&rdquo;</strong>?
              {memberCount > 0 && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Los {memberCount} vehículos asociados no se eliminarán de la flota, pero ya no pertenecerán a este grupo.
                </span>
              )}
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
              Eliminar Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
