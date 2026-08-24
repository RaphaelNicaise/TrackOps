"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Headphones,
  Send,
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { createSupportTicket } from "@/lib/soporte-actions";
import type { TicketTipo, TicketPrioridad, PreferenciaRespuesta } from "@/types/soporte";
import { appAlert } from "@/lib/alerts";

export interface SupportTicketHeaderButtonProps {
  userName?: string | null;
  userEmail?: string | null;
  empresaNombre?: string | null;
  empresaId?: number | null;
  userRole?: string | null;
  defaultOpen?: boolean;
}

const TIPO_OPTIONS: { value: TicketTipo; label: string }[] = [
  { value: "PROBLEMA_TECNICO", label: "Falla Técnica / Error en el Sistema" },
  { value: "DISPOSITIVO_GPS", label: "Problema con GPS / Vehículo / Telemetría" },
  { value: "FACTURACION", label: "Consulta de Facturación / Plan" },
  { value: "QUEJA_RECLAMO", label: "Reclamo / Disconformidad" },
  { value: "CONSULTA_GENERAL", label: "Consulta General / Asesoramiento" },
  { value: "OTRO", label: "Otro Motivo" },
];

const PRIORIDAD_OPTIONS: { value: TicketPrioridad; label: string; color: string }[] = [
  { value: "BAJA", label: "Baja", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  { value: "MEDIA", label: "Media", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  { value: "ALTA", label: "Alta", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  { value: "URGENTE", label: "Urgente", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold" },
];

const PREFERENCIA_OPTIONS: { value: PreferenciaRespuesta; label: string; icon: any }[] = [
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
];

export function SupportTicketHeaderButton({
  userName,
  userEmail,
  empresaNombre,
  empresaId,
  userRole,
  defaultOpen = false,
}: SupportTicketHeaderButtonProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const [tipo, setTipo] = useState<TicketTipo>("PROBLEMA_TECNICO");
  const [prioridad, setPrioridad] = useState<TicketPrioridad>("MEDIA");
  const [asunto, setAsunto] = useState<string>("");
  const [mensaje, setMensaje] = useState<string>("");
  const [emailContacto, setEmailContacto] = useState<string>(userEmail || "");
  const [telefonoContacto, setTelefonoContacto] = useState<string>("");
  const [preferenciaRespuesta, setPreferenciaRespuesta] = useState<PreferenciaRespuesta>("EMAIL");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const resetForm = () => {
    setTipo("PROBLEMA_TECNICO");
    setPrioridad("MEDIA");
    setAsunto("");
    setMensaje("");
    setEmailContacto(userEmail || "");
    setTelefonoContacto("");
    setPreferenciaRespuesta("EMAIL");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!asunto.trim()) {
      appAlert.error("Por favor ingresa un asunto para tu ticket.");
      return;
    }

    if (!mensaje.trim()) {
      appAlert.error("Por favor ingresa el detalle o descripción del ticket.");
      return;
    }

    if (preferenciaRespuesta === "EMAIL" && !emailContacto.trim()) {
      appAlert.error("Por favor ingresa tu email de contacto para recibir respuesta por correo.");
      return;
    }

    if (preferenciaRespuesta === "WHATSAPP" && !telefonoContacto.trim()) {
      appAlert.error("Por favor ingresa tu número de WhatsApp para recibir respuesta.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSupportTicket({
        origen: "PANEL",
        empresaId: empresaId ?? undefined,
        nombreContacto: (userName || userEmail || "Usuario").trim(),
        emailContacto: emailContacto.trim() || undefined,
        telefonoContacto: telefonoContacto.trim() || undefined,
        tipo,
        prioridad,
        asunto: asunto.trim(),
        mensaje: mensaje.trim(),
        preferenciaRespuesta,
      });

      if (res.success) {
        appAlert.success(
          "Tu consulta fue recibida. Te responderemos a la brevedad.",
          "Ticket de Soporte"
        );
        resetForm();
        setOpen(false);
      } else {
        appAlert.error(res.error || "No se pudo registrar tu ticket de soporte.");
      }
    } catch (err: any) {
      appAlert.error(err?.message || "Ocurrió un error inesperado al enviar el ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setEmailContacto(userEmail || "");
          setOpen(true);
        }}
        title="Contactar Soporte / Reportar Incidencia"
        aria-label="Contactar Soporte / Reportar Incidencia"
        className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-colors"
      >
        <Headphones className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline font-medium">Soporte</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:max-w-xl border-border bg-card">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Headphones className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Centro de Soporte &amp; Incidencias
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Envíanos tu consulta, reporte técnico o solicitud de asistencia. Nuestro equipo de guardia atenderá tu ticket.
            </DialogDescription>
          </DialogHeader>

          {/* Session / Tenant context badge card */}
          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>Empresa / Tenant:</span>
                <strong className="text-foreground">
                  {empresaNombre || (empresaId ? `Empresa #${empresaId}` : "Plataforma General")}
                </strong>
              </span>
              {userRole && (
                <Badge variant="outline" className="text-[10px] font-mono uppercase">
                  {userRole}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground pt-1">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                Remitente: <strong className="text-foreground">{userName || userEmail || "Usuario del Panel"}</strong>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            {/* Tipo de Ticket */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-tipo" className="text-xs font-semibold text-foreground">
                Tipo de Requerimiento o Falla
              </Label>
              <Select
                value={tipo}
                onValueChange={(val) => setTipo(val as TicketTipo)}
              >
                <SelectTrigger id="ticket-tipo" className="h-10 rounded-xl bg-card border-input">
                  <SelectValue placeholder="Seleccionar tipo de ticket" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
                  {TIPO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridad */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Nivel de Prioridad</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORIDAD_OPTIONS.map((p) => {
                  const isSelected = prioridad === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPrioridad(p.value)}
                      className={`px-2 py-1.5 text-xs rounded border transition-colors text-center font-medium ${
                        isSelected
                          ? `${p.color} border-current shadow-xs`
                          : "bg-background border-border text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      {p.label}
                      <span className="sr-only">{p.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asunto */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-asunto" className="text-xs font-semibold text-foreground">
                Asunto / Título del Reclamo *
              </Label>
              <Input
                id="ticket-asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Ej: Vehículo no reporta posición en mapa"
                className="h-9 text-xs"
                required
              />
            </div>

            {/* Mensaje */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-mensaje" className="text-xs font-semibold text-foreground">
                Mensaje y Detalle del Problema *
              </Label>
              <textarea
                id="ticket-mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring text-foreground resize-y"
                placeholder="Describe detalladamente lo ocurrido, identificador o patente de los vehículos afectados, fecha y hora del incidente..."
                required
              />
            </div>

            {/* Preferencia de Respuesta */}
            <div className="space-y-2 pt-1 border-t border-border/60">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>¿Por qué medio prefieres recibir la respuesta?</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {PREFERENCIA_OPTIONS.map((opt) => {
                  const isSelected = preferenciaRespuesta === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPreferenciaRespuesta(opt.value)}
                      className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                          : "bg-background border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Campo dinámico según preferencia */}
              {preferenciaRespuesta === "EMAIL" ? (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="ticket-email" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                    <span>Email de Contacto para Respuesta *</span>
                  </Label>
                  <Input
                    id="ticket-email"
                    type="email"
                    value={emailContacto}
                    onChange={(e) => setEmailContacto(e.target.value)}
                    placeholder="tu-email@empresa.com"
                    className="h-9 text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Te enviaremos la resolución del ticket a esta casilla de correo.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="ticket-telefono" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Número de WhatsApp para Respuesta *</span>
                  </Label>
                  <Input
                    id="ticket-telefono"
                    type="tel"
                    value={telefonoContacto}
                    onChange={(e) => setTelefonoContacto(e.target.value)}
                    placeholder="+54 9 11 5555-1234"
                    className="h-9 text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Un asesor de soporte te escribirá directamente por WhatsApp a este número.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="h-9 px-4 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-9 px-5 text-xs font-semibold gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Enviando Ticket...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Enviar Ticket
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SupportTicketHeaderButton;
