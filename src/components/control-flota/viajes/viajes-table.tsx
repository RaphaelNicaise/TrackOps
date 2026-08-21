"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Search,
  Route,
  MapPin,
  ExternalLink,
  ArrowRight,
  Truck,
  User,
  Calendar,
  Clock,
  Gauge,
  Ban,
  RotateCcw,
  X,
  Plus,
  Navigation,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type {
  ViajeRow,
  ViajeEstado,
  SitioRow,
  ChoferRow,
} from "@/types/flota-viajes";
import {
  ViajeFormDialog,
  CancelViajeDialog,
  type VehicleOption,
} from "./viaje-form-dialog";

export interface ViajesTableProps {
  initialViajes?: ViajeRow[];
  viajes?: ViajeRow[];
  choferes?: ChoferRow[];
  sitios?: SitioRow[];
  vehicles?: VehicleOption[];
}

type StatusTab = "TODOS" | "PLANIFICADO" | "EN_CURSO" | "COMPLETADO" | "CANCELADO";

function formatDateTime(date?: Date | string | null): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return format(d, "dd/MM/yyyy HH:mm");
  } catch {
    return "-";
  }
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getStatusBadge(estado: ViajeEstado) {
  switch (estado) {
    case "PLANIFICADO":
      return {
        label: "PLANIFICADO",
        className: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
        pulsing: false,
      };
    case "EN_CURSO":
      return {
        label: "EN CURSO",
        className: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
        pulsing: true,
      };
    case "COMPLETADO":
      return {
        label: "COMPLETADO",
        className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        pulsing: false,
      };
    case "CANCELADO":
      return {
        label: "CANCELADO",
        className: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
        pulsing: false,
      };
    default:
      return {
        label: estado,
        className: "bg-muted text-muted-foreground border-border",
        pulsing: false,
      };
  }
}

export function ViajesTable({
  initialViajes,
  viajes: viajesProp,
  choferes = [],
  sitios = [],
  vehicles = [],
}: ViajesTableProps) {
  const router = useRouter();
  const tripList = viajesProp || initialViajes || [];

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("TODOS");
  const [cancelingViaje, setCancelingViaje] = useState<ViajeRow | null>(null);

  // Dynamic status counts
  const counts = useMemo(() => {
    let total = tripList.length;
    let planificados = 0;
    let enCurso = 0;
    let completados = 0;
    let cancelados = 0;

    for (const v of tripList) {
      if (v.estado === "PLANIFICADO") planificados++;
      else if (v.estado === "EN_CURSO") enCurso++;
      else if (v.estado === "COMPLETADO") completados++;
      else if (v.estado === "CANCELADO") cancelados++;
    }

    return { total, planificados, enCurso, completados, cancelados };
  }, [tripList]);

  // Filtering
  const filtered = useMemo(() => {
    let result = tripList;

    if (tab !== "TODOS") {
      result = result.filter((v) => v.estado === tab);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((v) =>
        [
          v.codigo,
          v.origenNombre,
          v.origenDireccion,
          v.destinoNombre,
          v.destinoDireccion,
          v.choferNombre ?? "",
          v.vehiculoPatente ?? "",
          v.notas ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return result;
  }, [tripList, tab, query]);

  function handleResetFilters() {
    setQuery("");
    setTab("TODOS");
  }

  const hasActiveFilters = query.trim() !== "" || tab !== "TODOS";

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 1. Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Viajes y Despacho</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {tripList.length} viajes registrados en el sistema
          </p>
        </div>

        <ViajeFormDialog
          sitios={sitios}
          choferes={choferes}
          vehicles={vehicles}
          trigger={
            <Button size="sm" className="gap-2 shadow-xs">
              <Plus className="h-4 w-4" />
              + Nuevo Viaje
            </Button>
          }
        />
      </div>

      {/* 2. Pestañas de Estado en Línea con Micro-Contadores */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b pb-2 -mb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setTab("TODOS")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            tab === "TODOS"
              ? "bg-muted text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <span>Todos</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              tab === "TODOS"
                ? "bg-background text-foreground shadow-2xs"
                : "bg-muted-foreground/15 text-muted-foreground"
            )}
          >
            ({counts.total})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("PLANIFICADO")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            tab === "PLANIFICADO"
              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-xs"
              : "text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10"
          )}
        >
          <span>Planificados</span>
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
            ({counts.planificados})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("EN_CURSO")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            tab === "EN_CURSO"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs"
              : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>En Curso</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
            ({counts.enCurso})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("COMPLETADO")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            tab === "COMPLETADO"
              ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <span>Completados</span>
          <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
            ({counts.completados})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("CANCELADO")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            tab === "CANCELADO"
              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-xs"
              : "text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
          )}
        >
          <span>Cancelados</span>
          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300 tabular-nums">
            ({counts.cancelados})
          </span>
        </button>
      </div>

      {/* 3. Contenedor de Tabla con Barra de Filtros Rápida */}
      <Card className="overflow-hidden border bg-card text-card-foreground shadow-xs">
        {/* Barra de Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b bg-muted/20">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por código, origen, destino, chofer o patente..."
                className="pl-9 pr-8 h-9 text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Limpiar búsqueda</span>
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="hidden lg:flex items-center text-xs text-muted-foreground">
            Mostrando {filtered.length} de {tripList.length} viajes
          </div>
        </div>

        {/* Tabla Enriquecida */}
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>Código & Estado</TableHead>
                <TableHead>Trayecto (Origen ➔ Destino)</TableHead>
                <TableHead>Chofer & Vehículo</TableHead>
                <TableHead>Programación & Horarios</TableHead>
                <TableHead>Odómetro / Km</TableHead>
                <TableHead className="text-right pr-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 py-6">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
                        <Route className="h-6 w-6 opacity-60" />
                      </div>
                      <p className="text-base font-semibold text-foreground">
                        No se encontraron viajes
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {hasActiveFilters
                          ? "No hay viajes que coincidan con la búsqueda o filtro de estado aplicado."
                          : "No hay viajes programados en tu empresa. Creá el primer viaje para comenzar a despachar."}
                      </p>
                      {hasActiveFilters ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs gap-1.5"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restablecer filtros
                        </Button>
                      ) : (
                        <div className="mt-2">
                          <ViajeFormDialog
                            sitios={sitios}
                            choferes={choferes}
                            vehicles={vehicles}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v) => {
                  const statusInfo = getStatusBadge(v.estado);
                  const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${v.origenLat},${v.origenLng}&destination=${v.destinoLat},${v.destinoLng}`;

                  return (
                    <TableRow
                      key={v.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Código & Estado Badge */}
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-sm font-bold text-foreground">
                            {v.codigo}
                          </span>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px] font-semibold px-2 py-0.5 gap-1.5",
                                statusInfo.className
                              )}
                            >
                              {statusInfo.pulsing && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                              )}
                              <span>{statusInfo.label}</span>
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      {/* Trayecto: Origen ➔ Destino */}
                      <TableCell>
                        <div className="flex flex-col gap-2 max-w-sm">
                          {/* Origen */}
                          <div className="flex items-start gap-1.5 text-xs">
                            <div className="h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-foreground truncate">
                                {v.origenNombre}
                              </span>
                              <span className="text-[11px] text-muted-foreground line-clamp-1">
                                {v.origenDireccion}
                              </span>
                            </div>
                          </div>

                          <div className="pl-2 -my-1 text-muted-foreground/40">
                            <ArrowRight className="h-3 w-3 rotate-90" />
                          </div>

                          {/* Destino */}
                          <div className="flex items-start gap-1.5 text-xs">
                            <div className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-foreground truncate">
                                {v.destinoNombre}
                              </span>
                              <span className="text-[11px] text-muted-foreground line-clamp-1">
                                {v.destinoDireccion}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Chofer & Vehículo */}
                      <TableCell>
                        <div className="flex flex-col gap-1.5 text-xs">
                          {/* Chofer */}
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 text-[10px] font-semibold bg-muted">
                              <AvatarFallback>{getInitials(v.choferNombre)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">
                              {v.choferNombre || (
                                <span className="text-muted-foreground italic">Sin asignar</span>
                              )}
                            </span>
                          </div>

                          {/* Vehículo */}
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                            {v.vehiculoPatente ? (
                              <Badge
                                variant="outline"
                                className="font-mono text-xs bg-muted/50 px-1.5 py-0"
                              >
                                {v.vehiculoPatente}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                Sin vehículo
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Programación & Horarios */}
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>Salida: {formatDateTime(v.fechaSalidaProgramada)}</span>
                          </div>
                          {v.fechaLlegadaEstimada && (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                              <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span>Llegada est.: {formatDateTime(v.fechaLlegadaEstimada)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Odómetro / Km */}
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs font-mono">
                          {v.distanciaEstimadaKm ? (
                            <div className="flex items-center gap-1 text-foreground font-medium">
                              <Route className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{v.distanciaEstimadaKm} km</span>
                            </div>
                          ) : null}

                          {v.kmInicio !== null && v.kmInicio !== undefined ? (
                            <span className="text-[11px] text-muted-foreground">
                              Inicio: {v.kmInicio.toLocaleString()} km
                            </span>
                          ) : null}

                          {v.kmFin !== null && v.kmFin !== undefined ? (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Fin: {v.kmFin.toLocaleString()} km
                            </span>
                          ) : null}

                          {!v.distanciaEstimadaKm && v.kmInicio === null && (
                            <span className="text-muted-foreground text-[11px] italic font-sans">
                              Sin registro
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={routeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/80 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Ver Ruta</span>
                          </a>

                          {v.estado !== "CANCELADO" && v.estado !== "COMPLETADO" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancelingViaje(v)}
                              className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Cancelar</span>
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Opciones de {v.codigo}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem asChild>
                                <a
                                  href={routeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                  <span>Ver en Google Maps</span>
                                </a>
                              </DropdownMenuItem>

                              {v.estado !== "CANCELADO" && v.estado !== "COMPLETADO" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setCancelingViaje(v)}
                                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                  >
                                    <Ban className="h-4 w-4" />
                                    <span>Cancelar Viaje</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal de Cancelación */}
      {cancelingViaje && (
        <CancelViajeDialog
          viaje={cancelingViaje}
          open={!!cancelingViaje}
          onOpenChange={(open) => !open && setCancelingViaje(null)}
          trigger={null}
        />
      )}
    </div>
  );
}
