"use client";

import React, { useState } from "react";
import { TicketSoporteRow } from "@/types/soporte";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

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
  stats = { total: 0, pendientes: 0, enRevision: 0, resueltos: 0, urgentes: 0 },
}: SoporteTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const filteredTickets = initialTickets.filter((t) => {
    if (activeTab !== "ALL" && t.estado !== activeTab) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.asunto?.toLowerCase().includes(term) ||
      t.mensaje?.toLowerCase().includes(term) ||
      t.nombreContacto?.toLowerCase().includes(term) ||
      t.emailContacto?.toLowerCase().includes(term) ||
      t.empresaNombre?.toLowerCase().includes(term) ||
      t.empresaNombreManual?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tickets */}
        <Card className="border border-border/80 bg-card hover:border-primary/30 transition-all">
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
              {stats.total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Tickets registrados
            </p>
          </CardContent>
        </Card>

        {/* Pendientes */}
        <Card className="border border-border/80 bg-card hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {stats.pendientes}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Requieren respuesta
            </p>
          </CardContent>
        </Card>

        {/* En Revisión */}
        <Card className="border border-border/80 bg-card hover:border-sky-500/30 transition-all">
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
              {stats.enRevision}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              En diagnóstico / soporte
            </p>
          </CardContent>
        </Card>

        {/* Urgentes */}
        <Card className="border border-border/80 bg-card hover:border-red-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Urgentes
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
              {stats.urgentes}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Alta prioridad
            </p>
          </CardContent>
        </Card>

        {/* Resueltos */}
        <Card className="border border-border/80 bg-card hover:border-emerald-500/30 transition-all">
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
              {stats.resueltos}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Incidencias cerradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/80 bg-card">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ticket, empresa o contacto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background h-9 text-sm"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {[
                { label: "Todos", value: "ALL" },
                { label: "Pendientes", value: "PENDIENTE" },
                { label: "En Revisión", value: "EN_REVISION" },
                { label: "Resueltos", value: "RESUELTO" },
                { label: "Descartados", value: "DESCARTADO" },
              ].map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeTab === tab.value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.value)}
                  className="h-8 text-xs font-medium"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Headphones className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">
                No se encontraron incidencias
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No hay tickets de soporte que coincidan con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[11px] font-mono">
                        #{ticket.id}
                      </Badge>
                      <Badge
                        variant={
                          ticket.estado === "PENDIENTE"
                            ? "default"
                            : ticket.estado === "EN_REVISION"
                            ? "secondary"
                            : ticket.estado === "RESUELTO"
                            ? "outline"
                            : "destructive"
                        }
                        className="text-[11px]"
                      >
                        {ticket.estado}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          ticket.prioridad === "URGENTE"
                            ? "border-red-500 text-red-600 dark:text-red-400 bg-red-500/10 text-[11px]"
                            : ticket.prioridad === "ALTA"
                            ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[11px]"
                            : "text-[11px]"
                        }
                      >
                        {ticket.prioridad}
                      </Badge>
                      <Badge variant="outline" className="text-[11px] bg-muted/40 font-mono">
                        {ticket.origen === "PANEL" ? "APP PANEL" : "WEB PÚBLICA"}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {ticket.asunto}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ticket.mensaje}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.nombreContacto}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {ticket.emailContacto}
                      </span>
                      {(ticket.empresaNombre || ticket.empresaNombreManual) && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {ticket.empresaNombre || ticket.empresaNombreManual}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
