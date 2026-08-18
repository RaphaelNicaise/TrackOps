"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  MessageSquareShare,
  Phone,
  PhoneCall,
  Save,
  Send,
  Sparkles,
  Truck,
  UserCheck,
  UserX,
  X,
  Zap,
} from "lucide-react";
import { Prospecto, updateProspectoStatus } from "@/lib/prospectos-actions";
import { appAlert } from "@/lib/alerts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface ProspectoDetailDialogProps {
  prospecto: Prospecto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated?: (updated: Prospecto) => void;
}

export const PIPELINE_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    description: string;
    badgeClass: string;
    activeBorder: string;
    icon: React.ElementType;
  }
> = {
  nuevo: {
    label: "Nuevo",
    description: "Recibido recientemente, pendiente de primer contacto.",
    badgeClass:
      "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/25",
    activeBorder: "border-sky-500 bg-sky-500/5 ring-1 ring-sky-500",
    icon: Clock,
  },
  contactado: {
    label: "Contactado",
    description: "Llamada o mensaje enviado, en conversación preliminar.",
    badgeClass:
      "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/25",
    activeBorder: "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500",
    icon: PhoneCall,
  },
  demo_agendada: {
    label: "Demo Agendada",
    description: "Reunión técnica o demostración del sistema programada.",
    badgeClass:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25",
    activeBorder: "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500",
    icon: Calendar,
  },
  convertido: {
    label: "Convertido",
    description: "Lead ganado. Alta de empresa cliente concretada.",
    badgeClass:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25",
    activeBorder: "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500",
    icon: CheckCircle2,
  },
  descartado: {
    label: "Descartado",
    description: "No califica, sin presupuesto o fuera de cobertura.",
    badgeClass:
      "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/25",
    activeBorder: "border-slate-500 bg-slate-500/5 ring-1 ring-slate-500",
    icon: UserX,
  },
};

export function ProspectoDetailDialog({
  prospecto,
  open,
  onOpenChange,
  onStatusUpdated,
}: ProspectoDetailDialogProps) {
  const [selectedEstado, setSelectedEstado] = useState<string>(
    () => prospecto?.estado || "nuevo"
  );
  const [notas, setNotas] = useState<string>(() => prospecto?.notas || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (prospecto) {
      setSelectedEstado(prospecto.estado || "nuevo");
      setNotas(prospecto.notas || "");
    }
  }, [prospecto, open]);

  if (!prospecto) return null;

  const currentConfig =
    PIPELINE_STATUS_CONFIG[selectedEstado] || PIPELINE_STATUS_CONFIG.nuevo;

  // Clean phone for WhatsApp link
  const cleanPhone = (prospecto.telefono || "").replace(/\D/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hola ${prospecto.nombre}, te contacto desde TrackOps respecto a tu solicitud de demo para ${
          prospecto.empresa || "tu flota"
        }.`
      )}`
    : null;

  const mailtoUrl = `mailto:${prospecto.email}?subject=${encodeURIComponent(
    "TrackOps - Demostración y Plataforma de Telemetría"
  )}&body=${encodeURIComponent(
    `Hola ${prospecto.nombre},\n\nGracias por tu interés en TrackOps.\n`
  )}`;

  const initials = prospecto.nombre
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateProspectoStatus(
        prospecto.id,
        selectedEstado,
        notas
      );
      if (res.success && res.prospecto) {
        appAlert.success(
          `El prospecto "${prospecto.nombre}" fue actualizado a estado "${PIPELINE_STATUS_CONFIG[selectedEstado]?.label || selectedEstado}".`,
          "Pipeline Actualizado"
        );
        onStatusUpdated?.(res.prospecto);
        onOpenChange(false);
      }
    } catch (err: any) {
      appAlert.error(
        err?.message || "Error al actualizar el estado del prospecto."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return "Fecha no registrada";
    try {
      const date = typeof d === "string" ? new Date(d) : d;
      return format(date, "dd 'de' MMMM yyyy, HH:mm 'hs'", { locale: es });
    } catch {
      return "Fecha inválida";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-border bg-card">
        {/* Top Header */}
        <div className="bg-muted/40 p-6 border-b border-border">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="font-mono text-xs bg-background/80"
                >
                  LEAD #{prospecto.id}
                </Badge>
                <Badge className={currentConfig.badgeClass}>
                  {currentConfig.label}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(prospecto.createdAt)}
              </span>
            </div>

            {/* Contact Hero */}
            <div className="flex items-start gap-3.5 pt-1">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base shrink-0">
                {initials || "LE"}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                  {prospecto.nombre}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    {prospecto.empresa || "Empresa no especificada"}
                  </span>
                  {prospecto.flotaEstimada != null && (
                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-foreground font-mono text-[11px]">
                      <Truck className="h-3 w-3 text-amber-500" />
                      Flota estimada: {prospecto.flotaEstimada} veh.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Quick Direct Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/60">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5"
                >
                  <MessageSquareShare className="h-3.5 w-3.5" />
                  Contactar por WhatsApp
                </Button>
              </a>
            )}

            <a href={mailtoUrl} className="inline-flex">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs font-medium text-foreground hover:bg-muted border-border gap-1.5"
              >
                <Mail className="h-3.5 w-3.5 text-sky-500" />
                {prospecto.email}
              </Button>
            </a>

            {prospecto.telefono && (
              <a href={`tel:${prospecto.telefono}`} className="inline-flex">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-mono text-muted-foreground hover:text-foreground border-border gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5 text-indigo-500" />
                  {prospecto.telefono}
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Inquiry Message Block */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              Mensaje de la Solicitud / Consulta
            </Label>
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border text-sm text-foreground leading-relaxed italic">
              {prospecto.mensaje ? (
                `“${prospecto.mensaje}”`
              ) : (
                <span className="text-muted-foreground not-italic text-xs">
                  Sin mensaje específico proporcionado en el formulario.
                </span>
              )}
            </div>
          </div>

          {/* Pipeline Stage Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Estado del Pipeline CRM
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(PIPELINE_STATUS_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = selectedEstado === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedEstado(key)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? config.activeBorder
                        : "border-border hover:border-border/80 bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {config.label}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                      {config.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Internal Notes Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="prospecto-notas"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Notas Internas de Seguimiento
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Visible solo para superadmins
              </span>
            </div>
            <textarea
              id="prospecto-notas"
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Registra detalles de llamadas, objeciones, fecha de demo, necesidades técnicas..."
              className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-xs resize-y"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="bg-muted/30 px-6 py-4 border-t border-border flex flex-row items-center justify-between sm:justify-between">
          <div className="text-[11px] text-muted-foreground font-mono hidden sm:block">
            Lead #{prospecto.id} · TrackOps CRM
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-1.5 shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
