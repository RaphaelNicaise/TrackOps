"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Mail,
  MessageSquare,
  Car,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Shield,
  Layers,
  Wrench,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { AlertLog } from "@/db/schema";

interface AlertDetailDialogProps {
  alert: AlertLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertDetailDialog({ alert, open, onOpenChange }: AlertDetailDialogProps) {
  if (!alert) return null;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Fecha no disponible";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getModuleBadge = (modulo: string) => {
    switch (modulo) {
      case "MANTENIMIENTO":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1">
            <Wrench className="h-3 w-3" /> Mantenimiento
          </Badge>
        );
      case "DOCUMENTACION":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 flex items-center gap-1">
            <FileText className="h-3 w-3" /> Documentación
          </Badge>
        );
      case "GEOCERCAS":
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Geocercas
          </Badge>
        );
      case "HORARIOS":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Horarios
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="h-3 w-3" /> {modulo}
          </Badge>
        );
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICA":
        return (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30">
            CRÍTICA
          </Badge>
        );
      case "ALTA":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">
            ALTA
          </Badge>
        );
      case "MEDIA":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
            MEDIA
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">
            BAJA
          </Badge>
        );
    }
  };

  let parsedMetadata: any = null;
  if (alert.metadata) {
    try {
      parsedMetadata = typeof alert.metadata === "string" ? JSON.parse(alert.metadata) : alert.metadata;
    } catch {
      parsedMetadata = alert.metadata;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">
              ID #{alert.id}
            </Badge>
            {getModuleBadge(alert.modulo)}
            {getSeverityBadge(alert.severidad)}
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-mono"
            >
              {alert.estado}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Detalle de Alerta Despachada
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground flex items-center gap-1.5 font-mono">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(alert.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Main Title & Message Box */}
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
            <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              {alert.titulo}
            </h4>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {alert.mensaje}
            </p>
          </div>

          {/* Vehicle Information */}
          <div className="rounded-lg border p-4 space-y-3 bg-card">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-primary" />
              Vehículo Asociado
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Patente / Dominio:</span>
                <span className="font-mono font-bold text-foreground bg-muted/80 px-2 py-0.5 rounded border border-border/80 inline-block mt-0.5">
                  {alert.patente || "Sin vehículo específico"}
                </span>
              </div>
              {alert.vehiculoId && (
                <div>
                  <span className="text-xs text-muted-foreground block">ID Vehículo:</span>
                  <span className="font-mono text-foreground mt-0.5 block">
                    #{alert.vehiculoId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Dispatch Channels & Recipients */}
          <div className="rounded-lg border p-4 space-y-3 bg-card">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Canales &amp; Destinatarios
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-md bg-muted/30 border space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-xs text-indigo-600 dark:text-indigo-400">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Canal Email</span>
                </div>
                <p className="font-mono text-xs text-foreground truncate">
                  {alert.destinatarioEmail || "No despachado por Email"}
                </p>
              </div>

              <div className="p-3 rounded-md bg-muted/30 border space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-xs text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Canal WhatsApp</span>
                </div>
                <p className="font-mono text-xs text-foreground truncate">
                  {alert.destinatarioWhatsapp || "No despachado por WhatsApp"}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata JSON Viewer */}
          {parsedMetadata && (
            <div className="rounded-lg border p-4 space-y-2 bg-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-primary" />
                Metadatos Técnicos del Evento
              </h4>
              <pre className="p-3 rounded-md bg-muted text-xs font-mono overflow-x-auto text-foreground max-h-40">
                {typeof parsedMetadata === "object"
                  ? JSON.stringify(parsedMetadata, null, 2)
                  : parsedMetadata}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
