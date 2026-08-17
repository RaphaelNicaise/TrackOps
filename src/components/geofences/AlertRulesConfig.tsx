"use client";

import React from "react";
import {
  Bell,
  Mail,
  Gauge,
  LogOut,
  LogIn,
  AlertTriangle,
  Radio,
  Sliders,
} from "lucide-react";
import { GeofenceAlertEvent } from "@/types/geofence";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface AlertRulesConfigProps {
  alertEvents?: GeofenceAlertEvent[];
  speedLimit?: number;
  actionTypes?: string[];
  emailRecipients?: string;
  onChange: (updates: {
    alertEvents: GeofenceAlertEvent[];
    speedLimit?: number;
    actionTypes?: string[];
    emailRecipients?: string;
  }) => void;
}

export function AlertRulesConfig({
  alertEvents = ["EXIT"],
  speedLimit = 40,
  actionTypes = ["UI"],
  emailRecipients = "",
  onChange,
}: AlertRulesConfigProps) {
  // Toggle specific alert event
  const handleToggleEvent = (event: GeofenceAlertEvent, checked: boolean) => {
    let updated = [...alertEvents];
    if (checked) {
      if (!updated.includes(event)) updated.push(event);
    } else {
      updated = updated.filter((e) => e !== event);
    }
    onChange({
      alertEvents: updated,
      speedLimit,
      actionTypes,
      emailRecipients,
    });
  };

  // Toggle action channel (UI or EMAIL)
  const handleToggleAction = (action: string, checked: boolean) => {
    let updated = [...(actionTypes || [])];
    if (checked) {
      if (!updated.includes(action)) updated.push(action);
    } else {
      updated = updated.filter((a) => a !== action);
    }
    onChange({
      alertEvents,
      speedLimit,
      actionTypes: updated,
      emailRecipients,
    });
  };

  const hasExit = alertEvents.includes("EXIT");
  const hasEnter = alertEvents.includes("ENTER");
  const hasSpeedLimit = alertEvents.includes("SPEED_LIMIT");
  const hasUiAction = (actionTypes || []).includes("UI");
  const hasEmailAction = (actionTypes || []).includes("EMAIL");

  return (
    <div className="space-y-5">
      {/* ----------------- SECTION 1: TRIGGERS / EVENTS ----------------- */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Disparadores de Eventos
          </h4>
        </div>

        <div className="space-y-2.5">
          {/* 1. EXIT Trigger */}
          <div
            className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 shadow-xs ${
              hasExit
                ? "bg-card border-red-500/30 ring-1 ring-red-500/20"
                : "bg-card/60 border-border/70"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl border shrink-0 ${
                  hasExit
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                <LogOut className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="switch-exit" className="text-xs font-bold text-foreground cursor-pointer">
                  Salida de Perímetro (Fuera de rango)
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Genera una alerta inmediata cuando un vehículo asignado abandona la zona autorizada.
                </p>
              </div>
            </div>
            <Switch
              id="switch-exit"
              checked={hasExit}
              onCheckedChange={(checked) => handleToggleEvent("EXIT", checked)}
            />
          </div>

          {/* 2. ENTER Trigger */}
          <div
            className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 shadow-xs ${
              hasEnter
                ? "bg-card border-emerald-500/30 ring-1 ring-emerald-500/20"
                : "bg-card/60 border-border/70"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl border shrink-0 ${
                  hasEnter
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                <LogIn className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="switch-enter" className="text-xs font-bold text-foreground cursor-pointer">
                  Ingreso a Perímetro
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Registra el arribo del móvil o notifica al operador cuando ingresa a la geocerca.
                </p>
              </div>
            </div>
            <Switch
              id="switch-enter"
              checked={hasEnter}
              onCheckedChange={(checked) => handleToggleEvent("ENTER", checked)}
            />
          </div>

          {/* 3. SPEED_LIMIT Trigger */}
          <div
            className={`p-3.5 rounded-2xl border transition-all duration-200 space-y-3 shadow-xs ${
              hasSpeedLimit
                ? "bg-card border-amber-500/30 ring-1 ring-amber-500/20"
                : "bg-card/60 border-border/70"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl border shrink-0 ${
                    hasSpeedLimit
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <Gauge className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="switch-speed" className="text-xs font-bold text-foreground cursor-pointer">
                    Límite de Velocidad Máxima en Zona
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Fiscaliza excesos de velocidad dentro de este perímetro específico.
                  </p>
                </div>
              </div>
              <Switch
                id="switch-speed"
                checked={hasSpeedLimit}
                onCheckedChange={(checked) => handleToggleEvent("SPEED_LIMIT", checked)}
              />
            </div>

            {hasSpeedLimit && (
              <div className="pt-2 border-t border-border/60 flex flex-col gap-2 bg-muted/30 p-2.5 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Velocidad Máxima Permitida:
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground px-2 py-0.5 rounded-md bg-card border">
                    {speedLimit || 40} km/h
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground font-mono">20 km/h</span>
                  <input
                    type="range"
                    min="20"
                    max="120"
                    step="5"
                    value={speedLimit || 40}
                    onChange={(e) =>
                      onChange({
                        alertEvents,
                        speedLimit: Number(e.target.value),
                        actionTypes,
                        emailRecipients,
                      })
                    }
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-[10px] text-muted-foreground font-mono">120 km/h</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- SECTION 2: NOTIFICATION CHANNELS ----------------- */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Canales de Notificación
          </h4>
        </div>

        <div className="space-y-2.5">
          {/* Channel: UI Live Notifications */}
          <div className="p-3 rounded-2xl border border-border/70 bg-card flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="switch-ui" className="text-xs font-bold text-foreground cursor-pointer">
                  Notificaciones en Vivo (Dashboard)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Alerta sonora y banner visual en la consola de monitoreo.
                </p>
              </div>
            </div>
            <Switch
              id="switch-ui"
              checked={hasUiAction}
              onCheckedChange={(checked) => handleToggleAction("UI", checked)}
            />
          </div>

          {/* Channel: Email Notifications */}
          <div className="p-3 rounded-2xl border border-border/70 bg-card space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="switch-email" className="text-xs font-bold text-foreground cursor-pointer">
                    Enviar Correo a Supervisores
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Despacha emails de alerta automática ante cada evento.
                  </p>
                </div>
              </div>
              <Switch
                id="switch-email"
                checked={hasEmailAction}
                onCheckedChange={(checked) => handleToggleAction("EMAIL", checked)}
              />
            </div>

            {hasEmailAction && (
              <div className="pt-2 border-t border-border/50">
                <Label htmlFor="geofence-email-recipients" className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  Destinatarios (separados por coma):
                </Label>
                <Input
                  id="geofence-email-recipients"
                  type="email"
                  multiple
                  placeholder="supervisor@trackops.com, logistica@empresa.com"
                  value={emailRecipients}
                  onChange={(e) =>
                    onChange({
                      alertEvents,
                      speedLimit,
                      actionTypes,
                      emailRecipients: e.target.value,
                    })
                  }
                  className="h-8.5 text-xs bg-card/70 font-mono"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
