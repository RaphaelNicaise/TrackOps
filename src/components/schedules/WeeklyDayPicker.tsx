"use client";

import React from "react";
import {
  Clock,
  Plus,
  Trash2,
  Copy,
  Calendar,
  Sparkles,
  Ban,
  Sun,
  CheckCircle2,
} from "lucide-react";
import {
  DayOfWeek,
  WeeklyScheduleConfig,
  DayScheduleConfig,
  TimeSlot,
  DAYS_OF_WEEK,
} from "@/types/schedule";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface WeeklyDayPickerProps {
  value: WeeklyScheduleConfig;
  onChange: (config: WeeklyScheduleConfig) => void;
  disabled?: boolean;
}

export function WeeklyDayPicker({
  value,
  onChange,
  disabled = false,
}: WeeklyDayPickerProps) {
  // Toggle a single day's active status
  const handleToggleDay = (dayKey: DayOfWeek, active: boolean) => {
    const currentDay = value[dayKey] || { active: false, slots: [] };
    const newSlots =
      active && (!currentDay.slots || currentDay.slots.length === 0)
        ? [{ start: "08:00", end: "18:00" }]
        : currentDay.slots || [];

    onChange({
      ...value,
      [dayKey]: {
        active,
        slots: newSlots,
      },
    });
  };

  // Update a specific slot of a day
  const handleUpdateSlot = (
    dayKey: DayOfWeek,
    slotIndex: number,
    field: "start" | "end",
    val: string
  ) => {
    const currentSlots = [...(value[dayKey]?.slots || [])];
    if (!currentSlots[slotIndex]) return;

    currentSlots[slotIndex] = {
      ...currentSlots[slotIndex],
      [field]: val,
    };

    onChange({
      ...value,
      [dayKey]: {
        ...value[dayKey],
        slots: currentSlots,
      },
    });
  };

  // Add a new time slot to a day
  const handleAddSlot = (dayKey: DayOfWeek) => {
    const currentSlots = [...(value[dayKey]?.slots || [])];
    const lastSlot = currentSlots[currentSlots.length - 1];
    let newStart = "14:00";
    let newEnd = "18:00";

    if (lastSlot && lastSlot.end < "20:00") {
      newStart = lastSlot.end;
      const [h, m] = lastSlot.end.split(":").map(Number);
      const nextH = Math.min(h + 4, 23).toString().padStart(2, "0");
      newEnd = `${nextH}:${(m || 0).toString().padStart(2, "0")}`;
    }

    currentSlots.push({ start: newStart, end: newEnd });

    onChange({
      ...value,
      [dayKey]: {
        ...value[dayKey],
        slots: currentSlots,
      },
    });
  };

  // Remove a time slot
  const handleRemoveSlot = (dayKey: DayOfWeek, slotIndex: number) => {
    const currentSlots = (value[dayKey]?.slots || []).filter(
      (_, idx) => idx !== slotIndex
    );

    onChange({
      ...value,
      [dayKey]: {
        ...value[dayKey],
        slots: currentSlots,
      },
    });
  };

  // Preset 1: Copiar Lunes a Lun-Vie
  const handlePresetCopyMondayToWeekdays = () => {
    const mondayConfig = value.monday || {
      active: true,
      slots: [{ start: "08:00", end: "18:00" }],
    };

    onChange({
      ...value,
      tuesday: JSON.parse(JSON.stringify(mondayConfig)),
      wednesday: JSON.parse(JSON.stringify(mondayConfig)),
      thursday: JSON.parse(JSON.stringify(mondayConfig)),
      friday: JSON.parse(JSON.stringify(mondayConfig)),
    });
  };

  // Preset 2: Activar 24/7 (Todos los días)
  const handlePreset24_7 = () => {
    const all24_7: WeeklyScheduleConfig = {
      monday: { active: true, slots: [{ start: "00:00", end: "23:59" }] },
      tuesday: { active: true, slots: [{ start: "00:00", end: "23:59" }] },
      wednesday: { active: true, slots: [{ start: "00:00", end: "23:59" }] },
      thursday: { active: true, slots: [{ start: "00:00", end: "23:59" }] },
      friday: { active: true, slots: [{ start: "00:00", end: "23:59" }] },
      saturday: { active: true, slots: [{ start: "00:00", end: "23:59" }] },
      sunday: { active: true, slots: [{ start: "00:00", end: "23:59" }] },
    };
    onChange(all24_7);
  };

  // Preset 3: Bloquear Fines de Semana
  const handlePresetBlockWeekends = () => {
    onChange({
      ...value,
      saturday: { active: false, slots: [] },
      sunday: { active: false, slots: [] },
    });
  };

  // Preset 4: Horario Comercial Estándar (Lun-Vie 08-18)
  const handlePresetCommercial = () => {
    const commercialDay: DayScheduleConfig = {
      active: true,
      slots: [{ start: "08:00", end: "18:00" }],
    };
    onChange({
      monday: JSON.parse(JSON.stringify(commercialDay)),
      tuesday: JSON.parse(JSON.stringify(commercialDay)),
      wednesday: JSON.parse(JSON.stringify(commercialDay)),
      thursday: JSON.parse(JSON.stringify(commercialDay)),
      friday: JSON.parse(JSON.stringify(commercialDay)),
      saturday: { active: false, slots: [] },
      sunday: { active: false, slots: [] },
    });
  };

  const activeDaysCount = DAYS_OF_WEEK.filter((d) => value[d.key]?.active).length;

  return (
    <div className="space-y-4">
      {/* Top Presets Toolbar */}
      <div className="flex flex-col gap-2 p-3 bg-muted/40 rounded-2xl border border-border/70">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Acciones Rápidas y Plantillas
          </span>
          <Badge variant="secondary" className="text-[10px] font-mono font-medium">
            {activeDaysCount} de 7 días autorizados
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={handlePresetCopyMondayToWeekdays}
            className="h-8 text-xs font-medium justify-start gap-1.5 bg-card hover:bg-muted/80 rounded-xl"
            title="Aplica la configuración del lunes a martes, miércoles, jueves y viernes"
          >
            <Copy className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Copiar Lun a Lun-Vie</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={handlePresetCommercial}
            className="h-8 text-xs font-medium justify-start gap-1.5 bg-card hover:bg-muted/80 rounded-xl"
            title="Lunes a Viernes de 08:00 a 18:00, Fines de semana inactivos"
          >
            <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Lun-Vie (08 a 18)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={handlePreset24_7}
            className="h-8 text-xs font-medium justify-start gap-1.5 bg-card hover:bg-muted/80 rounded-xl"
            title="Permite circulación las 24 horas los 7 días de la semana"
          >
            <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Activar 24/7</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={handlePresetBlockWeekends}
            className="h-8 text-xs font-medium justify-start gap-1.5 bg-card hover:bg-muted/80 rounded-xl"
            title="Desactiva sábados y domingos"
          >
            <Ban className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            <span className="truncate">Bloquear Fines de Sem.</span>
          </Button>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-2.5">
        {DAYS_OF_WEEK.map((day) => {
          const dayConfig = value[day.key] || { active: false, slots: [] };
          const isActive = Boolean(dayConfig.active);
          const slots = dayConfig.slots || [];

          return (
            <div
              key={day.key}
              className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                isActive
                  ? "bg-card border-border shadow-xs"
                  : "bg-card/40 border-border/50 opacity-70"
              }`}
            >
              {/* Day Header Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground font-mono"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {day.short}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {day.label}
                      {isActive && (
                        <span className="text-[11px] font-normal text-muted-foreground">
                          ({slots.length} tramo{slots.length !== 1 ? "s" : ""})
                        </span>
                      )}
                    </div>
                    {!isActive && (
                      <span className="text-[11px] text-muted-foreground">
                        No permitido (Cualquier uso generará infracción)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-emerald-500" : "text-muted-foreground"
                    }`}
                  >
                    {isActive ? "Permitido" : "Bloqueado"}
                  </span>
                  <Switch
                    checked={isActive}
                    disabled={disabled}
                    onCheckedChange={(checked) => handleToggleDay(day.key, checked)}
                  />
                </div>
              </div>

              {/* Time Slots Area (Only shown if day is active) */}
              {isActive && (
                <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                  {slots.length === 0 ? (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500">
                      <span>No hay tramos configurados. Agregá al menos uno.</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/20 gap-1"
                        onClick={() => handleAddSlot(day.key)}
                        disabled={disabled}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Agregar Tramo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((slot, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-2 flex-wrap sm:flex-nowrap bg-muted/40 p-2 rounded-xl border border-border/50"
                        >
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-medium">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <span>Tramo {sIdx + 1}:</span>
                          </div>

                          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                            <div className="flex items-center gap-1.5 flex-1">
                              <span className="text-[11px] text-muted-foreground">Desde:</span>
                              <Input
                                type="time"
                                value={slot.start || "08:00"}
                                disabled={disabled}
                                onChange={(e) =>
                                  handleUpdateSlot(
                                    day.key,
                                    sIdx,
                                    "start",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-xs font-mono bg-card w-full text-center"
                              />
                            </div>

                            <span className="text-muted-foreground text-xs font-bold">
                              —
                            </span>

                            <div className="flex items-center gap-1.5 flex-1">
                              <span className="text-[11px] text-muted-foreground">Hasta:</span>
                              <Input
                                type="time"
                                value={slot.end || "18:00"}
                                disabled={disabled}
                                onChange={(e) =>
                                  handleUpdateSlot(
                                    day.key,
                                    sIdx,
                                    "end",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-xs font-mono bg-card w-full text-center"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-auto">
                            {slots.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                onClick={() => handleRemoveSlot(day.key, sIdx)}
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Eliminar tramo horario"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {sIdx === slots.length - 1 && slots.length < 4 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={disabled}
                                onClick={() => handleAddSlot(day.key)}
                                className="h-8 text-xs px-2.5 rounded-xl gap-1 bg-card hover:bg-muted"
                                title="Agregar otro tramo horario para este día (ej. turno tarde)"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Tramo</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
