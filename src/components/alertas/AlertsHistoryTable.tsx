"use client";

import React, { useState, useMemo } from "react";
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
  Truck,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertLog } from "@/db/schema";

type SortKey = "createdAt" | "patente" | "modulo" | "severidad" | "canal" | "titulo";
type SortState = { key: SortKey; dir: "asc" | "desc" };

interface AlertsHistoryTableProps {
  alerts: AlertLog[];
  onSelectAlert: (alert: AlertLog) => void;
  isLoading?: boolean;
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState | null;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = sort?.key === sortKey;
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 select-none transition-colors",
          isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        {isActive ? (
          sort!.dir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function AlertsHistoryTable({
  alerts,
  onSelectAlert,
  isLoading = false,
}: AlertsHistoryTableProps) {
  const [sort, setSort] = useState<SortState | null>({ key: "createdAt", dir: "desc" });

  const sortedAlerts = useMemo(() => {
    if (!sort) return alerts;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...alerts].sort((a, b) => {
      let va: any = a[sort.key as keyof AlertLog];
      let vb: any = b[sort.key as keyof AlertLog];

      if (sort.key === "createdAt") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (timeA - timeB) * dir;
      }

      if (va == null && vb == null) return 0;
      if (va == null) return dir;
      if (vb == null) return -dir;
      return String(va).localeCompare(String(vb), "es") * dir;
    });
  }, [alerts, sort]);

  const handleSort = (key: SortKey) => {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

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
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium gap-1">
            <Wrench className="h-3 w-3" /> Mantenimiento
          </Badge>
        );
      case "DOCUMENTACION":
        return (
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium gap-1">
            <FileText className="h-3 w-3" /> Documentos
          </Badge>
        );
      case "GEOCERCAS":
        return (
          <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-medium gap-1">
            <MapPin className="h-3 w-3" /> Geocercas
          </Badge>
        );
      case "HORARIOS":
        return (
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium gap-1">
            <Clock className="h-3 w-3" /> Horarios
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px] font-medium gap-1">
            <Bell className="h-3 w-3" /> {modulo}
          </Badge>
        );
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICA":
        return (
          <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-semibold">
            Crítica
          </Badge>
        );
      case "ALTA":
        return (
          <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-semibold">
            Alta
          </Badge>
        );
      case "MEDIA":
        return (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
            Media
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium">
            Baja
          </Badge>
        );
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            No se encontraron alertas
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No hay alertas que coincidan con los filtros aplicados o no se registraron eventos recientes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortHeader label="Fecha / Hora" sortKey="createdAt" sort={sort} onSort={handleSort} />
            <SortHeader label="Vehículo" sortKey="patente" sort={sort} onSort={handleSort} />
            <SortHeader label="Módulo" sortKey="modulo" sort={sort} onSort={handleSort} />
            <SortHeader label="Severidad" sortKey="severidad" sort={sort} onSort={handleSort} />
            <TableHead>Canal & Destinatario</TableHead>
            <SortHeader label="Mensaje / Evento" sortKey="titulo" sort={sort} onSort={handleSort} className="max-w-[320px]" />
            <TableHead className="w-12 text-right">
              <span className="sr-only">Detalle</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAlerts.map((alert) => (
            <TableRow
              key={alert.id}
              className="hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={() => onSelectAlert(alert)}
            >
              <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(alert.createdAt)}
              </TableCell>

              <TableCell>
                {alert.patente ? (
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Truck className="h-3 w-3 text-primary" />
                    </span>
                    <span className="font-mono font-semibold text-xs tracking-wide uppercase group-hover:text-primary transition-colors">
                      {alert.patente}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Flota general</span>
                )}
              </TableCell>

              <TableCell>{getModuleBadge(alert.modulo)}</TableCell>

              <TableCell>{getSeverityBadge(alert.severidad)}</TableCell>

              <TableCell>
                <div className="space-y-0.5">
                  {alert.destinatarioEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[150px] font-mono text-[11px]">
                        {alert.destinatarioEmail}
                      </span>
                    </div>
                  )}
                  {alert.destinatarioWhatsapp && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="truncate max-w-[150px] font-mono text-[11px]">
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

              <TableCell className="max-w-[320px]">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground line-clamp-1">
                    {alert.titulo}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {alert.mensaje}
                  </p>
                </div>
              </TableCell>

              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => onSelectAlert(alert)}
                  title="Ver detalle"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
