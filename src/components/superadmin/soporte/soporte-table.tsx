"use client";

import React, { useState, useMemo } from "react";
import {
  TicketSoporteRow,
  TicketEstado,
  TicketPrioridad,
  TicketTipo,
  TicketOrigen,
} from "@/types/soporte";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Headphones,
  Mail,
  Phone,
  MessageSquare,
  Building2,
  User,
  X,
  ExternalLink,
  Loader2,
  Eye,
  Filter,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { TicketDetailSheet } from "./ticket-detail-sheet";
import { enterTenantAsSuperadmin } from "@/lib/impersonation";
import { appAlert } from "@/lib/alerts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SoporteTableProps {
  initialTickets?: TicketSoporteRow[];
  stats?: {
    total: number;
    pendientes: number;
    enRevision: number;
    resueltos: number;
    urgentes: number;
  };
}

export function SoporteTable({
  initialTickets = [],
  stats: initialStats,
}: SoporteTableProps) {
  const [tickets, setTickets] = useState<TicketSoporteRow[]>(initialTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [originFilter, setOriginFilter] = useState<string>("ALL");

  // Selected Ticket for 360 Sheet
  const [selectedTicket, setSelectedTicket] = useState<TicketSoporteRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Loading state for direct Modo Soporte
  const [loadingSuperadminId, setLoadingSuperadminId] = useState<number | null>(null);

  // Auto-calculated stats based on current tickets state
  const computedStats = useMemo(() => {
    const total = tickets.length;
    const pendientes = tickets.filter((t) => t.estado === "PENDIENTE").length;
    const enRevision = tickets.filter((t) => t.estado === "EN_REVISION").length;
    const resueltos = tickets.filter((t) => t.estado === "RESUELTO").length;
    const urgentes = tickets.filter((t) => t.prioridad === "URGENTE").length;

    // Use initialStats if tickets array was empty initially or as fallback
    if (initialStats && tickets.length === initialTickets.length) {
      return initialStats;
    }

    return { total, pendientes, enRevision, resueltos, urgentes };
  }, [tickets, initialStats, initialTickets.length]);

  // Filtered dataset
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Status filter
      if (statusFilter !== "ALL" && ticket.estado !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== "ALL" && ticket.prioridad !== priorityFilter) return false;

      // Type filter
      if (typeFilter !== "ALL" && ticket.tipo !== typeFilter) return false;

      // Origin filter
      if (originFilter !== "ALL" && ticket.origen !== originFilter) return false;

      // Search term filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const idMatch = `#${ticket.id}`.toLowerCase().includes(term) || `${ticket.id}`.includes(term);
      const asuntoMatch = ticket.asunto?.toLowerCase().includes(term);
      const mensajeMatch = ticket.mensaje?.toLowerCase().includes(term);
      const remitenteMatch = ticket.nombreContacto?.toLowerCase().includes(term);
      const emailMatch = ticket.emailContacto?.toLowerCase().includes(term);
      const phoneMatch = ticket.telefonoContacto?.toLowerCase().includes(term);
      const empresaMatch =
        ticket.empresaNombre?.toLowerCase().includes(term) ||
        ticket.empresaNombreManual?.toLowerCase().includes(term);

      return (
        idMatch ||
        asuntoMatch ||
        mensajeMatch ||
        remitenteMatch ||
        emailMatch ||
        phoneMatch ||
        empresaMatch
      );
    });
  }, [tickets, statusFilter, priorityFilter, typeFilter, originFilter, searchTerm]);

  // Date formatter
  const formatDate = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return "Sin fecha";
    try {
      const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
      if (isNaN(d.getTime())) return "Sin fecha";
      return format(d, "dd MMM yyyy, HH:mm", { locale: es });
    } catch {
      return "Sin fecha";
    }
  };

  // Avatar background colors
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

  const getTipoLabel = (tipo: TicketTipo) => {
    switch (tipo) {
      case "PROBLEMA_TECNICO":
        return "Problema Técnico";
      case "DISPOSITIVO_GPS":
        return "Dispositivo GPS";
      case "FACTURACION":
        return "Facturación";
      case "QUEJA_RECLAMO":
        return "Queja / Reclamo";
      case "CONSULTA_GENERAL":
        return "Consulta";
      case "OTRO":
      default:
        return "Otro";
    }
  };

  const getPrioridadBadge = (prioridad: TicketPrioridad) => {
    switch (prioridad) {
      case "URGENTE":
        return (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-semibold text-[11px] gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
            URGENTE
          </Badge>
        );
      case "ALTA":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold text-[11px]">
            ALTA
          </Badge>
        );
      case "MEDIA":
        return (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 font-medium text-[11px]">
            MEDIA
          </Badge>
        );
      case "BAJA":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground font-medium text-[11px]">
            BAJA
          </Badge>
        );
    }
  };

  const getEstadoBadge = (estado: TicketEstado) => {
    switch (estado) {
      case "PENDIENTE":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold text-[11px] gap-1">
            <Clock className="h-3 w-3" />
            PENDIENTE
          </Badge>
        );
      case "EN_REVISION":
        return (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 font-semibold text-[11px] gap-1">
            <AlertCircle className="h-3 w-3" />
            EN_REVISION
          </Badge>
        );
      case "RESUELTO":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold text-[11px] gap-1">
            <CheckCircle2 className="h-3 w-3" />
            RESUELTO
          </Badge>
        );
      case "DESCARTADO":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground font-semibold text-[11px]">
            DESCARTADO
          </Badge>
        );
    }
  };

  // Open 360 Sheet for Ticket
  const handleOpenDetail = (ticket: TicketSoporteRow) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  // Handle updates made inside 360 Sheet
  const handleTicketUpdated = (updated: TicketSoporteRow) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    setSelectedTicket(updated);
  };

  // Direct Modo Soporte from table row
  const handleDirectModoSoporte = async (empresaId: number, empresaNombre?: string | null) => {
    setLoadingSuperadminId(empresaId);
    try {
      await enterTenantAsSuperadmin(empresaId);
      appAlert.success(
        `Ingresando a "${empresaNombre || `Empresa #${empresaId}`}" en Modo Soporte...`,
        "Modo Soporte Activado"
      );
      window.location.href = "/panel/monitoreo/dashboard";
    } catch (err: any) {
      appAlert.error(err?.message || "Error al acceder en modo soporte.");
      setLoadingSuperadminId(null);
    }
  };

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    originFilter !== "ALL" ||
    searchTerm.trim() !== "";

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setTypeFilter("ALL");
    setOriginFilter("ALL");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {/* ═══════════ 4 KPI METRIC CARDS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incidencias */}
        <Card className="border border-border/80 bg-card hover:border-primary/30 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Incidencias
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Inbox className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {computedStats.total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Tickets registrados
            </p>
          </CardContent>
        </Card>

        {/* Pendientes (con alerta si hay urgentes) */}
        <Card className="border border-border/80 bg-card hover:border-amber-500/30 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {computedStats.pendientes}
              </div>
              {computedStats.urgentes > 0 && (
                <Badge
                  variant="destructive"
                  className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[10px] px-1.5 py-0.5 gap-1 animate-pulse"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {computedStats.urgentes} urgente{computedStats.urgentes > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Requieren respuesta
            </p>
          </CardContent>
        </Card>

        {/* En Revisión */}
        <Card className="border border-border/80 bg-card hover:border-sky-500/30 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              En Revisión
            </CardTitle>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
              {computedStats.enRevision}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              En diagnóstico / soporte
            </p>
          </CardContent>
        </Card>

        {/* Resueltos */}
        <Card className="border border-border/80 bg-card hover:border-emerald-500/30 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Resueltos
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {computedStats.resueltos}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Incidencias cerradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════ TOOLBAR & FILTERS ═══════════ */}
      <div className="space-y-3 bg-card p-4 rounded-xl border border-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar ticket, empresa o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs bg-background"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 bg-muted/50 p-1 rounded-lg border border-border">
            {[
              { label: "Todos", value: "ALL" },
              { label: "Pendientes", value: "PENDIENTE" },
              { label: "En Revisión", value: "EN_REVISION" },
              { label: "Resueltos", value: "RESUELTO" },
              { label: "Descartados", value: "DESCARTADO" },
            ].map((tab) => (
              <Button
                key={tab.value}
                variant={statusFilter === tab.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(tab.value)}
                className={`h-7 text-xs font-medium px-2.5 ${
                  statusFilter === tab.value ? "bg-background shadow-2xs font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Dropdowns (Priority, Type, Origin) */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">Filtros:</span>
          </div>

          {/* Priority Select */}
          <div className="flex items-center gap-1.5 min-w-[150px]">
            <span className="text-muted-foreground text-[11px] whitespace-nowrap">Prioridad:</span>
            <Select
              value={priorityFilter}
              onValueChange={(val) => setPriorityFilter(val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-card border-input">
                <SelectValue placeholder="Todas las Prioridades" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
                <SelectItem value="ALL">Todas las Prioridades</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="MEDIA">Media</SelectItem>
                <SelectItem value="BAJA">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Select */}
          <div className="flex items-center gap-1.5 min-w-[150px]">
            <span className="text-muted-foreground text-[11px] whitespace-nowrap">Tipo:</span>
            <Select
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-card border-input">
                <SelectValue placeholder="Todos los Tipos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
                <SelectItem value="ALL">Todos los Tipos</SelectItem>
                <SelectItem value="PROBLEMA_TECNICO">Técnico</SelectItem>
                <SelectItem value="DISPOSITIVO_GPS">GPS</SelectItem>
                <SelectItem value="FACTURACION">Facturación</SelectItem>
                <SelectItem value="QUEJA_RECLAMO">Quejas</SelectItem>
                <SelectItem value="CONSULTA_GENERAL">Consulta</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Origin Select */}
          <div className="flex items-center gap-1.5 min-w-[130px]">
            <span className="text-muted-foreground text-[11px] whitespace-nowrap">Origen:</span>
            <Select
              value={originFilter}
              onValueChange={(val) => setOriginFilter(val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-card border-input">
                <SelectValue placeholder="Todos los Orígenes" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
                <SelectItem value="ALL">Todos los Orígenes</SelectItem>
                <SelectItem value="PANEL">Panel</SelectItem>
                <SelectItem value="WEB">Web</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 ml-auto"
            >
              <RefreshCw className="h-3 w-3" />
              Limpiar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* ═══════════ TICKETS TABLE ═══════════ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[110px] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Ticket & Origen
              </TableHead>
              <TableHead className="w-[240px] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Remitente & Empresa
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Asunto & Tipo
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Prioridad
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
            {filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <Headphones className="h-8 w-8 text-muted-foreground/40 stroke-1" />
                    <p className="text-sm font-medium text-foreground">
                      No se encontraron incidencias
                    </p>
                    <p className="text-xs text-muted-foreground/80 max-w-sm">
                      No hay tickets de soporte que coincidan con los filtros aplicados.
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs"
                      >
                        Limpiar Filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => {
                const initials =
                  ((ticket.nombreContacto || "")
                    .split(" ")
                    .filter(Boolean)
                    .map((w) => (w ? w[0] : ""))
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()) || "U";

                const cleanPhone = ticket.telefonoContacto
                  ? ticket.telefonoContacto.replace(/[^\d+]/g, "").replace("+", "")
                  : "";
                const waGreeting = `Hola ${ticket.nombreContacto}, te escribimos desde el equipo de Soporte TrackOps respecto a tu ticket #${ticket.id} (${ticket.asunto}).`;
                const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waGreeting)}` : null;

                const isCurrentlySuperadmin = loadingSuperadminId === ticket.empresaId;

                return (
                  <TableRow
                    key={ticket.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Ticket ID & Origen */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-mono text-xs font-bold text-foreground">
                          #{ticket.id}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            ticket.origen === "PANEL"
                              ? "bg-primary/10 text-primary border-primary/20 text-[10px] font-mono py-0"
                              : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] font-mono py-0"
                          }
                        >
                          {ticket.origen === "PANEL" ? "PANEL" : "WEB"}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Remitente & Empresa */}
                    <TableCell>
                      <div
                        onClick={() => handleOpenDetail(ticket)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 transition-transform group-hover:scale-105 ${getAvatarBg(
                            ticket.nombreContacto
                          )}`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                            {ticket.nombreContacto}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                            <Building2 className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">
                              {ticket.empresaNombre || ticket.empresaNombreManual || "Visitante Web"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Asunto & Tipo */}
                    <TableCell className="max-w-xs">
                      <div
                        onClick={() => handleOpenDetail(ticket)}
                        className="space-y-1 cursor-pointer group"
                      >
                        <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {ticket.asunto}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] bg-muted/40 font-normal">
                            {getTipoLabel(ticket.tipo)}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>

                    {/* Prioridad */}
                    <TableCell>{getPrioridadBadge(ticket.prioridad)}</TableCell>

                    {/* Estado */}
                    <TableCell>{getEstadoBadge(ticket.estado)}</TableCell>

                    {/* Fecha de Alta */}
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatDate(ticket.createdAt)}
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct WhatsApp Quick Button */}
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Responder por WhatsApp"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700"
                            >
                              <span>📱</span>
                            </Button>
                          </a>
                        )}

                        {/* Direct Modo Soporte */}
                        {ticket.empresaId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDirectModoSoporte(ticket.empresaId!, ticket.empresaNombre)}
                            disabled={isCurrentlySuperadmin}
                            title="Acceder como Empresa en Modo Soporte"
                            className="h-8 px-2 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
                          >
                            {isCurrentlySuperadmin ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Headphones className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">Modo Soporte</span>
                              </>
                            )}
                          </Button>
                        )}

                        {/* Ver Ficha 360° Button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenDetail(ticket)}
                          className="h-8 px-2.5 text-xs font-medium gap-1.5 shadow-2xs hover:bg-secondary/80"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver Ficha 360°</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Table Footer Summary */}
        <div className="px-6 py-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Mostrando{" "}
            <span className="font-semibold text-foreground">
              {filteredTickets.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-foreground">
              {tickets.length}
            </span>{" "}
            incidencias
          </div>
          <div className="font-mono text-[11px]">
            Mesa de Ayuda TrackOps v1.0
          </div>
        </div>
      </div>

      {/* ═══════════ 360 DETAIL SHEET INSTANCE ═══════════ */}
      <TicketDetailSheet
        ticket={selectedTicket}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onTicketUpdated={handleTicketUpdated}
      />
    </div>
  );
}
