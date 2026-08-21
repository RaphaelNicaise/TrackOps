"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  TicketSoporteRow,
  TicketEstado,
  TicketPrioridad,
  TicketTipo,
  PreferenciaRespuesta,
} from "@/types/soporte";
import {
  updateTicketStatus,
  updateTicketPriority,
  saveTicketInternalNotes,
} from "@/lib/soporte-actions";
import { enterTenantAsSuperadmin } from "@/lib/impersonation";
import { appAlert } from "@/lib/alerts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Headphones,
  Mail,
  Phone,
  Building2,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Save,
  Check,
  Loader2,
  Sparkles,
  ArrowUpRight,
  HelpCircle,
  XCircle,
} from "lucide-react";

export interface TicketDetailSheetProps {
  ticket: TicketSoporteRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdated?: (updatedTicket: TicketSoporteRow) => void;
}

export function TicketDetailSheet({
  ticket,
  open,
  onOpenChange,
  onTicketUpdated,
}: TicketDetailSheetProps) {
  const [notas, setNotas] = useState<string>(ticket?.notasInternas || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [isEnteringTenant, setIsEnteringTenant] = useState(false);

  useEffect(() => {
    if (ticket) {
      setNotas(ticket.notasInternas || "");
    }
  }, [ticket]);

  if (!ticket) return null;

  // Format date helper
  const formatDate = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return "Sin fecha";
    try {
      const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
      if (isNaN(d.getTime())) return "Sin fecha";
      return format(d, "dd MMM yyyy, HH:mm 'hs'", { locale: es });
    } catch {
      return "Sin fecha";
    }
  };

  const getTipoLabel = (tipo: TicketTipo) => {
    switch (tipo) {
      case "PROBLEMA_TECNICO":
        return "Problema Técnico";
      case "DISPOSITIVO_GPS":
        return "Dispositivo GPS / Telemetría";
      case "FACTURACION":
        return "Facturación / Plan";
      case "QUEJA_RECLAMO":
        return "Queja / Reclamo";
      case "CONSULTA_GENERAL":
        return "Consulta General";
      case "OTRO":
      default:
        return "Otro Motivo";
    }
  };

  const getPrioridadBadge = (prioridad: TicketPrioridad) => {
    switch (prioridad) {
      case "URGENTE":
        return (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 gap-1 font-semibold">
            <AlertTriangle className="h-3 w-3" />
            URGENTE
          </Badge>
        );
      case "ALTA":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold">
            <Clock className="h-3 w-3" />
            ALTA
          </Badge>
        );
      case "MEDIA":
        return (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 gap-1 font-semibold">
            MEDIA
          </Badge>
        );
      case "BAJA":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1 font-semibold">
            BAJA
          </Badge>
        );
    }
  };

  const getEstadoBadge = (estado: TicketEstado) => {
    switch (estado) {
      case "PENDIENTE":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold">
            <Clock className="h-3 w-3" />
            PENDIENTE
          </Badge>
        );
      case "EN_REVISION":
        return (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 gap-1 font-semibold">
            <AlertCircle className="h-3 w-3" />
            EN_REVISION
          </Badge>
        );
      case "RESUELTO":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            RESUELTO
          </Badge>
        );
      case "DESCARTADO":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1 font-semibold">
            <XCircle className="h-3 w-3" />
            DESCARTADO
          </Badge>
        );
    }
  };

  // WhatsApp and Email link generators
  const cleanPhone = ticket.telefonoContacto
    ? ticket.telefonoContacto.replace(/[^\d+]/g, "").replace("+", "")
    : "";
  const waGreeting = `Hola ${ticket.nombreContacto}, te escribimos desde el equipo de Soporte TrackOps en respuesta a tu ticket #${ticket.id} ("${ticket.asunto}"). ¿En qué podemos ayudarte hoy?`;
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waGreeting)}` : null;

  const emailSubject = `Soporte TrackOps - Re: ${ticket.asunto} [Ticket #${ticket.id}]`;
  const emailBody = `Hola ${ticket.nombreContacto},\n\nGracias por comunicarte con Soporte TrackOps.\n\nRespecto a tu ticket #${ticket.id} (${ticket.asunto}):\n\n`;
  const mailtoLink = ticket.emailContacto
    ? `mailto:${ticket.emailContacto}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : null;

  // Modo Soporte Action
  const handleLaunchModoSoporte = async () => {
    if (!ticket.empresaId) return;
    setIsEnteringTenant(true);
    try {
      await enterTenantAsSuperadmin(ticket.empresaId);
      appAlert.success(
        `Ingresando a "${ticket.empresaNombre || `Empresa #${ticket.empresaId}`}" en Modo Soporte...`,
        "Modo Soporte Activado"
      );
      window.location.href = "/panel/monitoreo/dashboard";
    } catch (err: any) {
      appAlert.error(err?.message || "Error al acceder en modo soporte.");
      setIsEnteringTenant(false);
    }
  };

  // Internal Notes Action
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await saveTicketInternalNotes(ticket.id, notas);
      const updated: TicketSoporteRow = {
        ...ticket,
        notasInternas: notas,
        updatedAt: new Date(),
      };
      onTicketUpdated?.(updated);
      appAlert.success("Notas internas guardadas correctamente.", "Guardado");
    } catch (err: any) {
      appAlert.error(err?.message || "Error al guardar notas internas.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Status Change Action
  const handleStatusChange = async (newStatus: TicketEstado) => {
    if (ticket.estado === newStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateTicketStatus(ticket.id, newStatus, notas);
      const updated: TicketSoporteRow = res?.success && res?.data ? res.data : {
        ...ticket,
        estado: newStatus,
        notasInternas: notas,
        resueltoAt: newStatus === "RESUELTO" ? new Date() : ticket.resueltoAt,
        updatedAt: new Date(),
      };
      onTicketUpdated?.(updated);
      appAlert.success(`Estado actualizado a ${newStatus}.`, "Estado Modificado");
    } catch (err: any) {
      appAlert.error(err?.message || "Error al actualizar estado.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Priority Change Action
  const handlePriorityChange = async (newPriority: TicketPrioridad) => {
    if (ticket.prioridad === newPriority) return;
    setIsUpdatingPriority(true);
    try {
      await updateTicketPriority(ticket.id, newPriority);
      const updated: TicketSoporteRow = {
        ...ticket,
        prioridad: newPriority,
        updatedAt: new Date(),
      };
      onTicketUpdated?.(updated);
      appAlert.success(`Prioridad actualizada a ${newPriority}.`, "Prioridad Modificada");
    } catch (err: any) {
      appAlert.error(err?.message || "Error al actualizar prioridad.");
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background border-l border-border shadow-2xl overflow-hidden"
      >
        {/* ═══════════ HEADER BANNER ═══════════ */}
        <SheetHeader className="bg-card border-b border-border p-6 pb-4 shrink-0 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold bg-muted px-2.5 py-1 rounded-md text-foreground border border-border">
                #{ticket.id}
              </span>
              <Badge
                variant="outline"
                className={
                  ticket.origen === "PANEL"
                    ? "bg-primary/10 text-primary border-primary/30 font-semibold text-xs"
                    : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold text-xs"
                }
              >
                {ticket.origen === "PANEL" ? "PANEL" : "WEB"}
              </Badge>
              {getEstadoBadge(ticket.estado)}
            </div>
          </div>

          <SheetTitle className="text-lg font-bold text-foreground tracking-tight mt-2">
            Ficha 360° de Incidencia
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Alta: {formatDate(ticket.createdAt)}
            </span>
            {ticket.updatedAt && (
              <>
                <span>•</span>
                <span>Última modif: {formatDate(ticket.updatedAt)}</span>
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* ═══════════ SCROLLABLE BODY ═══════════ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. CONTACT & ORIGIN DETAILS CARD */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Datos del Remitente & Contacto
                </h4>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono bg-muted/40">
                {ticket.origen === "PANEL" ? "Usuario Autenticado" : "Visitante Web"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Nombre Completo</span>
                <span className="font-semibold text-foreground text-sm flex items-center gap-1 mt-0.5">
                  {ticket.nombreContacto}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Empresa / Flota</span>
                <span className="font-semibold text-foreground text-sm flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {ticket.empresaNombre || ticket.empresaNombreManual || "Visitante Web"}
                  {ticket.empresaId && (
                    <Badge variant="outline" className="text-[10px] font-mono ml-1 py-0">
                      ID #{ticket.empresaId}
                    </Badge>
                  )}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Email</span>
                <a
                  href={`mailto:${ticket.emailContacto}`}
                  className="font-medium text-primary hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {ticket.emailContacto}
                </a>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Teléfono / WhatsApp</span>
                {ticket.telefonoContacto ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <a
                      href={`tel:${ticket.telefonoContacto}`}
                      className="font-medium text-foreground hover:text-primary flex items-center gap-1"
                    >
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {ticket.telefonoContacto}
                    </a>
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5"
                      >
                        WA <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground mt-0.5 block italic">No registrado</span>
                )}
              </div>
            </div>
          </div>

          {/* 2. TICKET CONTENT CARD */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Detalle del Reclamo / Consulta
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[11px] bg-muted/30">
                  {ticket.tipo} ({getTipoLabel(ticket.tipo)})
                </Badge>
                {getPrioridadBadge(ticket.prioridad)}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-muted-foreground block">Asunto</span>
                <h3 className="text-sm font-bold text-foreground mt-0.5">
                  {ticket.asunto}
                </h3>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block">Mensaje Completo</span>
                <div className="mt-1 p-3 rounded-lg bg-muted/40 border border-border/80 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                  {ticket.mensaje}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span>Canal de respuesta preferido:</span>
                </span>
                <Badge variant="secondary" className="font-semibold text-[11px]">
                  {ticket.preferenciaRespuesta || "EMAIL"}
                </Badge>
              </div>

              {ticket.estado === "RESUELTO" && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      Resuelto por: <strong>{ticket.resueltoPor || "Superadmin"}</strong>
                    </span>
                  </div>
                  {ticket.resueltoAt && (
                    <span className="font-mono text-[11px]">
                      {formatDate(ticket.resueltoAt)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. QUICK ACTION BUTTONS */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Acciones Rápidas de Respuesta
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {/* WhatsApp Button */}
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center text-xs h-9 gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700"
                  >
                    <span>📱</span>
                    <span>Responder por WhatsApp</span>
                  </Button>
                </a>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="w-full justify-center text-xs h-9 gap-1.5 opacity-50"
                  title="Sin número de teléfono registrado"
                >
                  <span>📱</span>
                  <span>Responder por WhatsApp</span>
                </Button>
              )}

              {/* Email Button */}
              {mailtoLink ? (
                <a href={mailtoLink} className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center text-xs h-9 gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:text-blue-700"
                  >
                    <span>✉️</span>
                    <span>Responder por Email</span>
                  </Button>
                </a>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="w-full justify-center text-xs h-9 gap-1.5 opacity-50"
                >
                  <span>✉️</span>
                  <span>Responder por Email</span>
                </Button>
              )}

              {/* Modo Soporte Button */}
              {ticket.empresaId ? (
                <Button
                  size="sm"
                  onClick={handleLaunchModoSoporte}
                  disabled={isEnteringTenant}
                  className="w-full justify-center text-xs h-9 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs"
                >
                  {isEnteringTenant ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Ingresando...</span>
                    </>
                  ) : (
                    <>
                      <span>🛠️</span>
                      <span>Entrar en Modo Soporte</span>
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>

          {/* 4. STATUS, PRIORITY & INTERNAL NOTES */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Gestión y Notas Internas de Soporte
                </h4>
              </div>
            </div>

            {/* Selectors for Estado & Prioridad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Modificar Estado
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {(["PENDIENTE", "EN_REVISION", "RESUELTO", "DESCARTADO"] as TicketEstado[]).map(
                    (st) => (
                      <Button
                        key={st}
                        type="button"
                        variant={ticket.estado === st ? "default" : "outline"}
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusChange(st)}
                        className={`h-7 text-[11px] px-2 font-medium ${
                          ticket.estado === st
                            ? st === "RESUELTO"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : st === "PENDIENTE"
                              ? "bg-amber-600 hover:bg-amber-700 text-white"
                              : st === "EN_REVISION"
                              ? "bg-sky-600 hover:bg-sky-700 text-white"
                              : "bg-slate-700 hover:bg-slate-800 text-white"
                            : "hover:bg-muted"
                        }`}
                      >
                        {st === ticket.estado && <Check className="h-3 w-3 mr-1" />}
                        {st}
                      </Button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Modificar Prioridad
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {(["BAJA", "MEDIA", "ALTA", "URGENTE"] as TicketPrioridad[]).map((pr) => (
                    <Button
                      key={pr}
                      type="button"
                      variant={ticket.prioridad === pr ? "default" : "outline"}
                      size="sm"
                      disabled={isUpdatingPriority}
                      onClick={() => handlePriorityChange(pr)}
                      className={`h-7 text-[11px] px-2 font-medium ${
                        ticket.prioridad === pr
                          ? pr === "URGENTE"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : pr === "ALTA"
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : pr === "MEDIA"
                            ? "bg-sky-600 hover:bg-sky-700 text-white"
                            : "bg-slate-600 hover:bg-slate-700 text-white"
                          : "hover:bg-muted"
                      }`}
                    >
                      {pr === ticket.prioridad && <Check className="h-3 w-3 mr-1" />}
                      {pr}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Internal Notes Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground">
                  Notas Internas de Soporte (Visibles solo para Superadmins)
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Privado
                </span>
              </div>
              <textarea
                defaultValue={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Añade detalles sobre el seguimiento, llamadas realizadas, diagnósticos o acuerdos..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y min-h-[75px]"
              />
              <div className="flex items-center justify-between pt-1">
                {ticket.estado !== "RESUELTO" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange("RESUELTO")}
                    className="h-8 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Marcar como Resuelto
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  type="button"
                  size="sm"
                  disabled={isSavingNotes}
                  onClick={handleSaveNotes}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Guardar Notas</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ FOOTER ═══════════ */}
        <SheetFooter className="p-4 border-t bg-muted/20 shrink-0 flex flex-row items-center justify-between sm:justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            TrackOps Support Desk
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Cerrar Ficha
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
