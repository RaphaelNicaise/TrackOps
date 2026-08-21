"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  ExternalLink,
  Pencil,
  Trash2,
  X,
  RotateCcw,
  MessageSquare,
  Building2,
  Factory,
  Warehouse,
  Store,
  Truck,
  Wrench,
  Radio,
  Navigation,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SitioRow, SitioTipo } from "@/types/flota-viajes";
import {
  SitioFormDialog,
  DeleteSitioDialog,
} from "./sitio-form-dialog";

export interface SitiosTableProps {
  initialSitios?: SitioRow[];
  sitios?: SitioRow[];
}

type CategoryTab = "TODOS" | "PLANTA" | "DEPOSITO" | "CLIENTE" | "OTROS";

function cleanPhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

function getSitioTypeInfo(tipo: SitioTipo) {
  switch (tipo) {
    case "PLANTA":
      return {
        label: "Planta",
        icon: Factory,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
        iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      };
    case "DEPOSITO":
      return {
        label: "Depósito",
        icon: Warehouse,
        badgeClass: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30",
        iconBg: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
      };
    case "CLIENTE":
      return {
        label: "Cliente",
        icon: Building2,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
      };
    case "SUCURSAL":
      return {
        label: "Sucursal",
        icon: Store,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
        iconBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
      };
    case "PROVEEDOR":
      return {
        label: "Proveedor",
        icon: Truck,
        badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30",
        iconBg: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
      };
    case "TALLER":
      return {
        label: "Taller",
        icon: Wrench,
        badgeClass: "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
        iconBg: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
      };
    case "OTRO":
    default:
      return {
        label: "Otro",
        icon: MapPin,
        badgeClass: "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
        iconBg: "bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300",
      };
  }
}

export function SitiosTable({ initialSitios, sitios: sitiosProp }: SitiosTableProps) {
  const router = useRouter();
  const siteList = sitiosProp || initialSitios || [];

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<CategoryTab>("TODOS");

  const [editingSitio, setEditingSitio] = useState<SitioRow | null>(null);
  const [deletingSitio, setDeletingSitio] = useState<SitioRow | null>(null);

  // Dynamic counts for tabs
  const counts = useMemo(() => {
    let total = siteList.length;
    let plantas = 0;
    let depositos = 0;
    let clientes = 0;
    let otros = 0;

    for (const s of siteList) {
      if (s.tipo === "PLANTA") plantas++;
      else if (s.tipo === "DEPOSITO") depositos++;
      else if (s.tipo === "CLIENTE") clientes++;
      else otros++;
    }

    return { total, plantas, depositos, clientes, otros };
  }, [siteList]);

  // Filtering
  const filtered = useMemo(() => {
    let result = siteList;

    if (tab === "PLANTA") {
      result = result.filter((s) => s.tipo === "PLANTA");
    } else if (tab === "DEPOSITO") {
      result = result.filter((s) => s.tipo === "DEPOSITO");
    } else if (tab === "CLIENTE") {
      result = result.filter((s) => s.tipo === "CLIENTE");
    } else if (tab === "OTROS") {
      result = result.filter(
        (s) => s.tipo !== "PLANTA" && s.tipo !== "DEPOSITO" && s.tipo !== "CLIENTE"
      );
    }

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((s) =>
        [
          s.nombre,
          s.direccion,
          s.ciudad ?? "",
          s.provincia ?? "",
          s.contactoNombre ?? "",
          s.contactoTelefono ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return result;
  }, [siteList, tab, query]);

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sitios de Interés</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {siteList.length} sitios registrados en tu red logística
          </p>
        </div>

        <SitioFormDialog
          trigger={
            <Button size="sm" className="gap-2 shadow-xs">
              <MapPin className="h-4 w-4" />
              + Nuevo Sitio
            </Button>
          }
        />
      </div>

      {/* 2. Pestañas de Categoría en Línea con Micro-Contadores */}
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
          onClick={() => setTab("PLANTA")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            tab === "PLANTA"
              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-xs"
              : "text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10"
          )}
        >
          <span>Plantas</span>
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
            ({counts.plantas})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("DEPOSITO")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            tab === "DEPOSITO"
              ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 shadow-xs"
              : "text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10"
          )}
        >
          <span>Depósitos</span>
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 tabular-nums">
            ({counts.depositos})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("CLIENTE")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            tab === "CLIENTE"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs"
              : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
          )}
        >
          <span>Clientes</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
            ({counts.clientes})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("OTROS")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            tab === "OTROS"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-xs"
              : "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
          )}
        >
          <span>Sucursales & Otros</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
            ({counts.otros})
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
                placeholder="Buscar por nombre, dirección, ciudad, provincia o contacto..."
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
            Mostrando {filtered.length} de {siteList.length} sitios
          </div>
        </div>

        {/* Tabla Enriquecida */}
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>Sitio</TableHead>
                <TableHead>Dirección & Ubicación</TableHead>
                <TableHead>Radio de Geocerca</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-right pr-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 py-6">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
                        <MapPin className="h-6 w-6 opacity-60" />
                      </div>
                      <p className="text-base font-semibold text-foreground">
                        No se encontraron sitios
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {hasActiveFilters
                          ? "No hay sitios que coincidan con la búsqueda o filtro de categoría aplicado."
                          : "No hay sitios registrados en tu empresa. Agregá tu primer sitio para comenzar a planificar rutas."}
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
                          <SitioFormDialog />
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => {
                  const typeInfo = getSitioTypeInfo(s.tipo);
                  const Icon = typeInfo.icon;
                  const cleanPhone = cleanPhoneForWhatsApp(s.contactoTelefono);
                  const mapUrl = `https://www.google.com/maps?q=${s.lat},${s.lng}`;

                  return (
                    <TableRow
                      key={s.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Sitio: Icono, Nombre & Tipo */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs",
                              typeInfo.iconBg
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {s.nombre}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge
                                variant="outline"
                                className={cn("text-[11px] font-medium px-1.5 py-0", typeInfo.badgeClass)}
                              >
                                {typeInfo.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Dirección & Ubicación */}
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="font-medium text-foreground">{s.direccion}</span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>
                              {[s.ciudad, s.provincia].filter(Boolean).join(", ") || "Sin ciudad especificada"}
                            </span>
                            <span className="text-muted-foreground/40">•</span>
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
                            >
                              <Navigation className="h-3 w-3" />
                              <span>{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</span>
                            </a>
                          </div>
                        </div>
                      </TableCell>

                      {/* Radio de Geocerca */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                          <Badge variant="outline" className="font-mono text-xs bg-background">
                            {s.radioMetros || 100} m
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Contacto */}
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {s.contactoNombre ? (
                            <span className="font-medium text-foreground">{s.contactoNombre}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Sin contacto</span>
                          )}

                          {s.contactoTelefono ? (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>{s.contactoTelefono}</span>
                            </a>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/80 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Ver en Mapa</span>
                          </a>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSitio(s)}
                            className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Editar Sitio</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Opciones de {s.nombre}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem asChild>
                                <a
                                  href={mapUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                  <span>Ver en Mapa</span>
                                </a>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setEditingSitio(s)}
                                className="gap-2 cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                <span>Editar Sitio</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => setDeletingSitio(s)}
                                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Eliminar Sitio</span>
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
      {editingSitio && (
        <SitioFormDialog
          sitio={editingSitio}
          open={!!editingSitio}
          onOpenChange={(open) => !open && setEditingSitio(null)}
          trigger={null}
        />
      )}

      {deletingSitio && (
        <DeleteSitioDialog
          sitio={deletingSitio}
          open={!!deletingSitio}
          onOpenChange={(open) => !open && setDeletingSitio(null)}
          trigger={null}
        />
      )}
    </div>
  );
}
