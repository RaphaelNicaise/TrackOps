"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Truck,
  Bell,
  Check,
  Pipette,
  AlertCircle,
  Loader2,
  Sliders,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  Schedule,
  WeeklyScheduleConfig,
  ScheduleTargetType,
  ScheduleAlertChannel,
  VehicleGroup,
  PRESET_SCHEDULE_COLORS,
  DEFAULT_WEEKLY_CONFIG,
} from "@/types/schedule";
import { MockVehiculo } from "@/lib/mock-vehicles";
import { WeeklyDayPicker } from "./WeeklyDayPicker";
import { ScheduleFleetAssigner } from "./ScheduleFleetAssigner";
import { ScheduleAlertRules } from "./ScheduleAlertRules";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: Schedule | null;
  onSave: (data: Partial<Schedule>) => Promise<void> | void;
  isSaving?: boolean;
  availableGroups?: VehicleGroup[];
  availableVehicles?: MockVehiculo[];
}

export function ScheduleModal({
  open,
  onOpenChange,
  schedule,
  onSave,
  isSaving = false,
  availableGroups,
  availableVehicles,
}: ScheduleModalProps) {
  const isEditing = Boolean(schedule?.id);
  const [activeTab, setActiveTab] = useState<string>("general");

  // Form Fields State
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [color, setColor] = useState("#F2B705");
  const [activo, setActivo] = useState(true);
  const [diasConfig, setDiasConfig] = useState<WeeklyScheduleConfig>(
    DEFAULT_WEEKLY_CONFIG
  );
  const [toleranciaMinutos, setToleranciaMinutos] = useState<number>(5);
  const [targetType, setTargetType] = useState<ScheduleTargetType>("ALL");
  const [targetVehicles, setTargetVehicles] = useState<number[]>([]);
  const [targetCategories, setTargetCategories] = useState<string[]>([]);
  const [targetGroups, setTargetGroups] = useState<string[]>([]);
  const [alertChannels, setAlertChannels] = useState<ScheduleAlertChannel[]>([
    "UI",
  ]);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [whatsappRecipients, setWhatsappRecipients] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state on open or schedule change
  useEffect(() => {
    if (open) {
      if (schedule) {
        setNombre(schedule.nombre || "");
        setDescripcion(schedule.descripcion || "");
        setColor(schedule.color || "#F2B705");
        setActivo(schedule.activo !== undefined ? schedule.activo : true);
        setDiasConfig(
          schedule.diasConfig
            ? JSON.parse(JSON.stringify(schedule.diasConfig))
            : DEFAULT_WEEKLY_CONFIG
        );
        setToleranciaMinutos(
          schedule.toleranciaMinutos !== undefined ? schedule.toleranciaMinutos : 5
        );
        setTargetType(schedule.targetType || "ALL");
        setTargetVehicles(
          schedule.targetVehicles ? [...schedule.targetVehicles] : []
        );
        setTargetCategories(
          schedule.targetCategories ? [...schedule.targetCategories] : []
        );
        setTargetGroups(
          schedule.targetGroups ? [...schedule.targetGroups] : []
        );
        setAlertChannels(
          schedule.alertChannels ? [...schedule.alertChannels] : ["UI"]
        );
        setEmailRecipients(schedule.emailRecipients || "");
        setWhatsappRecipients(schedule.whatsappRecipients || "");
      } else {
        setNombre("");
        setDescripcion("");
        setColor("#F2B705");
        setActivo(true);
        setDiasConfig(JSON.parse(JSON.stringify(DEFAULT_WEEKLY_CONFIG)));
        setToleranciaMinutos(5);
        setTargetType("ALL");
        setTargetVehicles([]);
        setTargetCategories([]);
        setTargetGroups([]);
        setAlertChannels(["UI"]);
        setEmailRecipients("");
        setWhatsappRecipients("");
      }
      setActiveTab("general");
      setErrorMessage(null);
    }
  }, [open, schedule]);

  // Validation before save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setActiveTab("general");
      setErrorMessage("El nombre de la regla horaria es obligatorio.");
      return;
    }

    // Check if at least one day is active
    const hasActiveDay = Object.values(diasConfig).some((d) => d?.active);
    if (!hasActiveDay) {
      setActiveTab("dias");
      setErrorMessage("Debés autorizar al menos un día de la semana.");
      return;
    }

    // Check target validation
    if (targetType === "CATEGORY" && (!targetCategories || targetCategories.length === 0)) {
      setActiveTab("flota");
      setErrorMessage("Seleccioná al menos una categoría de vehículo.");
      return;
    }
    if (targetType === "GROUP" && (!targetGroups || targetGroups.length === 0)) {
      setActiveTab("flota");
      setErrorMessage("Seleccioná al menos un grupo de flota.");
      return;
    }
    if (targetType === "VEHICLES" && (!targetVehicles || targetVehicles.length === 0)) {
      setActiveTab("flota");
      setErrorMessage("Seleccioná al menos un vehículo específico de la lista.");
      return;
    }

    setErrorMessage(null);
    try {
      await onSave({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        color,
        activo,
        diasConfig,
        toleranciaMinutos,
        targetType,
        targetVehicles: targetType === "VEHICLES" ? targetVehicles : undefined,
        targetCategories: targetType === "CATEGORY" ? targetCategories : undefined,
        targetGroups: targetType === "GROUP" ? targetGroups : undefined,
        alertChannels,
        emailRecipients: emailRecipients.trim() || undefined,
        whatsappRecipients: whatsappRecipients.trim() || undefined,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Error al guardar el horario.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              {isEditing ? "Editar Regla de Horario de Uso" : "Nueva Regla de Horario de Uso"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Definí ventanas horarias permitidas, asigná la flota y configurá alertas de uso no autorizado.
            </DialogDescription>
          </DialogHeader>

          {/* Validation Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-11 p-1 bg-muted/60 rounded-2xl border border-border/60">
              <TabsTrigger
                value="general"
                className="text-xs font-semibold rounded-xl flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>

              <TabsTrigger
                value="dias"
                className="text-xs font-semibold rounded-xl flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Franjas</span>
              </TabsTrigger>

              <TabsTrigger
                value="flota"
                className="text-xs font-semibold rounded-xl flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
              >
                <Truck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Flota</span>
              </TabsTrigger>

              <TabsTrigger
                value="alertas"
                className="text-xs font-semibold rounded-xl flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Alertas</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: General Info */}
            <TabsContent value="general" className="space-y-5 pt-3">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="schedule-name" className="text-xs font-semibold">
                    Nombre del Horario <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="schedule-name"
                    placeholder="Ej. Horario Comercial Central, Turno Noche, Guardia Técnica..."
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
                  <Label htmlFor="schedule-desc" className="text-xs font-semibold">
                    Descripción Operativa (opcional)
                  </Label>
                  <Input
                    id="schedule-desc"
                    placeholder="Ej. Ventana operativa de lunes a viernes para móviles de reparto"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="h-10 text-sm bg-card"
                  />
                </div>

                {/* Active Toggle Switch */}
                <div className="p-3.5 rounded-2xl border border-border/70 bg-card flex items-center justify-between shadow-xs">
                  <div>
                    <Label htmlFor="schedule-active" className="text-xs font-bold cursor-pointer">
                      Regla Horaria Activa
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Si está activa, el sistema fiscalizará en tiempo real el encendido y circulación de la flota.
                    </p>
                  </div>
                  <Switch
                    id="schedule-active"
                    checked={activo}
                    onCheckedChange={setActivo}
                  />
                </div>

                {/* Color Selector */}
                <div className="space-y-2.5 pt-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Color de Identificación
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_SCHEDULE_COLORS.map((preset) => {
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
                        htmlFor="custom-sched-color"
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
                        id="custom-sched-color"
                        type="color"
                        value={color.startsWith("#") && color.length === 7 ? color : "#F2B705"}
                        onChange={(e) => setColor(e.target.value.toUpperCase())}
                        className="sr-only"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Franjas Semanales */}
            <TabsContent value="dias" className="pt-2">
              <WeeklyDayPicker
                value={diasConfig}
                onChange={setDiasConfig}
                disabled={isSaving}
              />
            </TabsContent>

            {/* TAB 3: Asignación de Flota */}
            <TabsContent value="flota" className="pt-2">
              <ScheduleFleetAssigner
                targetType={targetType}
                targetVehicles={targetVehicles}
                targetCategories={targetCategories}
                targetGroups={targetGroups}
                availableGroups={availableGroups}
                availableVehicles={availableVehicles}
                onChange={(updates) => {
                  setTargetType(updates.targetType);
                  if (updates.targetVehicles !== undefined)
                    setTargetVehicles(updates.targetVehicles);
                  if (updates.targetCategories !== undefined)
                    setTargetCategories(updates.targetCategories);
                  if (updates.targetGroups !== undefined)
                    setTargetGroups(updates.targetGroups);
                }}
                disabled={isSaving}
              />
            </TabsContent>

            {/* TAB 4: Canales de Alerta */}
            <TabsContent value="alertas" className="pt-2">
              <ScheduleAlertRules
                toleranciaMinutos={toleranciaMinutos}
                alertChannels={alertChannels}
                emailRecipients={emailRecipients}
                whatsappRecipients={whatsappRecipients}
                onChange={(updates) => {
                  setToleranciaMinutos(updates.toleranciaMinutos);
                  setAlertChannels(updates.alertChannels);
                  if (updates.emailRecipients !== undefined)
                    setEmailRecipients(updates.emailRecipients);
                  if (updates.whatsappRecipients !== undefined)
                    setWhatsappRecipients(updates.whatsappRecipients);
                }}
                disabled={isSaving}
              />
            </TabsContent>
          </Tabs>

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
              <span>{isEditing ? "Guardar Cambios" : "Crear Horario"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
