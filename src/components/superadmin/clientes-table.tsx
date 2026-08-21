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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Car,
  CheckCircle2,
  Edit2,
  Key,
  Loader2,
  MoreHorizontal,
  Power,
  PowerOff,
  Search,
  Sparkles,
  Truck,
  X,
  Zap,
} from "lucide-react";
import {
  EmpresaFormDialog,
  PlanOption,
  EmpresaFormData,
} from "./empresa-form-dialog";
import {
  EmpresaCreatedDialog,
  CreatedEmpresaInfo,
  CreatedAdminInfo,
} from "./empresa-created-dialog";
import {
  toggleEmpresaStatus,
  enterTenantAsSuperadmin,
} from "@/lib/admin-actions";
import { appAlert } from "@/lib/alerts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface EmpresaRow {
  id: number;
  nombre: string;
  cuit: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  createdAt: string | Date;
  planId?: number | null;
  planNombre?: string | null;
  estadoSuscripcion?: "activa" | "suspendida" | "cancelada" | string;
  totalVehiculos: number;
}

interface ClientesTableProps {
  initialEmpresas: EmpresaRow[];
  plans?: PlanOption[];
}

export function ClientesTable({ initialEmpresas, plans = [] }: ClientesTableProps) {
  const [empresas, setEmpresas] = useState<EmpresaRow[]>(initialEmpresas);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "activa" | "suspendida">("todas");
  const [planFilter, setPlanFilter] = useState<string>("todos");

  // State for Editing
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaFormData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // State for direct superadmin loading per row
  const [loadingSuperadminId, setLoadingSuperadminId] = useState<number | null>(null);

  // State for Status toggle loading
  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);

  // Filtered dataset
  const filteredEmpresas = useMemo(() => {
    return empresas.filter((emp) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        emp.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.cuit && emp.cuit.includes(searchQuery.trim())) ||
        (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const currentStatus = emp.estadoSuscripcion?.toLowerCase() || "activa";
      const matchStatus =
        statusFilter === "todas" ||
        (statusFilter === "activa" && currentStatus === "activa") ||
        (statusFilter === "suspendida" && currentStatus === "suspendida");

      const currentPlanName = (emp.planNombre || "Starter").toLowerCase();
      const matchPlan =
        planFilter === "todos" ||
        currentPlanName.includes(planFilter.toLowerCase());

      return matchSearch && matchStatus && matchPlan;
    });
  }, [empresas, searchQuery, statusFilter, planFilter]);

  // Status counts
  const counts = useMemo(() => {
    const total = empresas.length;
    const activas = empresas.filter(
      (e) => (e.estadoSuscripcion?.toLowerCase() || "activa") === "activa"
    ).length;
    const suspendidas = empresas.filter(
      (e) => (e.estadoSuscripcion?.toLowerCase() || "") === "suspendida"
    ).length;
    return { total, activas, suspendidas };
  }, [empresas]);

  // Formatter helper
  const formatDate = (dateVal: string | Date) => {
    try {
      const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
      if (isNaN(d.getTime())) return "Fecha no disp.";
      return format(d, "dd MMM yyyy", { locale: es });
    } catch {
      return "Fecha no disp.";
    }
  };

  // Toggle status handler
  const handleToggleStatus = async (empresa: EmpresaRow) => {
    const currentStatus = (empresa.estadoSuscripcion?.toLowerCase() || "activa") as "activa" | "suspendida";
    const nuevoEstado = currentStatus === "activa" ? "suspendida" : "activa";

    setTogglingStatusId(empresa.id);
    try {
      const formData = new FormData();
      formData.append("empresaId", empresa.id.toString());
      formData.append("estado", nuevoEstado);

      await toggleEmpresaStatus(formData);

      // Optimistic update
      setEmpresas((prev) =>
        prev.map((e) =>
          e.id === empresa.id ? { ...e, estadoSuscripcion: nuevoEstado } : e
        )
      );

      if (nuevoEstado === "activa") {
        appAlert.success(`La empresa "${empresa.nombre}" fue reactivada correctamente.`, "Empresa Reactivada");
      } else {
        appAlert.warning(`La empresa "${empresa.nombre}" ha sido suspendida.`, "Empresa Suspendida");
      }
    } catch (err: any) {
      appAlert.error(err?.message || "Error al modificar el estado de la empresa.");
    } finally {
      setTogglingStatusId(null);
    }
  };

  // Direct Superpoderes Access
  const handleDirectSuperpoderes = async (empresa: EmpresaRow) => {
    setLoadingSuperadminId(empresa.id);
    try {
      await enterTenantAsSuperadmin(empresa.id);
      appAlert.success(
        `Ingresando a "${empresa.nombre}" con Superpoderes...`,
        "⚡ Superpoderes Activados"
      );
      window.location.href = "/dashboard";
    } catch (err: any) {
      appAlert.error(err?.message || "Error al ingresar con superpoderes.");
      setLoadingSuperadminId(null);
    }
  };

  const getPlanBadge = (planNombre?: string | null) => {
    const name = planNombre || "Starter";
    const lower = name.toLowerCase();

    if (lower.includes("enterprise")) {
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border-amber-500/30 gap-1 font-semibold text-[11px]">
          <Sparkles className="h-3 w-3" />
          Enterprise
        </Badge>
      );
    }
    if (lower.includes("pro")) {
      return (
        <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 hover:bg-violet-500/25 border-violet-500/30 gap-1 font-semibold text-[11px]">
          <Zap className="h-3 w-3" />
          Pro
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 gap-1 font-medium text-[11px]">
        Starter
      </Badge>
    );
  };

  const getStatusBadge = (estado?: string) => {
    const isActiva = (estado?.toLowerCase() || "activa") === "activa";
    return isActiva ? (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30 gap-1 text-[11px]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        Activa
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border-rose-500/30 gap-1 text-[11px]">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
        Suspendida
      </Badge>
    );
  };

  // Color generator based on name
  const getAvatarBg = (name: string) => {
    const colors = [
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className="space-y-4">
      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por empresa, CUIT o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs & Action Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setStatusFilter("todas")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                statusFilter === "todas"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas ({counts.total})
            </button>
            <button
              onClick={() => setStatusFilter("activa")}
              className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === "activa"
                  ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Activas ({counts.activas})
            </button>
            <button
              onClick={() => setStatusFilter("suspendida")}
              className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === "suspendida"
                  ? "bg-background text-rose-600 dark:text-rose-400 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              Suspendidas ({counts.suspendidas})
            </button>
          </div>

          {/* New Empresa Button Dialog */}
          <EmpresaFormDialog
            plans={plans}
            onEmpresaCreated={(created) => {
              const newRow: EmpresaRow = {
                id: created.empresa.id,
                nombre: created.empresa.nombre,
                cuit: created.empresa.cuit || null,
                email: created.empresa.email || null,
                telefono: created.empresa.telefono || null,
                planNombre: created.planNombre,
                estadoSuscripcion: "activa",
                totalVehiculos: 0,
                createdAt: new Date(),
              };
              setEmpresas((prev) => [newRow, ...prev]);
            }}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[280px] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Empresa / Razón Social
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                CUIT
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Plan
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Flota
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Estado
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Fecha Alta
              </TableHead>
              <TableHead className="text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider pr-6">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredEmpresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <Building2 className="h-8 w-8 text-muted-foreground/40 stroke-1" />
                    <p className="text-sm font-medium">
                      No se encontraron empresas clientes
                    </p>
                    <p className="text-xs text-muted-foreground/80 max-w-sm">
                      {searchQuery
                        ? `No hay resultados para la búsqueda "${searchQuery}". Intenta con otro término o limpia los filtros.`
                        : "No hay empresas registradas con los filtros seleccionados."}
                    </p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("todas");
                          setPlanFilter("todos");
                        }}
                        className="mt-2 text-xs"
                      >
                        Limpiar Filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEmpresas.map((empresa) => {
                const initials = empresa.nombre
                  .split(" ")
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                const isActiva =
                  (empresa.estadoSuscripcion?.toLowerCase() || "activa") ===
                  "activa";

                const isCurrentlyToggling = togglingStatusId === empresa.id;
                const isCurrentlySuperadmin = loadingSuperadminId === empresa.id;

                return (
                  <TableRow
                    key={empresa.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Empresa Avatar & Name */}
                    <TableCell className="font-medium py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs border ${getAvatarBg(
                            empresa.nombre
                          )}`}
                        >
                          {initials || "EM"}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            {empresa.nombre}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-2">
                            <span>ID: #{empresa.id}</span>
                            {empresa.email && (
                              <span className="text-muted-foreground/70 truncate max-w-[140px]">
                                · {empresa.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* CUIT */}
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border/60">
                        {empresa.cuit || "Sin CUIT"}
                      </span>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>{getPlanBadge(empresa.planNombre)}</TableCell>

                    {/* Flota */}
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border">
                        <Truck className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {empresa.totalVehiculos}{" "}
                          <span className="font-normal text-muted-foreground text-[11px]">
                            {empresa.totalVehiculos === 1 ? "unidad" : "unidades"}
                          </span>
                        </span>
                      </div>
                    </TableCell>

                    {/* Estado */}
                    <TableCell>{getStatusBadge(empresa.estadoSuscripcion)}</TableCell>

                    {/* Fecha de Alta */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(empresa.createdAt)}
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón de Superpoderes directo con loading indicator */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDirectSuperpoderes(empresa)}
                          disabled={isCurrentlySuperadmin}
                          title="Acceder como Empresa (Modo Superpoderes)"
                          className="h-8 px-2.5 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:border-amber-500/50 gap-1.5 transition-all shadow-2xs"
                        >
                          {isCurrentlySuperadmin ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span className="hidden sm:inline">Conectando...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              <span className="hidden sm:inline">Superpoderes</span>
                            </>
                          )}
                        </Button>

                        {/* Dropdown Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <span className="sr-only">Abrir menú de opciones</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                              Acciones para {empresa.nombre}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Superpoderes */}
                            <DropdownMenuItem
                              onClick={() => handleDirectSuperpoderes(empresa)}
                              disabled={isCurrentlySuperadmin}
                              className="text-xs gap-2 cursor-pointer font-medium text-amber-600 dark:text-amber-400"
                            >
                              <Key className="h-3.5 w-3.5" />
                              Acceder como Empresa
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Editar */}
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingEmpresa({
                                  id: empresa.id,
                                  nombre: empresa.nombre,
                                  cuit: empresa.cuit,
                                  email: empresa.email,
                                  telefono: empresa.telefono,
                                  direccion: empresa.direccion,
                                  ciudad: empresa.ciudad,
                                  provincia: empresa.provincia,
                                  planId: empresa.planId,
                                  planNombre: empresa.planNombre,
                                });
                                setIsEditDialogOpen(true);
                              }}
                              className="text-xs gap-2 cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Editar Datos / Plan
                            </DropdownMenuItem>

                            {/* Suspender / Reactivar */}
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(empresa)}
                              disabled={isCurrentlyToggling}
                              className={`text-xs gap-2 cursor-pointer ${
                                isActiva
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {isCurrentlyToggling ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isActiva ? (
                                <PowerOff className="h-3.5 w-3.5" />
                              ) : (
                                <Power className="h-3.5 w-3.5" />
                              )}
                              {isActiva ? "Suspender Empresa" : "Reactivar Empresa"}
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

        {/* Table Footer / Summary */}
        <div className="px-6 py-3.5 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Mostrando{" "}
            <span className="font-semibold text-foreground">
              {filteredEmpresas.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-foreground">
              {empresas.length}
            </span>{" "}
            empresas clientes
          </div>
          <div className="font-mono text-[11px]">
            Superadmin Multi-Tenant Engine v1.0
          </div>
        </div>
      </div>

      {/* Edit Empresa Dialog instance */}
      <EmpresaFormDialog
        empresa={editingEmpresa}
        plans={plans}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          if (editingEmpresa) {
            setEmpresas((prev) =>
              prev.map((e) =>
                e.id === editingEmpresa.id
                  ? {
                      ...e,
                      nombre: editingEmpresa.nombre,
                      cuit: editingEmpresa.cuit || null,
                      email: editingEmpresa.email || null,
                      telefono: editingEmpresa.telefono || null,
                      direccion: editingEmpresa.direccion || null,
                      ciudad: editingEmpresa.ciudad || null,
                      provincia: editingEmpresa.provincia || null,
                      planNombre: editingEmpresa.planNombre,
                      planId: editingEmpresa.planId,
                    }
                  : e
              )
            );
          }
          setIsEditDialogOpen(false);
          setEditingEmpresa(null);
        }}
      />
    </div>
  );
}
