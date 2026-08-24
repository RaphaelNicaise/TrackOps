"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  User,
  Phone,
  Mail,
  Truck,
  Car,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  RotateCcw,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  UserCheck,
  UserX,
  KeyRound,
  IdCard,
} from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { appAlert } from "@/lib/alerts";
import { updateChofer } from "@/lib/flota-actions";
import type { ChoferRow, ChoferEstado } from "@/types/flota-viajes";
import {
  ChoferFormDialog,
  DeleteChoferDialog,
  type VehicleOption,
} from "./chofer-form-dialog";
import { ChoferCredentialsDialog } from "./chofer-credentials-dialog";
import { ChoferDniViewerDialog } from "./chofer-dni-viewer-dialog";

export interface ChoferesTableProps {
  initialChoferes?: ChoferRow[];
  choferes?: ChoferRow[];
  vehicles?: VehicleOption[];
}

type SortKey = "nombre" | "dni" | "licenciaVencimiento" | "estado" | "vehiculoHabitualPatente";
type SortState = { key: SortKey; dir: "asc" | "desc" };
type StatusTab = "todos" | "activos" | "licenciaAlerta" | "inactivos";

function getInitials(nombre: string, apellido: string): string {
  const n = (nombre || "").trim().charAt(0).toUpperCase();
  const a = (apellido || "").trim().charAt(0).toUpperCase();
  return `${n}${a}` || "CH";
}

function cleanPhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

function getLicenseExpirationStatus(vencimiento?: Date | string | null) {
  if (!vencimiento) {
    return { status: "none", label: "Sin registrar", variant: "muted" };
  }
  const date = typeof vencimiento === "string" ? new Date(vencimiento) : vencimiento;
  if (isNaN(date.getTime())) {
    return { status: "none", label: "Inválida", variant: "muted" };
  }

  const now = new Date();
  const warningLimit = addDays(now, 30);

  if (isBefore(date, now)) {
    return {
      status: "expired",
      label: "Vencida",
      dateFormatted: format(date, "dd/MM/yyyy", { locale: es }),
      variant: "destructive",
    };
  }

  if (isBefore(date, warningLimit)) {
    return {
      status: "warning",
      label: "Por vencer",
      dateFormatted: format(date, "dd/MM/yyyy", { locale: es }),
      variant: "warning",
    };
  }

  return {
    status: "valid",
    label: "Vigente",
    dateFormatted: format(date, "dd/MM/yyyy", { locale: es }),
    variant: "emerald",
  };
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

export function ChoferesTable({
  initialChoferes,
  choferes: choferesProp,
  vehicles = [],
}: ChoferesTableProps) {
  const router = useRouter();
  const driverList = choferesProp || initialChoferes || [];

  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas las categorías");
  const [sort, setSort] = useState<SortState | null>(null);

  const [editingChofer, setEditingChofer] = useState<ChoferRow | null>(null);
  const [deletingChofer, setDeletingChofer] = useState<ChoferRow | null>(null);
  const [credentialsChofer, setCredentialsChofer] = useState<ChoferRow | null>(null);
  const [dniViewerChofer, setDniViewerChofer] = useState<ChoferRow | null>(null);
  const [isPending, startTransition] = useTransition();

  // Dynamic counts for status tabs
  const counts = useMemo(() => {
    const total = driverList.length;
    let activos = 0;
    let licenciaAlerta = 0;
    let inactivos = 0;

    const now = new Date();
    const alertLimit = addDays(now, 30);

    for (const c of driverList) {
      if (c.estado === "ACTIVO") {
        activos++;
      } else {
        inactivos++;
      }

      if (c.licenciaVencimiento) {
        const d = typeof c.licenciaVencimiento === "string" ? new Date(c.licenciaVencimiento) : c.licenciaVencimiento;
        if (!isNaN(d.getTime()) && isBefore(d, alertLimit)) {
          licenciaAlerta++;
        }
      }
    }

    return { total, activos, licenciaAlerta, inactivos };
  }, [driverList]);

  // Extract unique license categories for dropdown filter
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const c of driverList) {
      if (c.licenciaCategoria) {
        set.add(c.licenciaCategoria.toUpperCase());
      }
    }
    // Include common defaults if list is small
    ["B1", "C1", "D", "E1"].forEach((cat) => set.add(cat));
    return ["Todas las categorías", ...Array.from(set).sort()];
  }, [driverList]);

  // Filtering & Sorting
  const filtered = useMemo(() => {
    let result = driverList;

    // Filter by status tab
    const now = new Date();
    const alertLimit = addDays(now, 30);

    if (statusTab === "activos") {
      result = result.filter((c) => c.estado === "ACTIVO");
    } else if (statusTab === "licenciaAlerta") {
      result = result.filter((c) => {
        if (!c.licenciaVencimiento) return false;
        const d = typeof c.licenciaVencimiento === "string" ? new Date(c.licenciaVencimiento) : c.licenciaVencimiento;
        return !isNaN(d.getTime()) && isBefore(d, alertLimit);
      });
    } else if (statusTab === "inactivos") {
      result = result.filter((c) => c.estado === "INACTIVO" || c.estado === "LICENCIA_SUSPENDIDA");
    }

    // Filter by category
    if (categoryFilter !== "Todas las categorías") {
      result = result.filter(
        (c) => c.licenciaCategoria?.toUpperCase() === categoryFilter.toUpperCase()
      );
    }

    // Search bar filter
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((c) =>
        [
          c.nombre,
          c.apellido,
          c.dni,
          c.telefono ?? "",
          c.email ?? "",
          c.licenciaNumero ?? "",
          c.licenciaCategoria ?? "",
          c.vehiculoHabitualPatente ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // Sorting
    if (sort) {
      const dir = sort.dir === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        let va: any;
        let vb: any;

        if (sort.key === "nombre") {
          va = `${a.apellido} ${a.nombre}`;
          vb = `${b.apellido} ${b.nombre}`;
        } else {
          va = a[sort.key];
          vb = b[sort.key];
        }

        if (va == null && vb == null) return 0;
        if (va == null) return dir;
        if (vb == null) return -dir;
        if (va instanceof Date && vb instanceof Date) return (va.getTime() - vb.getTime()) * dir;
        return String(va).localeCompare(String(vb), "es") * dir;
      });
    }

    return result;
  }, [driverList, statusTab, categoryFilter, query, sort]);

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  function handleResetFilters() {
    setQuery("");
    setCategoryFilter("Todas las categorías");
    setStatusTab("todos");
  }

  function handleToggleEstado(chofer: ChoferRow, nuevoEstado: ChoferEstado) {
    startTransition(async () => {
      try {
        const res = await updateChofer(chofer.id, { id: chofer.id, estado: nuevoEstado });
        if (res.success) {
          appAlert.success(`Estado de ${chofer.nombre} ${chofer.apellido} actualizado a ${nuevoEstado}.`);
          router.refresh();
        } else {
          appAlert.error(res.error || "No se pudo actualizar el estado.");
        }
      } catch (err: any) {
        appAlert.error(err.message || "Error al actualizar estado.");
      }
    });
  }

  const hasActiveFilters =
    query.trim() !== "" || categoryFilter !== "Todas las categorías" || statusTab !== "todos";

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 1. Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Choferes</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {driverList.length} choferes registrados en tu flota
          </p>
        </div>

        <ChoferFormDialog
          vehicles={vehicles}
          trigger={
            <Button size="sm" className="gap-2 shadow-xs">
              <Plus className="h-4 w-4" />
              Nuevo Chofer
            </Button>
          }
        />
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
          onClick={() => setStatusTab("activos")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            statusTab === "activos"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs"
              : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
          )}
        >
          <span>Activos</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
            ({counts.activos})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("licenciaAlerta")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            statusTab === "licenciaAlerta"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-xs"
              : "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
          )}
        >
          <span>Licencia por Vencer</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              counts.licenciaAlerta > 0
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                : "bg-muted-foreground/15 text-muted-foreground"
            )}
          >
            ({counts.licenciaAlerta})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("inactivos")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            statusTab === "inactivos"
              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-xs"
              : "text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
          )}
        >
          <span>Inactivos</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              counts.inactivos > 0
                ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                : "bg-muted-foreground/15 text-muted-foreground"
            )}
          >
            ({counts.inactivos})
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
                placeholder="Buscar por nombre, apellido, DNI, teléfono, email o licencia..."
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

            {/* Selector de Categoría de Licencia */}
            <div className="w-full sm:w-52">
              <NativeSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                sizeVariant="default"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
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
            Mostrando {filtered.length} de {driverList.length} choferes
          </div>
        </div>

        {/* Tabla Enriquecida */}
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <SortHeader label="Chofer" sortKey="nombre" sort={sort} onSort={handleSort} />
                <SortHeader label="DNI" sortKey="dni" sort={sort} onSort={handleSort} />
                <SortHeader
                  label="Licencia de Conducir"
                  sortKey="licenciaVencimiento"
                  sort={sort}
                  onSort={handleSort}
                />
                <TableHead>Contacto</TableHead>
                <SortHeader
                  label="Vehículo Habitual"
                  sortKey="vehiculoHabitualPatente"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortHeader label="Estado" sortKey="estado" sort={sort} onSort={handleSort} />
                <TableHead className="text-right pr-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 py-6">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
                        <User className="h-6 w-6 opacity-60" />
                      </div>
                      <p className="text-base font-semibold text-foreground">
                        No se encontraron choferes
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {hasActiveFilters
                          ? "No hay conductores que coincidan con los filtros o la búsqueda aplicada."
                          : "No hay choferes cargados en tu empresa. Registrá al primer conductor para comenzar."}
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs gap-1.5"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restablecer filtros
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const licStatus = getLicenseExpirationStatus(c.licenciaVencimiento);
                  const cleanPhone = cleanPhoneForWhatsApp(c.telefono);

                  return (
                    <TableRow
                      key={c.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Chofer: Avatar & Nombre */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-primary/20 bg-primary/10 text-primary font-bold text-xs shadow-2xs">
                            <AvatarFallback>{getInitials(c.nombre, c.apellido)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {c.nombre} {c.apellido}
                            </span>
                            {c.notas && (
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                {c.notas}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* DNI */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setDniViewerChofer(c)}
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted/80 border border-border/80 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors"
                          title="Ver digitalización del DNI"
                        >
                          <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{c.dni}</span>
                        </button>
                      </TableCell>

                      {/* Licencia */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            {c.licenciaCategoria && (
                              <Badge variant="outline" className="font-mono text-xs font-bold bg-background">
                                {c.licenciaCategoria}
                              </Badge>
                            )}
                            <span className="font-mono text-xs text-muted-foreground">
                              {c.licenciaNumero || "—"}
                            </span>
                          </div>

                          {/* Expiration badge */}
                          {licStatus.status === "expired" && (
                            <Badge
                              variant="destructive"
                              className="w-fit text-[11px] font-medium gap-1 px-1.5 py-0"
                            >
                              <ShieldAlert className="h-3 w-3" />
                              <span>Vencida ({licStatus.dateFormatted})</span>
                            </Badge>
                          )}

                          {licStatus.status === "warning" && (
                            <Badge
                              variant="outline"
                              className="w-fit text-[11px] font-medium gap-1 px-1.5 py-0 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>Por vencer ({licStatus.dateFormatted})</span>
                            </Badge>
                          )}

                          {licStatus.status === "valid" && (
                            <Badge
                              variant="outline"
                              className="w-fit text-[11px] font-medium gap-1 px-1.5 py-0 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Vigente ({licStatus.dateFormatted})</span>
                            </Badge>
                          )}

                          {licStatus.status === "none" && (
                            <span className="text-xs text-muted-foreground italic">
                              Sin registrar
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Contacto: WhatsApp & Email */}
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {c.telefono ? (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{c.telefono}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground italic">Sin teléfono</span>
                          )}

                          {c.email ? (
                            <a
                              href={`mailto:${c.email}`}
                              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[170px]">{c.email}</span>
                            </a>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Vehículo Habitual */}
                      <TableCell>
                        {c.vehiculoHabitualPatente ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded bg-muted/80 border border-border/80">
                              {c.vehiculoHabitualPatente}
                            </span>
                            {c.vehiculoHabitualModelo && (
                              <span className="text-xs text-muted-foreground truncate max-w-[130px]">
                                {c.vehiculoHabitualModelo}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Sin asignar
                          </span>
                        )}
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        {c.estado === "ACTIVO" && (
                          <Badge
                            variant="outline"
                            className="font-semibold text-xs text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15"
                          >
                            Activo
                          </Badge>
                        )}
                        {c.estado === "INACTIVO" && (
                          <Badge variant="outline" className="font-normal text-xs bg-muted text-muted-foreground">
                            Inactivo
                          </Badge>
                        )}
                        {c.estado === "LICENCIA_SUSPENDIDA" && (
                          <Badge
                            variant="destructive"
                            className="font-medium text-xs bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300"
                          >
                            Licencia suspendida
                          </Badge>
                        )}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCredentialsChofer(c)}
                            className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                            title="Gestionar contraseña y acceso"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Clave</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingChofer(c)}
                            className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Editar</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Opciones de {c.nombre}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                onClick={() => setCredentialsChofer(c)}
                                className="gap-2 cursor-pointer"
                              >
                                <KeyRound className="h-4 w-4 text-amber-500" />
                                <span>Gestionar Credenciales</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setDniViewerChofer(c)}
                                className="gap-2 cursor-pointer"
                              >
                                <IdCard className="h-4 w-4 text-blue-500" />
                                <span>Ver DNI Digitalizado</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setEditingChofer(c)}
                                className="gap-2 cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                <span>Editar Chofer</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Cambiar estado */}
                              {c.estado !== "ACTIVO" && (
                                <DropdownMenuItem
                                  onClick={() => handleToggleEstado(c, "ACTIVO")}
                                  className="gap-2 cursor-pointer text-emerald-600"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  <span>Cambiar estado a Activo</span>
                                </DropdownMenuItem>
                              )}

                              {c.estado !== "INACTIVO" && (
                                <DropdownMenuItem
                                  onClick={() => handleToggleEstado(c, "INACTIVO")}
                                  className="gap-2 cursor-pointer text-muted-foreground"
                                >
                                  <UserX className="h-4 w-4" />
                                  <span>Cambiar estado a Inactivo</span>
                                </DropdownMenuItem>
                              )}

                              {c.estado !== "LICENCIA_SUSPENDIDA" && (
                                <DropdownMenuItem
                                  onClick={() => handleToggleEstado(c, "LICENCIA_SUSPENDIDA")}
                                  className="gap-2 cursor-pointer text-amber-600"
                                >
                                  <ShieldAlert className="h-4 w-4" />
                                  <span>Suspender Licencia</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => setDeletingChofer(c)}
                                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Eliminar Chofer</span>
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

      {/* Controlled Edit & Delete Dialogs */}
      {editingChofer && (
        <ChoferFormDialog
          chofer={editingChofer}
          vehicles={vehicles}
          open={!!editingChofer}
          onOpenChange={(open) => !open && setEditingChofer(null)}
          trigger={null}
        />
      )}

      {deletingChofer && (
        <DeleteChoferDialog
          chofer={deletingChofer}
          open={!!deletingChofer}
          onOpenChange={(open) => !open && setDeletingChofer(null)}
          trigger={null}
        />
      )}

      {credentialsChofer && (
        <ChoferCredentialsDialog
          chofer={credentialsChofer}
          open={!!credentialsChofer}
          onOpenChange={(open) => !open && setCredentialsChofer(null)}
          trigger={null}
          onSuccess={() => router.refresh()}
        />
      )}

      {dniViewerChofer && (
        <ChoferDniViewerDialog
          chofer={dniViewerChofer}
          open={!!dniViewerChofer}
          onOpenChange={(open) => !open && setDniViewerChofer(null)}
          trigger={null}
        />
      )}
    </div>
  );
}
