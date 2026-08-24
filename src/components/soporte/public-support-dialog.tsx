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
import { NativeSelect } from "@/components/ui/native-select";
import {
  Headphones,
  Send,
  Loader2,
  Mail,
  Phone,
  MessageSquare,
  Building2,
  User,
} from "lucide-react";
import { createSupportTicket } from "@/lib/soporte-actions";
import type { TicketTipo, PreferenciaRespuesta } from "@/types/soporte";
import { appAlert } from "@/lib/alerts";

export interface PublicSupportDialogProps {
  triggerClassName?: string;
  triggerText?: string;
  defaultOpen?: boolean;
}

const TIPO_OPTIONS: { value: TicketTipo; label: string }[] = [
  { value: "CONSULTA_GENERAL", label: "Consulta General / Asesoramiento" },
  { value: "PROBLEMA_TECNICO", label: "Falla Técnica / Error en el Sistema" },
  { value: "DISPOSITIVO_GPS", label: "Problema con GPS / Vehículo / Telemetría" },
  { value: "FACTURACION", label: "Consulta de Facturación / Plan" },
  { value: "QUEJA_RECLAMO", label: "Reclamo / Disconformidad" },
  { value: "OTRO", label: "Otro Motivo" },
];

const PREFERENCIA_OPTIONS: { value: PreferenciaRespuesta; label: string; icon: any }[] = [
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
];

export function PublicSupportDialog({
  triggerClassName,
  triggerText = "Hablar con Soporte",
  defaultOpen = false,
}: PublicSupportDialogProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const [nombreContacto, setNombreContacto] = useState<string>("");
  const [emailContacto, setEmailContacto] = useState<string>("");
  const [telefonoContacto, setTelefonoContacto] = useState<string>("");
  const [empresaNombreManual, setEmpresaNombreManual] = useState<string>("");
  const [tipo, setTipo] = useState<TicketTipo>("CONSULTA_GENERAL");
  const [asunto, setAsunto] = useState<string>("");
  const [mensaje, setMensaje] = useState<string>("");
  const [preferenciaRespuesta, setPreferenciaRespuesta] = useState<PreferenciaRespuesta>("EMAIL");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const resetForm = () => {
    setNombreContacto("");
    setEmailContacto("");
    setTelefonoContacto("");
    setEmpresaNombreManual("");
    setTipo("CONSULTA_GENERAL");
    setAsunto("");
    setMensaje("");
    setPreferenciaRespuesta("EMAIL");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombreContacto.trim()) {
      appAlert.error("Por favor ingresa tu nombre de contacto.");
      return;
    }

    if (!asunto.trim()) {
      appAlert.error("Por favor ingresa un asunto para tu consulta.");
      return;
    }

    if (!mensaje.trim()) {
      appAlert.error("Por favor ingresa el detalle de tu mensaje.");
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
        origen: "WEB",
        nombreContacto: nombreContacto.trim(),
        emailContacto: emailContacto.trim() || undefined,
        telefonoContacto: telefonoContacto.trim() || undefined,
        empresaNombreManual: empresaNombreManual.trim() || undefined,
        tipo,
        asunto: asunto.trim(),
        mensaje: mensaje.trim(),
        preferenciaRespuesta,
      });

      if (res.success) {
        appAlert.success(
          "Tu mensaje fue enviado con éxito. Un asesor de soporte se contactará contigo.",
          "Soporte TrackOps"
        );
        resetForm();
        setOpen(false);
      } else {
        appAlert.error(res.error || "No se pudo enviar tu consulta de soporte.");
      }
    } catch (err: any) {
      appAlert.error(err?.message || "Ocurrió un error inesperado al enviar la consulta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ||
          "text-sm text-[#EAEAEA] hover:text-[#F2B705] transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0 font-normal text-left"
        }
      >
        <Headphones className="h-4 w-4 text-[#F2B705] shrink-0" />
        <span>{triggerText}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:max-w-xl border-border bg-card">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Headphones className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Mesa de Ayuda y Soporte TrackOps
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              ¿Tienes dudas sobre el servicio, problemas técnicos o necesitas asistencia con tu cuenta? Envíanos tu consulta y un especialista te responderá a la brevedad.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            {/* Nombre y Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="public-nombre" className="text-xs font-semibold text-foreground">
                  Nombre y Apellido *
                </Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="public-nombre"
                    value={nombreContacto}
                    onChange={(e) => setNombreContacto(e.target.value)}
                    placeholder="Ej: Laura Gómez"
                    className="h-9 pl-8 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="public-empresa" className="text-xs font-semibold text-foreground">
                  Empresa / Flota (opcional)
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="public-empresa"
                    value={empresaNombreManual}
                    onChange={(e) => setEmpresaNombreManual(e.target.value)}
                    placeholder="Ej: Logística Gómez S.A."
                    className="h-9 pl-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Preferencia de Contacto */}
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

              {/* Campos dinámicos de contacto */}
              {preferenciaRespuesta === "EMAIL" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="public-email" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      <span>Email de Contacto *</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="public-email"
                        type="email"
                        value={emailContacto}
                        onChange={(e) => setEmailContacto(e.target.value)}
                        placeholder="laura@empresa.com"
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="public-telefono" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Teléfono (opcional)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="public-telefono"
                        type="tel"
                        value={telefonoContacto}
                        onChange={(e) => setTelefonoContacto(e.target.value)}
                        placeholder="+54 9 11 5555-1234"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="public-telefono" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Número de WhatsApp *</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="public-telefono"
                        type="tel"
                        value={telefonoContacto}
                        onChange={(e) => setTelefonoContacto(e.target.value)}
                        placeholder="+54 9 11 5555-1234"
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="public-email" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Email (opcional)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="public-email"
                        type="email"
                        value={emailContacto}
                        onChange={(e) => setEmailContacto(e.target.value)}
                        placeholder="laura@empresa.com"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tipo de Consulta */}
            <div className="space-y-1.5">
              <Label htmlFor="public-tipo" className="text-xs font-semibold text-foreground">
                Tipo de Requerimiento o Consulta
              </Label>
              <NativeSelect
                id="public-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TicketTipo)}
                sizeVariant="default"
              >
                {TIPO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </NativeSelect>
            </div>

            {/* Asunto */}
            <div className="space-y-1.5">
              <Label htmlFor="public-asunto" className="text-xs font-semibold text-foreground">
                Asunto *
              </Label>
              <Input
                id="public-asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Ej: Consulta técnica o soporte para cuenta"
                className="h-9 text-xs"
                required
              />
            </div>

            {/* Mensaje */}
            <div className="space-y-1.5">
              <Label htmlFor="public-mensaje" className="text-xs font-semibold text-foreground">
                Mensaje o Consulta *
              </Label>
              <textarea
                id="public-mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring text-foreground resize-y"
                placeholder="Describe con claridad tu requerimiento, duda o problema técnico..."
                required
              />
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
                className="h-9 px-5 text-xs font-semibold gap-2 shadow-xs bg-[#F2B705] text-[#1E2227] hover:bg-[#e0aa04]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Enviando Consulta...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Enviar Consulta
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

export default PublicSupportDialog;
