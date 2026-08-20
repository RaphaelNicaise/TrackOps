"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Mail,
  MessageSquare,
  Wrench,
  FileText,
  MapPin,
  Clock,
  Bell,
  AlertCircle,
  Car,
  Layers,
} from "lucide-react";
import type { AlertLog } from "@/db/schema";

interface AlertsHistoryTableProps {
  alerts: AlertLog[];
  onSelectAlert: (alert: AlertLog) => void;
  isLoading?: boolean;
}

export function AlertsHistoryTable({
  alerts,
  onSelectAlert,
  isLoading = false,
}: AlertsHistoryTableProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getModuleBadge = (modulo: string) => {
    switch (modulo) {
      case "MANTENIMIENTO":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] font-medium flex items-center gap-1 w-fit">
            <Wrench className="h-3 w-3" /> Mantenimiento
          </Badge>
        );
      case "DOCUMENTACION":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[11px] font-medium flex items-center gap-1 w-fit">
            <FileText className="h-3 w-3" /> Documentación
          </Badge>
        );
      case "GEOCERCAS":
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[11px] font-medium flex items-center gap-1 w-fit">
            <MapPin className="h-3 w-3" /> Geocercas
          </Badge>
        );
      case "HORARIOS":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-medium flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" /> Horarios
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px] font-medium flex items-center gap-1 w-fit">
            <Bell className="h-3 w-3" /> {modulo}
          </Badge>
        );
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICA":
        return (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[11px]">
            Crítica
          </Badge>
        );
      case "ALTA":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[11px]">
            Alta
          </Badge>
        );
      case "MEDIA":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px]">
            Media
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[11px]">
            Baja
          </Badge>
        );
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-border/80 bg-card p-12 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            No se encontraron alertas registradas
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No hay alertas que coincidan con los criterios de filtro seleccionados o la flota no ha
            registrado incidencias.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs uppercase tracking-wider py-3.5">
                Fecha / Hora
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider py-3.5">
                Vehículo
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider py-3.5">
                Módulo
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider py-3.5">
                Severidad
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider py-3.5">
                Canales &amp; Destinatarios
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider py-3.5 max-w-[280px]">
                Asunto / Mensaje
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider py-3.5">
                Estado
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider py-3.5 text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow
                key={alert.id}
                className="hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => onSelectAlert(alert)}
              >
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(alert.createdAt)}
                </TableCell>

                <TableCell>
                  {alert.patente ? (
                    <span className="font-mono font-bold text-xs bg-muted/80 px-2 py-0.5 rounded border border-border/80 text-foreground">
                      {alert.patente}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Flota general</span>
                  )}
                </TableCell>

                <TableCell>{getModuleBadge(alert.modulo)}</TableCell>

                <TableCell>{getSeverityBadge(alert.severidad)}</TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {alert.destinatarioEmail && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                        <span className="truncate max-w-[140px] font-mono text-[11px]">
                          {alert.destinatarioEmail}
                        </span>
                      </div>
                    )}
                    {alert.destinatarioWhatsapp && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        <span className="truncate max-w-[140px] font-mono text-[11px]">
                          {alert.destinatarioWhatsapp}
                        </span>
                      </div>
                    )}
                    {!alert.destinatarioEmail && !alert.destinatarioWhatsapp && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {alert.canal}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="max-w-[280px]">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground line-clamp-1">
                      {alert.titulo}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {alert.mensaje}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  >
                    {alert.estado}
                  </Badge>
                </TableCell>

                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs font-medium gap-1 text-primary hover:bg-primary/10"
                    onClick={() => onSelectAlert(alert)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Ver Detalle</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
