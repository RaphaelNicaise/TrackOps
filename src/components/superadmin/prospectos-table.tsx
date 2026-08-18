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
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Filter,
  Mail,
  MessageSquare,
  MessageSquareShare,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Search,
  SlidersHorizontal,
  Truck,
  UserCheck,
  UserPlus,
  UserX,
  X,
  Zap,
} from "lucide-react";
import { Prospecto } from "@/lib/prospectos-actions";
import {
  ProspectoDetailDialog,
  PIPELINE_STATUS_CONFIG,
} from "./prospecto-detail-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface ProspectosTableProps {
  initialProspectos: Prospecto[];
}

type PipelineTabKey =
  | "todos"
  | "nuevo"
  | "contactado"
  | "demo_agendada"
  | "convertido"
  | "descartado";

const PIPELINE_TABS: { key: PipelineTabKey; label: string; icon: React.ElementType }[] = [
  { key: "todos", label: "Todos", icon: SlidersHorizontal },
  { key: "nuevo", label: "Nuevos", icon: Clock },
  { key: "contactado", label: "Contactados", icon: PhoneCall },
  { key: "demo_agendada", label: "Demo Agendada", icon: Calendar },
  { key: "convertido", label: "Convertidos", icon: CheckCircle2 },
  { key: "descartado", label: "Descartados", icon: UserX },
];

export function ProspectosTable({ initialProspectos }: ProspectosTableProps) {
  const [prospectos, setProspectos] = useState<Prospecto[]>(initialProspectos);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<PipelineTabKey>("todos");

  // Selected lead for detail modal
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<PipelineTabKey, number> = {
      todos: prospectos.length,
      nuevo: 0,
      contactado: 0,
      demo_agendada: 0,
      convertido: 0,
      descartado: 0,
    };

    for (const p of prospectos) {
      const st = (p.estado || "nuevo").toLowerCase() as PipelineTabKey;
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    }

    return counts;
  }, [prospectos]);

  // Filtered prospectos list
  const filteredProspectos = useMemo(() => {
    return prospectos.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        p.nombre.toLowerCase().includes(q) ||
        (p.empresa && p.empresa.toLowerCase().includes(q)) ||
        p.email.toLowerCase().includes(q) ||
        (p.telefono && p.telefono.toLowerCase().includes(q)) ||
        (p.mensaje && p.mensaje.toLowerCase().includes(q));

      const leadStatus = (p.estado || "nuevo").toLowerCase();
      const matchTab = activeTab === "todos" || leadStatus === activeTab;

      return matchSearch && matchTab;
    });
  }, [prospectos, searchQuery, activeTab]);

  const handleOpenDetail = (prospecto: Prospecto) => {
    setSelectedProspecto(prospecto);
    setIsDetailOpen(true);
  };

  const handleStatusUpdated = (updated: Prospecto) => {
    setProspectos((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setSelectedProspecto(updated);
  };

  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return "Sin fecha";
    try {
      const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
      if (isNaN(d.getTime())) return "Fecha no disp.";
      return format(d, "dd MMM yyyy", { locale: es });
    } catch {
      return "Fecha no disp.";
    }
  };

  // Color generator for avatar
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

  const getStatusBadge = (estado: string | null) => {
    const key = (estado || "nuevo").toLowerCase();
    const config = PIPELINE_STATUS_CONFIG[key] || PIPELINE_STATUS_CONFIG.nuevo;
    const Icon = config.icon;

    return (
      <Badge className={`${config.badgeClass} gap-1 text-[11px] font-medium transition-colors`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Tabs Toolbar */}
      <div className="space-y-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por contacto, empresa, email o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
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

          <div className="text-xs text-muted-foreground font-mono">
            {tabCounts.nuevo > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                {tabCounts.nuevo} {tabCounts.nuevo === 1 ? "lead nuevo" : "leads nuevos"}
              </span>
            )}
          </div>
        </div>

        {/* Pipeline Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-border/60">
          {PIPELINE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.key;
            const count = tabCounts[tab.key];

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isCurrent
                      ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[260px] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Prospecto / Contacto
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Empresa & Flota
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Teléfono
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Fecha de Solicitud
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Estado Pipeline
              </TableHead>
              <TableHead className="text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider pr-6">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredProspectos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <UserPlus className="h-8 w-8 text-muted-foreground/40 stroke-1" />
                    <p className="text-sm font-medium text-foreground">
                      No se encontraron prospectos
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {searchQuery
                        ? `No hay prospectos que coincidan con "${searchQuery}".`
                        : "No hay prospectos en esta etapa del pipeline comercial."}
                    </p>
                    {(searchQuery || activeTab !== "todos") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setActiveTab("todos");
                        }}
                        className="mt-2 text-xs"
                      >
                        Ver todos los prospectos
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProspectos.map((lead) => {
                const initials = lead.nombre
                  .split(" ")
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                const cleanPhone = (lead.telefono || "").replace(/\D/g, "");
                const waUrl = cleanPhone
                  ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Hola ${lead.nombre}, te contacto de TrackOps respecto a tu solicitud.`
                    )}`
                  : null;

                return (
                  <TableRow
                    key={lead.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Prospecto Name & Email */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs border ${getAvatarBg(
                            lead.nombre
                          )}`}
                        >
                          {initials || "LE"}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate">
                            {lead.nombre}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:underline hover:text-foreground"
                            >
                              {lead.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Empresa & Flota */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{lead.empresa || "Empresa no especificada"}</span>
                        </div>
                        {lead.flotaEstimada != null ? (
                          <div className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                            <Truck className="h-3 w-3" />
                            <span>{lead.flotaEstimada} veh.</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Flota no estimada
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Teléfono & Direct Actions */}
                    <TableCell>
                      {lead.telefono ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-foreground">
                            {lead.telefono}
                          </span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Enviar WhatsApp"
                              className="text-emerald-500 hover:text-emerald-600 p-1 rounded hover:bg-emerald-500/10 transition-colors"
                            >
                              <MessageSquareShare className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">
                          Sin teléfono
                        </span>
                      )}
                    </TableCell>

                    {/* Fecha de Solicitud */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </TableCell>

                    {/* Estado Pipeline */}
                    <TableCell>{getStatusBadge(lead.estado)}</TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right pr-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(lead)}
                        className="h-8 px-3 text-xs font-medium hover:bg-primary hover:text-primary-foreground gap-1.5 transition-all shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Ver Detalle</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Table Footer */}
        <div className="px-6 py-3.5 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Mostrando{" "}
            <span className="font-semibold text-foreground">
              {filteredProspectos.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-foreground">
              {prospectos.length}
            </span>{" "}
            solicitudes registradas
          </div>
          <div className="font-mono text-[11px]">
            Pipeline CRM TrackOps v1.0
          </div>
        </div>
      </div>

      {/* Prospecto Detail Modal */}
      <ProspectoDetailDialog
        prospecto={selectedProspecto}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}
