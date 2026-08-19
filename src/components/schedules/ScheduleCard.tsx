"use client";

import React, { useState, useMemo } from "react";
import {
  Edit3,
  Trash2,
  Copy,
  Clock,
  Calendar,
  Truck,
  Users,
  Globe,
  Layers,
  Bell,
  Mail,
  MessageSquare,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import {
  Schedule,
  DayOfWeek,
  DAYS_OF_WEEK,
} from "@/types/schedule";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface ScheduleCardProps {
  schedule: Schedule;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onToggleActive?: (active: boolean) => void;
}

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export function ScheduleCard({
  schedule,
  isSelected = false,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
}: ScheduleCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Compute current moment status (In schedule vs Out of schedule vs Inactive)
  const currentStatus = useMemo(() => {
    if (!schedule.activo) {
      return {
        label: "Inactivo",
        variant: "muted" as const,
        color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
        indicator: "bg-slate-400",
        message: "Horario pausado",
      };
    }

    const now = new Date();
    const dayOfWeek = DAY_MAP[now.getDay()];
    const dayConfig = schedule.diasConfig?.[dayOfWeek];

    if (!dayConfig || !dayConfig.active) {
      return {
        label: "Fuera de Horario",
        variant: "warning" as const,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/25",
        indicator: "bg-amber-500",
        message: "Hoy no autorizado",
      };
    }

    const currentHours = now.getHours().toString().padStart(2, "0");
    const currentMinutes = now.getMinutes().toString().padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    const slots = dayConfig.slots || [];
    const isInsideSlot = slots.some(
      (s) => currentTimeStr >= s.start && currentTimeStr <= s.end
    );

    if (isInsideSlot) {
      return {
        label: "En Horario Autorizado",
        variant: "success" as const,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
        indicator: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
        message: "Operación habilitada",
      };
    }

    return {
      label: "Fuera de Horario",
      variant: "warning" as const,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/25",
      indicator: "bg-amber-500",
      message: "Fuera de ventana operativa",
    };
  }, [schedule]);

  // Fleet Target summary
  const fleetSummary = useMemo(() => {
    switch (schedule.targetType) {
      case "CATEGORY": {
        const count = schedule.targetCategories?.length || 0;
        if (count === 1) {
          return { label: `Cat: ${schedule.targetCategories![0]}`, icon: Layers };
        }
        return {
          label: count > 0 ? `${count} Categorías` : "Por Categoría",
          icon: Layers,
        };
      }
      case "VEHICLES": {
        const count = schedule.targetVehicles?.length || 0;
        return {
          label: count === 1 ? "1 Vehículo" : `${count} Vehículos`,
          icon: Truck,
        };
      }
      case "GROUP": {
        const count = schedule.targetGroups?.length || 0;
        if (count === 1) {
          return { label: `Grupo: ${schedule.targetGroups![0]}`, icon: Users };
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
  }, [schedule]);

  const FleetIcon = fleetSummary.icon;

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    if (onDelete) onDelete();
  };

  const hasUi = schedule.alertChannels?.includes("UI");
  const hasEmail = schedule.alertChannels?.includes("EMAIL");
  const hasWhatsapp = schedule.alertChannels?.includes("WHATSAPP");

  return (
    <>
      <div
        onClick={onSelect}
        className={`group relative w-full p-4 rounded-2xl border transition-all duration-200 text-left shadow-xs ${
          isSelected
            ? "bg-card border-primary/50 ring-1 ring-primary/40 shadow-md"
            : "bg-card border-border/80 hover:border-border hover:bg-card/90"
        }`}
      >
        {/* Left Color Accent Bar */}
        <div
          className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full transition-all duration-200"
          style={{ backgroundColor: schedule.color || "#F2B705" }}
        />

        <div className="pl-2 space-y-3">
          {/* Top Row: Title + Status + Switch */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: schedule.color || "#F2B705" }}
                />
                <h3 className="font-bold text-sm text-foreground tracking-tight truncate">
                  {schedule.nombre}
                </h3>
              </div>

              {schedule.descripcion && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {schedule.descripcion}
                </p>
              )}
            </div>

            {/* Switch & Action */}
            <div
              className="flex items-center gap-2 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Switch
                checked={schedule.activo}
                onCheckedChange={(checked) =>
                  onToggleActive && onToggleActive(checked)
                }
                title={schedule.activo ? "Desactivar horario" : "Activar horario"}
              />
            </div>
          </div>

          {/* Day Chips Strip (L, M, M, J, V, S, D) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {DAYS_OF_WEEK.map((d) => {
              const dConfig = schedule.diasConfig?.[d.key];
              const isDayActive = Boolean(dConfig?.active);
              const slotsCount = dConfig?.slots?.length || 0;
              const slotsTooltip = isDayActive
                ? `${d.label}: ${
                    dConfig?.slots
                      ?.map((s) => `${s.start} - ${s.end}`)
                      .join(", ") || "Sin tramos"
                  }`
                : `${d.label}: Bloqueado`;

              return (
                <div
                  key={d.key}
                  title={slotsTooltip}
                  className={`relative w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                    isDayActive
                      ? "text-foreground border shadow-2xs"
                      : "text-muted-foreground/40 bg-muted/30 border border-transparent"
                  }`}
                  style={{
                    backgroundColor: isDayActive
                      ? `${schedule.color || "#F2B705"}22`
                      : undefined,
                    borderColor: isDayActive
                      ? `${schedule.color || "#F2B705"}60`
                      : undefined,
                    color: isDayActive ? "#FFFFFF" : undefined,
                  }}
                >
                  {d.short}
                  {isDayActive && slotsCount > 1 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 border border-background" />
                  )}
                </div>
              );
            })}

            {/* Current Real-time Status Badge */}
            <div
              className={`ml-auto flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-lg border font-semibold tracking-wide ${currentStatus.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentStatus.indicator}`} />
              <span>{currentStatus.label}</span>
            </div>
          </div>

          {/* Bottom Info Row: Assignment + Channels + Tolerance + Actions */}
          <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
            {/* Left Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Fleet Target Pill */}
              <Badge
                variant="secondary"
                className="text-[11px] font-medium gap-1 px-2 py-0.5 bg-muted/60"
              >
                <FleetIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                <span>{fleetSummary.label}</span>
              </Badge>

              {/* Tolerance Pill */}
              <Badge
                variant="outline"
                className="text-[10px] font-mono gap-1 px-1.5 py-0.5 text-muted-foreground border-border/70"
              >
                <Clock className="w-2.5 h-2.5 text-amber-500" />
                <span>Tol: {schedule.toleranciaMinutos || 0}m</span>
              </Badge>

              {/* Notification Channels icons */}
              <div className="flex items-center gap-1 text-muted-foreground">
                {hasUi && (
                  <span
                    className="p-1 rounded-md bg-muted/60 text-primary border border-border/40"
                    title="Alerta en Dashboard / Consola"
                  >
                    <Bell className="h-3 w-3" />
                  </span>
                )}
                {hasEmail && (
                  <span
                    className="p-1 rounded-md bg-muted/60 text-blue-500 border border-border/40"
                    title={`Email: ${schedule.emailRecipients || "Supervisores"}`}
                  >
                    <Mail className="h-3 w-3" />
                  </span>
                )}
                {hasWhatsapp && (
                  <span
                    className="p-1 rounded-md bg-muted/60 text-emerald-500 border border-border/40"
                    title={`WhatsApp: ${schedule.whatsappRecipients || "Activo"}`}
                  >
                    <MessageSquare className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>

            {/* Right Action buttons */}
            <div
              className="flex items-center gap-1 ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {onDuplicate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={onDuplicate}
                  title="Duplicar horario"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}

              {onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                  onClick={onEdit}
                  title="Editar configuración"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
              )}

              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteDialog(true)}
                  title="Eliminar horario"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              ¿Eliminar horario de uso?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground/80">
              ¿Estás seguro de que deseas eliminar la regla horaria{" "}
              <strong className="text-foreground">&ldquo;{schedule.nombre}&rdquo;</strong>?
              Los vehículos asignados dejarán de ser fiscalizados bajo esta franja.
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
