"use client";

import React, { useState } from "react";
import {
  MapPin,
  Truck,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Square,
  Circle as CircleIcon,
  MousePointerClick,
  Edit3,
  AlertCircle,
  X,
  Save,
} from "lucide-react";
import { Geofence, GeofenceFormData, DrawingMode, GeofenceType } from "@/types/geofence";
import type { MockVehiculo } from "@/lib/mock-vehicles";
import type { VehicleGroup } from "@/types/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ColorPickerCustom } from "@/components/geofences/ColorPickerCustom";
import { FleetAssigner } from "@/components/geofences/FleetAssigner";
import { AlertRulesConfig } from "@/components/geofences/AlertRulesConfig";

export interface GeofenceFormProps {
  initialData?: Geofence;
  draftData: GeofenceFormData;
  onChange: (data: GeofenceFormData) => void;
  onSave: () => Promise<void> | void;
  onCancel: () => void;
  drawingMode: DrawingMode;
  setDrawingMode: (mode: DrawingMode) => void;
  isSaving?: boolean;
  availableVehicles?: MockVehiculo[];
  availableGroups?: VehicleGroup[];
}

export function GeofenceForm({
  initialData,
  draftData,
  onChange,
  onSave,
  onCancel,
  drawingMode,
  setDrawingMode,
  isSaving = false,
  availableVehicles = [],
  availableGroups,
}: GeofenceFormProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [touchedName, setTouchedName] = useState(false);

  const isEditing = Boolean(initialData?.id || draftData.id);
  const isPolygon = draftData.tipo === "Polígono";
  const vertexCount = draftData.coordenadas?.length || 0;
  const hasCircleCenter = Boolean(draftData.centro && draftData.centro.length === 2);

  const isNameValid = (draftData.nombre || "").trim().length > 0;
  const isGeometryValid = isPolygon ? vertexCount >= 3 : hasCircleCenter;

  const handleTypeChange = (tipo: GeofenceType) => {
    if (tipo === draftData.tipo) return;
    if (tipo === "Polígono") {
      onChange({
        ...draftData,
        tipo: "Polígono",
        centro: undefined,
        radio: undefined,
        coordenadas: draftData.coordenadas || [],
      });
      setDrawingMode("draw_polygon");
    } else {
      onChange({
        ...draftData,
        tipo: "Círculo",
        coordenadas: undefined,
        centro: draftData.centro,
        radio: draftData.radio || 300,
      });
      setDrawingMode(draftData.centro ? "edit_vertices" : "draw_circle");
    }
  };

  const handleNextStep = () => {
    setTouchedName(true);
    if (currentStep === 1 && !isNameValid) {
      return;
    }
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 2 | 3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedName(true);
    if (!isNameValid) {
      setCurrentStep(1);
      return;
    }
    onSave();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col h-full bg-background text-foreground select-none"
    >
      {/* ----------------- HEADER & STEP PROGRESS ----------------- */}
      <div className="p-4 sm:p-5 border-b border-border/60 bg-card/60 backdrop-blur-md shrink-0 space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                {isEditing ? "Editar Geocerca" : "Nueva Geocerca"}
              </h2>
              <Badge variant={draftData.activa ? "default" : "secondary"} className="text-[10px] h-5">
                {draftData.activa ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paso {currentStep} de 3:{" "}
              {currentStep === 1 && "Definición de Zona & Estilo"}
              {currentStep === 2 && "Asignación de Flota"}
              {currentStep === 3 && "Reglas y Alertas"}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
              currentStep === 1
                ? "bg-primary/10 border-primary text-primary shadow-2xs font-semibold"
                : currentStep > 1
                ? "bg-card border-border/80 text-foreground hover:bg-muted/50"
                : "bg-muted/40 border-border/40 text-muted-foreground"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                currentStep > 1
                  ? "bg-emerald-500 text-white"
                  : currentStep === 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > 1 ? <Check className="h-3 w-3 stroke-[3]" /> : "1"}
            </div>
            <span className="text-xs truncate hidden sm:inline">Zona</span>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => {
              if (isNameValid) setCurrentStep(2);
              else setTouchedName(true);
            }}
            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
              currentStep === 2
                ? "bg-primary/10 border-primary text-primary shadow-2xs font-semibold"
                : currentStep > 2
                ? "bg-card border-border/80 text-foreground hover:bg-muted/50"
                : "bg-muted/40 border-border/40 text-muted-foreground"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                currentStep > 2
                  ? "bg-emerald-500 text-white"
                  : currentStep === 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > 2 ? <Check className="h-3 w-3 stroke-[3]" /> : "2"}
            </div>
            <span className="text-xs truncate hidden sm:inline">Flota</span>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => {
              if (isNameValid) setCurrentStep(3);
              else setTouchedName(true);
            }}
            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
              currentStep === 3
                ? "bg-primary/10 border-primary text-primary shadow-2xs font-semibold"
                : "bg-muted/40 border-border/40 text-muted-foreground"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                currentStep === 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
            <span className="text-xs truncate hidden sm:inline">Alertas</span>
          </button>
        </div>
      </div>

      {/* ----------------- BODY SCROLLABLE CONTENT ----------------- */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* ================= STEP 1: ZONA & ESTILO ================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Nombre Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="geofence-name" className="text-xs font-semibold">
                  Nombre de la Geocerca <span className="text-destructive">*</span>
                </Label>
                {touchedName && !isNameValid && (
                  <span className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" /> Requerido
                  </span>
                )}
              </div>
              <Input
                id="geofence-name"
                placeholder="Ej: Base Operativa Central"
                value={draftData.nombre || ""}
                onChange={(e) => onChange({ ...draftData, nombre: e.target.value })}
                className={`h-9 text-xs bg-card/70 ${
                  touchedName && !isNameValid ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                autoFocus
              />
            </div>

            {/* Descripcion Field */}
            <div className="space-y-1.5">
              <Label htmlFor="geofence-desc" className="text-xs font-semibold text-muted-foreground">
                Descripción (opcional)
              </Label>
              <Input
                id="geofence-desc"
                placeholder="Ej: Zona logística de carga y descarga matutina"
                value={draftData.descripcion || ""}
                onChange={(e) => onChange({ ...draftData, descripcion: e.target.value })}
                className="h-9 text-xs bg-card/70"
              />
            </div>

            {/* Geometry Type & Drawing Controller */}
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tipo de Geometría
                </Label>

                {/* Geometry status badge */}
                {isPolygon ? (
                  <Badge
                    variant={vertexCount >= 3 ? "default" : "secondary"}
                    className="text-[10px] font-mono h-5 gap-1"
                  >
                    {vertexCount >= 3 ? (
                      <>
                        <Check className="h-3 w-3" /> {vertexCount} Vértices
                      </>
                    ) : vertexCount > 0 ? (
                      `${vertexCount}/3 puntos`
                    ) : (
                      "Sin trazo"
                    )}
                  </Badge>
                ) : (
                  <Badge
                    variant={hasCircleCenter ? "default" : "secondary"}
                    className="text-[10px] font-mono h-5 gap-1"
                  >
                    {hasCircleCenter ? (
                      <>
                        <Check className="h-3 w-3" /> Radio: {draftData.radio || 300}m
                      </>
                    ) : (
                      "Sin centro"
                    )}
                  </Badge>
                )}
              </div>

              {/* Polygon / Circle Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border/50">
                <button
                  type="button"
                  onClick={() => handleTypeChange("Polígono")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    isPolygon
                      ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                  }`}
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>Polígono</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("Círculo")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    !isPolygon
                      ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                  }`}
                >
                  <CircleIcon className="h-3.5 w-3.5" />
                  <span>Círculo</span>
                </button>
              </div>

              {/* Map Action Button */}
              <div className="pt-1">
                {isPolygon ? (
                  <Button
                    type="button"
                    variant={drawingMode === "draw_polygon" || drawingMode === "edit_vertices" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (drawingMode === "draw_polygon" || drawingMode === "edit_vertices") {
                        setDrawingMode("none");
                      } else {
                        setDrawingMode(vertexCount >= 3 ? "edit_vertices" : "draw_polygon");
                      }
                    }}
                    className="w-full text-xs gap-2 h-9 rounded-xl font-semibold"
                  >
                    {drawingMode === "draw_polygon" || drawingMode === "edit_vertices" ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Editando en Mapa Activo
                      </>
                    ) : vertexCount > 0 ? (
                      <>
                        <Edit3 className="h-3.5 w-3.5" /> Modificar Vértices en Mapa
                      </>
                    ) : (
                      <>
                        <MousePointerClick className="h-3.5 w-3.5" /> Trazar Polígono en el Mapa
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant={drawingMode === "draw_circle" || drawingMode === "edit_vertices" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (drawingMode === "draw_circle" || drawingMode === "edit_vertices") {
                        setDrawingMode("none");
                      } else {
                        setDrawingMode(hasCircleCenter ? "edit_vertices" : "draw_circle");
                      }
                    }}
                    className="w-full text-xs gap-2 h-9 rounded-xl font-semibold"
                  >
                    {drawingMode === "draw_circle" || drawingMode === "edit_vertices" ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Ajustando Círculo en Mapa
                      </>
                    ) : hasCircleCenter ? (
                      <>
                        <Edit3 className="h-3.5 w-3.5" /> Ajustar Centro y Radio
                      </>
                    ) : (
                      <>
                        <MousePointerClick className="h-3.5 w-3.5" /> Fijar Centro en el Mapa
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Color and Opacity Picker Custom */}
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs">
              <ColorPickerCustom
                color={draftData.color || "#3B82F6"}
                opacity={draftData.opacidad ?? 0.25}
                onChangeColor={(color) => onChange({ ...draftData, color })}
                onChangeOpacity={(opacidad) => onChange({ ...draftData, opacidad })}
              />
            </div>
          </div>
        )}

        {/* ================= STEP 2: ASIGNAR FLOTA ================= */}
        {currentStep === 2 && (
          <FleetAssigner
            targetType={draftData.targetType || "ALL"}
            targetVehicles={draftData.targetVehicles || []}
            targetCategories={draftData.targetCategories || []}
            targetGroups={draftData.targetGroups || []}
            availableVehicles={availableVehicles}
            availableGroups={availableGroups}
            onChange={(updates) => onChange({ ...draftData, ...updates })}
          />
        )}

        {/* ================= STEP 3: ALERTAS & REGLAS ================= */}
        {currentStep === 3 && (
          <AlertRulesConfig
            alertEvents={draftData.alertEvents || ["EXIT"]}
            speedLimit={draftData.speedLimit}
            actionTypes={draftData.actionTypes || ["UI"]}
            emailRecipients={draftData.emailRecipients || ""}
            onChange={(updates) => onChange({ ...draftData, ...updates })}
          />
        )}
      </div>

      {/* ----------------- FOOTER ACTIONS ----------------- */}
      <div className="p-4 sm:p-5 border-t border-border/60 bg-card/70 backdrop-blur-md shrink-0 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="text-xs h-9 px-3.5 rounded-xl text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </Button>

        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrevStep}
              disabled={isSaving}
              className="text-xs h-9 px-3.5 rounded-xl gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isSaving}
              className="text-xs h-9 px-4 rounded-xl gap-1 font-semibold"
            >
              Siguiente <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSaving || !isNameValid}
              className="text-xs h-9 px-4 rounded-xl gap-1.5 font-bold shadow-md bg-amber-500 hover:bg-amber-600 text-slate-950"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" /> Guardar Geocerca
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
