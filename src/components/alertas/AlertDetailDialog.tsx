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
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium gap-1">
            <Wrench className="h-3 w-3" /> Mantenimiento
          </Badge>
        );
      case "DOCUMENTACION":
        return (
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium gap-1">
            <FileText className="h-3 w-3" /> Documentos
          </Badge>
        );
      case "GEOCERCAS":
        return (
          <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium gap-1">
            <MapPin className="h-3 w-3" /> Geocercas
          </Badge>
        );
      case "HORARIOS":
        return (
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium gap-1">
            <Clock className="h-3 w-3" /> Horarios
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs font-medium gap-1">
            <Bell className="h-3 w-3" /> {modulo}
          </Badge>
        );
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICA":
        return (
          <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
            CRÍTICA
          </Badge>
        );
      case "ALTA":
        return (
          <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold">
            ALTA
          </Badge>
        );
      case "MEDIA":
        return (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
            MEDIA
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">
              ID #{alert.id}
            </Badge>
            {getModuleBadge(alert.modulo)}
            {getSeverityBadge(alert.severidad)}
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Detalle de Alerta
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
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
