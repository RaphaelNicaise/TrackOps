"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Truck,
  Car,
  Bus,
  FileText,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Copy,
  Check,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Gauge,
  X,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { format, isBefore } from "date-fns";
import { es } from "date-fns/locale";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CreateVehicleDialog,
  EditVehicleDialog,
  DeleteVehicleButton,
} from "./vehicle-dialogs";

export type VehiculoRow = {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  tipo: string | null;
  chasis: string | null;
  kilometrajeActual: number;
  rto: Date | null;
  docCount: number;
};

type SortKey = "patente" | "anio" | "chasis" | "tipo" | "kilometrajeActual" | "rto" | "docCount";
type SortState = { key: SortKey; dir: "asc" | "desc" };
type StatusTab = "todos" | "vigente" | "vencido" | "sinRto";

interface VehiculosTableProps {
  vehicles: VehiculoRow[];
}

const VEHICLE_TYPES = [
  "Todos los tipos",
  "Camión",
  "Camioneta",
  "Utilitario",
  "Auto",
  "Colectivo",
  "Otro",
];

function getVehicleIcon(tipo?: string | null) {
  const t = (tipo ?? "").toLowerCase();
  if (t.includes("colectivo") || t.includes("bus")) {
    return <Bus className="h-4 w-4 text-primary" />;
  }
  if (t.includes("auto")) {
    return <Car className="h-4 w-4 text-primary" />;
  }
  return <Truck className="h-4 w-4 text-primary" />;
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
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function VehiculosTable({ vehicles }: VehiculosTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("todos");
  const [typeFilter, setTypeFilter] = useState("Todos los tipos");
  const [sort, setSort] = useState<SortState | null>(null);
  const [copiedVin, setCopiedVin] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<VehiculoRow | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<VehiculoRow | null>(null);

  // Dynamic counts for status tabs
  const counts = useMemo(() => {
    const total = vehicles.length;
    let vigente = 0;
    let vencido = 0;
    let sinRto = 0;

    for (const v of vehicles) {
      if (!v.rto) {
        sinRto++;
      } else if (isBefore(v.rto, new Date())) {
        vencido++;
      } else {
        vigente++;
      }
    }

    return { total, vigente, vencido, sinRto };
  }, [vehicles]);

  // Filtering & Sorting
  const filtered = useMemo(() => {
    let result = vehicles;

    // Filter by status tab
    if (statusTab === "vigente") {
      result = result.filter((v) => v.rto && !isBefore(v.rto, new Date()));
    } else if (statusTab === "vencido") {
      result = result.filter((v) => v.rto && isBefore(v.rto, new Date()));
    } else if (statusTab === "sinRto") {
      result = result.filter((v) => !v.rto);
    }

    // Filter by vehicle type
    if (typeFilter !== "Todos los tipos") {
      if (typeFilter === "Otro") {
        const standardTypes = ["camión", "camion", "camioneta", "utilitario", "auto", "colectivo", "bus"];
        result = result.filter((v) => !v.tipo || !standardTypes.includes(v.tipo.toLowerCase()));
      } else {
        result = result.filter(
          (v) => v.tipo && v.tipo.toLowerCase() === typeFilter.toLowerCase()
        );
      }
    }

    // Universal live search
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((v) =>
        [v.patente, v.marca, v.modelo, v.chasis ?? "", v.tipo ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // Sorting
    if (sort) {
      const dir = sort.dir === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        if (va == null && vb == null) return 0;
        if (va == null) return dir;
        if (vb == null) return -dir;
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
        if (va instanceof Date && vb instanceof Date) return (va.getTime() - vb.getTime()) * dir;
        return String(va).localeCompare(String(vb), "es") * dir;
      });
    }

    return result;
  }, [vehicles, statusTab, typeFilter, query, sort]);

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  function handleCopyVin(vin: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(vin);
      setCopiedVin(vin);
      setTimeout(() => setCopiedVin(null), 2000);
    }
  }

  const hasActiveFilters =
    query.trim() !== "" || typeFilter !== "Todos los tipos" || statusTab !== "todos";

  function handleResetFilters() {
    setQuery("");
    setTypeFilter("Todos los tipos");
    setStatusTab("todos");
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 1. Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Vehículos</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {vehicles.length} vehículos en tu flota
          </p>
        </div>
        <CreateVehicleDialog />
      </div>

      {/* 2. Pestañas de Estado en Línea con Micro-Contadores */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b pb-2 -mb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setStatusTab("todos")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            statusTab === "todos"
              ? "bg-muted text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <span>Todos</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              statusTab === "todos"
                ? "bg-background text-foreground shadow-2xs"
                : "bg-muted-foreground/15 text-muted-foreground"
            )}
          >
            ({counts.total})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("vigente")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            statusTab === "vigente"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs"
              : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
          )}
        >
          <span>RTO Vigente</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
            ({counts.vigente})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("vencido")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            statusTab === "vencido"
              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-xs"
              : "text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
          )}
        >
          <span>RTO Vencido</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              counts.vencido > 0
                ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                : "bg-muted-foreground/15 text-muted-foreground"
            )}
          >
            ({counts.vencido})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("sinRto")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            statusTab === "sinRto"
              ? "bg-muted text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <span>Sin RTO</span>
          <span className="rounded-full bg-muted-foreground/15 px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
            ({counts.sinRto})
          </span>
        </button>
      </div>

      {/* 3. Contenedor de Tabla con Barra de Filtros Rápida */}
      <Card className="overflow-hidden border bg-card text-card-foreground shadow-xs">
        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b bg-muted/20">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Buscador Universal */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por patente, marca, modelo, chasis o tipo..."
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

            {/* Selector de Tipo de Vehículo */}
            <div className="w-full sm:w-48">
              <Select
                value={typeFilter}
                onValueChange={(val) => setTypeFilter(val)}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl bg-card border-input">
                  <SelectValue placeholder="Tipo de vehículo">
                    {typeFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón Limpiar Filtros */}
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
            Mostrando {filtered.length} de {vehicles.length} unidades
          </div>
        </div>

        {/* Tabla Enriquecida */}
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <SortHeader label="Patente" sortKey="patente" sort={sort} onSort={handleSort} />
                <SortHeader label="Vehículo / Año" sortKey="anio" sort={sort} onSort={handleSort} />
                <SortHeader label="Chasis / VIN" sortKey="chasis" sort={sort} onSort={handleSort} />
                <SortHeader label="Tipo" sortKey="tipo" sort={sort} onSort={handleSort} />
                <SortHeader
                  label="Kilometraje"
                  sortKey="kilometrajeActual"
                  sort={sort}
                  onSort={handleSort}
                  className="text-right"
                />
                <SortHeader label="RTO / VTV" sortKey="rto" sort={sort} onSort={handleSort} />
                <SortHeader
                  label="Documentos"
                  sortKey="docCount"
                  sort={sort}
                  onSort={handleSort}
                  className="text-center"
                />
                <TableHead className="text-right pr-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 py-6">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
                        <Truck className="h-6 w-6 opacity-60" />
                      </div>
                      <p className="text-base font-semibold text-foreground">
                        No se encontraron vehículos
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {hasActiveFilters
                          ? "No hay vehículos que coincidan con los filtros o la búsqueda aplicada."
                          : "No hay vehículos cargados en tu flota. Incorporá tu primera unidad para comenzar."}
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
                          <CreateVehicleDialog />
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v) => {
                  const rtoVencido = v.rto ? isBefore(v.rto, new Date()) : null;

                  return (
                    <TableRow
                      key={v.id}
                      onClick={() => router.push(`/panel/control-flota/vehiculos/${v.id}`)}
                      className="cursor-pointer hover:bg-muted/40 transition-colors group"
                    >
                      {/* Patente & Avatar */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xs">
                            {getVehicleIcon(v.tipo)}
                          </span>
                          <span className="font-mono text-sm font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-muted/80 border border-border/80 group-hover:border-primary/40 group-hover:text-primary transition-colors">
                            {v.patente}
                          </span>
                        </div>
                      </TableCell>

                      {/* Marca / Modelo & Año */}
                      <TableCell>
                        <div className="font-medium text-foreground text-sm">
                          {v.marca} {v.modelo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v.anio ?? "—"}
                        </div>
                      </TableCell>

                      {/* Chasis / VIN */}
                      <TableCell>
                        {v.chasis ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            <span>{v.chasis}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyVin(v.chasis!, e)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Copiar VIN"
                            >
                              {copiedVin === v.chasis ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span className="sr-only">Copiar Chasis</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">—</span>
                        )}
                      </TableCell>

                      {/* Tipo */}
                      <TableCell>
                        <Badge variant="outline" className="font-normal text-xs bg-background/50">
                          {v.tipo ?? "Sin tipo"}
                        </Badge>
                      </TableCell>

                      {/* Kilometraje */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 font-mono text-sm font-medium">
                          <Gauge className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{v.kilometrajeActual.toLocaleString("es-AR")} km</span>
                        </div>
                      </TableCell>

                      {/* RTO / VTV */}
                      <TableCell>
                        {v.rto ? (
                          <Badge
                            variant={rtoVencido ? "destructive" : "outline"}
                            className={cn(
                              "font-normal text-xs",
                              !rtoVencido &&
                                "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15"
                            )}
                          >
                            {format(v.rto, "dd/MM/yyyy", { locale: es })}
                            <span className="ml-1.5 font-semibold">
                              {rtoVencido ? "Vencido" : "Vigente"}
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sin registrar</span>
                        )}
                      </TableCell>

                      {/* Documentación */}
                      <TableCell className="text-center">
                        <Link
                          href={`/panel/control-flota/vehiculos/${v.id}?tab=documentacion`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {v.docCount}
                        </Link>
                      </TableCell>

                      {/* Acciones Rápidas Directas + Dropdown Menu */}
                      <TableCell className="text-right pr-4">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Botón directo: Ver Ficha */}
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                          >
                            <Link href={`/panel/control-flota/vehiculos/${v.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Ver Ficha</span>
                            </Link>
                          </Button>

                          {/* Botón directo: Ver en Mapa */}
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                          >
                            <Link href={`/panel/mapa?patente=${encodeURIComponent(v.patente)}`}>
                              <MapPin className="h-3.5 w-3.5 text-amber-500" />
                              <span className="hidden xl:inline">Ver en Mapa</span>
                            </Link>
                          </Button>

                          {/* Menú Contextual ⋯ */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Opciones de {v.patente}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => setEditingVehicle(v)}
                                className="gap-2 cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                <span>Editar Vehículo</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                                <Link
                                  href={`/panel/control-flota/vehiculos/${v.id}?tab=documentacion`}
                                >
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span>Ver Documentación</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingVehicle(v)}
                                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Eliminar Vehículo</span>
                              </DropdownMenuItem>
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

      {/* Controlled Dialogs for Edit & Delete */}
      {editingVehicle && (
        <EditVehicleDialog
          vehicle={editingVehicle}
          open={!!editingVehicle}
          onOpenChange={(open) => !open && setEditingVehicle(null)}
          trigger={null}
        />
      )}

      {deletingVehicle && (
        <DeleteVehicleButton
          id={deletingVehicle.id}
          patente={deletingVehicle.patente}
          open={!!deletingVehicle}
          onOpenChange={(open) => !open && setDeletingVehicle(null)}
          trigger={null}
        />
      )}
    </div>
  );
}