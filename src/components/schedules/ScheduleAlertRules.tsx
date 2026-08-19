"use client";

import React from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Clock,
  Radio,
  Sliders,
  ShieldAlert,
  Info,
} from "lucide-react";
import { ScheduleAlertChannel } from "@/types/schedule";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ScheduleAlertRulesProps {
  toleranciaMinutos?: number;
  alertChannels?: ScheduleAlertChannel[];
  emailRecipients?: string;
  whatsappRecipients?: string;
  onChange: (updates: {
    toleranciaMinutos: number;
    alertChannels: ScheduleAlertChannel[];
    emailRecipients?: string;
    whatsappRecipients?: string;
  }) => void;
  disabled?: boolean;
}

export const TOLERANCE_PRESETS = [
  { value: 0, label: "Sin Tolerancia (0 min)", shortLabel: "0 min" },
  { value: 5, label: "5 Minutos (Recomendado)", shortLabel: "5 min" },
  { value: 10, label: "10 Minutos", shortLabel: "10 min" },
  { value: 15, label: "15 Minutos", shortLabel: "15 min" },
  { value: 30, label: "30 Minutos", shortLabel: "30 min" },
];

export function ScheduleAlertRules({
  toleranciaMinutos = 5,
  alertChannels = ["UI"],
  emailRecipients = "",
  whatsappRecipients = "",
  onChange,
  disabled = false,
}: ScheduleAlertRulesProps) {
  // Toggle notification channel (UI, EMAIL, WHATSAPP)
  const handleToggleChannel = (
    channel: ScheduleAlertChannel,
    checked: boolean
  ) => {
    let updated = [...alertChannels];
    if (checked) {
      if (!updated.includes(channel)) updated.push(channel);
    } else {
      updated = updated.filter((c) => c !== channel);
    }
    onChange({
      toleranciaMinutos,
      alertChannels: updated,
      emailRecipients,
      whatsappRecipients,
    });
  };

  const hasUi = alertChannels.includes("UI");
  const hasEmail = alertChannels.includes("EMAIL");
  const hasWhatsapp = alertChannels.includes("WHATSAPP");

  return (
    <div className="space-y-6">
      {/* ----------------- SECTION 1: TOLERANCIA OPERATIVA ----------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tolerancia Operativa de Salida / Entrada
            </h4>
          </div>
          <Badge variant="outline" className="font-mono text-xs text-amber-500 border-amber-500/30">
            {toleranciaMinutos === 0 ? "Inmediata (0m)" : `+${toleranciaMinutos} minutos`}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Margen de gracia antes de disparar la alerta cuando el móvil se enciende o circula fuera del horario asignado.
          Evita falsos positivos por movimientos de estacionamiento o demoras mínimas de guardia.
        </p>

        {/* Tolerance Preset Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TOLERANCE_PRESETS.map((preset) => {
            const isSelected = toleranciaMinutos === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    toleranciaMinutos: preset.value,
                    alertChannels,
                    emailRecipients,
                    whatsappRecipients,
                  })
                }
                className={`p-2.5 rounded-2xl border text-center transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500 text-foreground font-bold shadow-xs ring-1 ring-amber-500/40"
                    : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <span className="font-mono text-xs">{preset.shortLabel}</span>
                <span className="text-[10px] opacity-75">
                  {preset.value === 5 ? "Recomendado" : preset.value === 0 ? "Estricto" : "Gracia"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom tolerance slider if user wants fine grain */}
        <div className="pt-2 flex items-center gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/50">
          <Sliders className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">Ajuste fino:</span>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={toleranciaMinutos}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  toleranciaMinutos: Number(e.target.value),
                  alertChannels,
                  emailRecipients,
                  whatsappRecipients,
                })
              }
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
          <span className="text-xs font-mono font-bold text-foreground px-2 py-0.5 rounded-md bg-card border">
            {toleranciaMinutos} min
          </span>
        </div>
      </div>

      {/* ----------------- SECTION 2: CANALES DE NOTIFICACIÓN ----------------- */}
      <div className="space-y-3 pt-2 border-t border-border/60">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Canales de Disparo y Notificación
          </h4>
        </div>

        <div className="space-y-3">
          {/* Channel 1: Plataforma UI (In-App) */}
          <div
            className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 shadow-xs ${
              hasUi
                ? "bg-card border-primary/30 ring-1 ring-primary/20"
                : "bg-card/60 border-border/70"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl border shrink-0 ${
                  hasUi
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <Label
                  htmlFor="channel-ui"
                  className="text-xs font-bold text-foreground cursor-pointer"
                >
                  Consola TrackOps (En Vivo)
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Muestra la alerta visual e iconografía de advertencia en el mapa en vivo y en la tabla de infracciones.
                </p>
              </div>
            </div>
            <Switch
              id="channel-ui"
              checked={hasUi}
              disabled={disabled}
              onCheckedChange={(checked) => handleToggleChannel("UI", checked)}
            />
          </div>

          {/* Channel 2: Correo Electrónico (Email) */}
          <div
            className={`p-3.5 rounded-2xl border transition-all duration-200 space-y-2.5 shadow-xs ${
              hasEmail
                ? "bg-card border-blue-500/30 ring-1 ring-blue-500/20"
                : "bg-card/60 border-border/70"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl border shrink-0 ${
                    hasEmail
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <Label
                    htmlFor="channel-email"
                    className="text-xs font-bold text-foreground cursor-pointer"
                  >
                    Alerta por Correo Electrónico
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Despacha un informe inmediato con la patente, horario detectado y ubicación del vehículo.
                  </p>
                </div>
              </div>
              <Switch
                id="channel-email"
                checked={hasEmail}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  handleToggleChannel("EMAIL", checked)
                }
              />
            </div>

            {hasEmail && (
              <div className="pt-2 border-t border-border/50">
                <Label
                  htmlFor="schedule-email-recipients"
                  className="text-[11px] font-semibold text-muted-foreground mb-1 block"
                >
                  Direcciones de correo (separadas por comas):
                </Label>
                <Input
                  id="schedule-email-recipients"
                  type="email"
                  multiple
                  disabled={disabled}
                  placeholder="guardia@empresa.com, flota@seguridad.com"
                  value={emailRecipients}
                  onChange={(e) =>
                    onChange({
                      toleranciaMinutos,
                      alertChannels,
                      emailRecipients: e.target.value,
                      whatsappRecipients,
                    })
                  }
                  className="h-8.5 text-xs bg-card/70 font-mono"
                />
              </div>
            )}
          </div>

          {/* Channel 3: WhatsApp Bot / SMS */}
          <div
            className={`p-3.5 rounded-2xl border transition-all duration-200 space-y-2.5 shadow-xs ${
              hasWhatsapp
                ? "bg-card border-emerald-500/30 ring-1 ring-emerald-500/20"
                : "bg-card/60 border-border/70"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl border shrink-0 ${
                    hasWhatsapp
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <Label
                    htmlFor="channel-whatsapp"
                    className="text-xs font-bold text-foreground cursor-pointer"
                  >
                    Alerta por WhatsApp Directo
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Envío instantáneo vía bot de WhatsApp a los teléfonos de los encargados de seguridad y logística.
                  </p>
                </div>
              </div>
              <Switch
                id="channel-whatsapp"
                checked={hasWhatsapp}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  handleToggleChannel("WHATSAPP", checked)
                }
              />
            </div>

            {hasWhatsapp && (
              <div className="pt-2 border-t border-border/50">
                <Label
                  htmlFor="schedule-whatsapp-recipients"
                  className="text-[11px] font-semibold text-muted-foreground mb-1 block"
                >
                  Números telefónicos con código de país (separados por comas):
                </Label>
                <Input
                  id="schedule-whatsapp-recipients"
                  type="text"
                  disabled={disabled}
                  placeholder="+5491145678901, +5492914123456"
                  value={whatsappRecipients}
                  onChange={(e) =>
                    onChange({
                      toleranciaMinutos,
                      alertChannels,
                      emailRecipients,
                      whatsappRecipients: e.target.value,
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
