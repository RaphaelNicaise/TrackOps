"use client";

import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  Search,
  Clock,
  Gauge,
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  Truck,
  Filter,
  ArrowUpDown,
  Download,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { ScheduleViolation } from "@/types/schedule";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export interface ViolationsTableProps {
  violations: ScheduleViolation[];
  isLoading?: boolean;
  onSelectViolation?: (violation: ScheduleViolation) => void;
}

export function ViolationsTable({
  violations,
  isLoading = false,
  onSelectViolation,
}: ViolationsTableProps) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [scheduleFilter, setScheduleFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Format date helper (es-AR localized)
  const formatDateTime = (dateStr?: string): { date: string; time: string } => {
    if (!dateStr) return { date: "—", time: "" };
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        time: d.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  // Compute severity level for a violation
  const getSeverity = (v: ScheduleViolation) => {
    if (v.duracionMinutos >= 30 || v.velocidadMaxima >= 70) {
      return {
        level: "HIGH",
        label: "Crítica",
        badgeClass: "bg-red-500/15 text-red-500 border-red-500/30",
        dotClass: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
      };
    }
    if (v.duracionMinutos >= 15 || v.velocidadMaxima >= 45) {
      return {
        level: "MEDIUM",
        label: "Moderada",
        badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
        dotClass: "bg-amber-500",
      };
    }
    return {
      level: "LOW",
      label: "Leve",
      badgeClass: "bg-blue-500/15 text-blue-500 border-blue-500/30",
      dotClass: "bg-blue-500",
    };
  };

  // Distinct schedule names for filter
  const distinctSchedules = useMemo(() => {
    const set = new Set<string>();
    violations.forEach((v) => {
      if (v.scheduleNombre) set.add(v.scheduleNombre);
    });
    return Array.from(set);
  }, [violations]);

  // Filtered & searched violations
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.patente.toLowerCase().includes(q) ||
        (v.scheduleNombre && v.scheduleNombre.toLowerCase().includes(q)) ||
        v.vehicleId.toString().includes(q);

      if (!matchesSearch) return false;

      if (scheduleFilter !== "ALL" && v.scheduleNombre !== scheduleFilter) {
        return false;
      }

      if (severityFilter !== "ALL") {
        const sev = getSeverity(v).level;
        if (sev !== severityFilter) return false;
      }

      return true;
    });
  }, [violations, search, scheduleFilter, severityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage) || 1;
  const paginatedViolations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredViolations.slice(start, start + itemsPerPage);
  }, [filteredViolations, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por patente o regla horaria..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8.5 h-9 text-xs bg-card"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Schedule Select Filter */}
          {distinctSchedules.length > 0 && (
            <select
              value={scheduleFilter}
              onChange={(e) => {
                setScheduleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-xl border border-input bg-card text-xs font-medium text-foreground cursor-pointer outline-hidden hover:bg-muted transition-colors"
            >
              <option value="ALL">Todas las reglas horarias</option>
              {distinctSchedules.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}

          {/* Severity Filter */}
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/70">
            <button
              type="button"
              onClick={() => {
                setSeverityFilter("ALL");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                severityFilter === "ALL"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => {
                setSeverityFilter("HIGH");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                severityFilter === "HIGH"
                  ? "bg-red-500/20 text-red-400 font-bold"
                  : "text-muted-foreground hover:text-red-400"
              }`}
            >
              Críticas
            </button>
            <button
              type="button"
              onClick={() => {
                setSeverityFilter("MEDIUM");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                severityFilter === "MEDIUM"
                  ? "bg-amber-500/20 text-amber-400 font-bold"
                  : "text-muted-foreground hover:text-amber-400"
              }`}
            >
              Moderadas
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Fecha / Hora
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Vehículo
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Regla Horaria
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Duración
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Velocidad Máx.
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                Notificaciones
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 text-right">
                Gravedad
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border/40">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                  Cargando registro de infracciones...
                </TableCell>
              </TableRow>
            ) : paginatedViolations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-xs font-medium">No se registraron infracciones de horario</p>
                    <p className="text-[11px] text-muted-foreground/70">
                      Todos los móviles se encuentran operando dentro de los esquemas autorizados.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedViolations.map((v) => {
                const formatted = formatDateTime(v.fechaInicio);
                const sev = getSeverity(v);

                return (
                  <TableRow
                    key={v.id}
                    onClick={() => onSelectViolation && onSelectViolation(v)}
                    className={`transition-colors border-border/40 ${
                      onSelectViolation ? "cursor-pointer hover:bg-muted/40" : ""
                    }`}
                  >
                    {/* Fecha / Hora */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <div className="font-mono text-xs font-semibold text-foreground">
                            {formatted.date}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {formatted.time} hs
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Vehículo */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border/50">
                          {v.patente}
                        </span>
                      </div>
                    </TableCell>

                    {/* Regla Horaria */}
                    <TableCell className="py-3">
                      <div className="text-xs font-medium text-foreground">
                        {v.scheduleNombre || `Regla #${v.scheduleId || "—"}`}
                      </div>
                    </TableCell>

                    {/* Duración */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                        <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>{v.duracionMinutos} min</span>
                      </div>
                    </TableCell>

                    {/* Velocidad Máx */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                        <Gauge className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{v.velocidadMaxima} km/h</span>
                      </div>
                    </TableCell>

                    {/* Notificaciones */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 text-[10px] gap-1 text-primary border-primary/30 bg-primary/5"
                          title="Notificado en Consola"
                        >
                          <Bell className="h-2.5 w-2.5" />
                          UI
                        </Badge>
                        {v.notificadoEmail && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] gap-1 text-blue-500 border-blue-500/30 bg-blue-500/5"
                            title="Despachado por Email"
                          >
                            <Mail className="h-2.5 w-2.5" />
                            Email
                          </Badge>
                        )}
                        {v.notificadoWhatsapp && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] gap-1 text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
                            title="Despachado por WhatsApp"
                          >
                            <MessageSquare className="h-2.5 w-2.5" />
                            WA
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Gravedad */}
                    <TableCell className="py-3 text-right">
                      <Badge
                        variant="outline"
                        className={`font-semibold text-[10px] px-2 py-0.5 ${sev.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sev.dotClass}`} />
                        {sev.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {filteredViolations.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <div>
            Mostrando{" "}
            <span className="font-bold text-foreground">
              {Math.min((currentPage - 1) * itemsPerPage + 1, filteredViolations.length)} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredViolations.length)}
            </span>{" "}
            de <span className="font-bold text-foreground">{filteredViolations.length}</span> infracciones
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="h-8 w-8 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="h-8 w-8 rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
