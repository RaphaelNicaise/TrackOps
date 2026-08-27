"use client";

import React, { useState, useEffect } from "react";
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
import {
  Truck,
  Send,
  Loader2,
  Mail,
  Phone,
  Building2,
  User,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { createProspecto } from "@/lib/prospectos-actions";
import { appAlert } from "@/lib/alerts";

export interface QuoteContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiclesCount: number;
  tierName: string;
  pricePerVehicle: number;
  totalPrice: number | null;
  isAnnual: boolean;
  isEnterprise: boolean;
  maxThreshold?: number;
}

export function QuoteContactModal({
  open,
  onOpenChange,
  vehiclesCount,
  tierName,
  pricePerVehicle,
  totalPrice,
  isAnnual,
  isEnterprise,
  maxThreshold = 50,
}: QuoteContactModalProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [flota, setFlota] = useState<number>(vehiclesCount);
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sync initial vehicles count when opened
  useEffect(() => {
    if (open) {
      setFlota(vehiclesCount);
      setIsSubmitted(false);
    }
  }, [open, vehiclesCount]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setIsSubmitted(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      appAlert.error("Por favor ingresa tu nombre y apellido.");
      return;
    }
    if (!email.trim()) {
      appAlert.error("Por favor ingresa un email de contacto.");
      return;
    }
    if (!telefono.trim()) {
      appAlert.error("Por favor ingresa tu teléfono o WhatsApp para contactarte.");
      return;
    }

    setIsSubmitting(true);
    try {
      const summaryDetail = isEnterprise || flota >= maxThreshold
        ? `Solicitud de Propuesta Enterprise (+${maxThreshold} vehículos). Flota estimada informada: ${flota} unidades.`
        : `Cotización solicitada para ${flota} vehículos (Plan ${tierName}). ` +
          `Precio unitario: $${new Intl.NumberFormat("es-AR").format(pricePerVehicle)}/veh. ` +
          (totalPrice
            ? `Total estimado: $${new Intl.NumberFormat("es-AR").format(totalPrice)}/mes (${isAnnual ? "Facturación Anual" : "Facturación Mensual"}).`
            : "");

      const fullMessage = [
        summaryDetail,
        mensaje.trim() ? `Comentario del cliente: ${mensaje.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await createProspecto({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        empresa: empresa.trim() || undefined,
        flotaEstimada: Number(flota) || vehiclesCount,
        mensaje: fullMessage,
        estado: "nuevo",
      });

      if (res.success) {
        setIsSubmitted(true);
        appAlert.success("¡Solicitud recibida! Te contactaremos a la brevedad.", "Cotización TrackOps");
      } else {
        appAlert.error("No se pudo registrar tu solicitud. Por favor intenta nuevamente.");
      }
    } catch (err: any) {
      appAlert.error(err?.message || "Ocurrió un error inesperado al enviar la cotización.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto sm:max-w-lg border-[#EAEAEA] bg-white text-[#1E2227] p-6 sm:p-8 rounded-2xl shadow-2xl">
        {!isSubmitted ? (
          <>
            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#F6F4EE] border border-[#EAEAEA] flex items-center justify-center text-[#1E2227]">
                  <Truck className="h-5 w-5 text-[#1E2227]" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-[#1E2227]">
                    {isEnterprise || flota >= maxThreshold
                      ? "Solicitar Propuesta Enterprise"
                      : "Solicitar Cotización de Flota"}
                  </DialogTitle>
                </div>
              </div>

              <DialogDescription className="text-xs text-[#787774] leading-relaxed">
                Completá tus datos y un asesor comercial se comunicará directamente con vos por WhatsApp o Email para coordinar el alta y las credenciales de tu cuenta.
              </DialogDescription>
            </DialogHeader>

            {/* Resumen de Cotización */}
            <div className="my-2 p-3.5 bg-[#F6F4EE] border border-[#EAEAEA] rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white border border-[#EAEAEA] text-[#1E2227] font-semibold">
                  <span className="text-sm font-mono font-bold text-[#1E2227]">
                    {flota >= maxThreshold ? `+${maxThreshold}` : flota}
                  </span>{" "}
                  <span className="text-[11px] text-[#787774] font-normal">veh.</span>
                </div>
                <div>
                  <p className="font-semibold text-[#1E2227]">{tierName}</p>
                  <p className="text-[11px] text-[#787774]">
                    {isEnterprise || flota >= maxThreshold
                      ? "Flota a medida · Bonificaciones por volumen"
                      : isAnnual
                      ? "Facturación Anual (10% OFF incluido)"
                      : "Facturación Mensual flexible"}
                  </p>
                </div>
              </div>

              {!(isEnterprise || flota >= maxThreshold) && totalPrice !== null && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[#787774] block">Estimado</span>
                  <span className="text-base font-bold font-mono text-[#1E2227]">
                    ${new Intl.NumberFormat("es-AR").format(totalPrice)}
                  </span>
                  <span className="text-[10px] text-[#787774] block">/ mes</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="quote-nombre" className="text-xs font-semibold text-[#1E2227]">
                    Nombre y Apellido *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#787774] pointer-events-none" />
                    <Input
                      id="quote-nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Marcelo Rossi"
                      className="h-9 pl-8 text-xs bg-white border-[#EAEAEA]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quote-empresa" className="text-xs font-semibold text-[#1E2227]">
                    Empresa / Razón Social
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#787774] pointer-events-none" />
                    <Input
                      id="quote-empresa"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      placeholder="Ej: Transporte Sur S.A."
                      className="h-9 pl-8 text-xs bg-white border-[#EAEAEA]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="quote-telefono" className="text-xs font-semibold text-[#1E2227] flex items-center justify-between">
                    <span>Teléfono / WhatsApp *</span>
                    <span className="text-[10px] text-[#075E54] font-medium flex items-center gap-0.5">
                      <MessageSquare className="h-2.5 w-2.5" /> Recomendado
                    </span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#787774] pointer-events-none" />
                    <Input
                      id="quote-telefono"
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej: +54 9 11 4455-6677"
                      className="h-9 pl-8 text-xs bg-white border-[#EAEAEA]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quote-email" className="text-xs font-semibold text-[#1E2227]">
                    Email de Contacto *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#787774] pointer-events-none" />
                    <Input
                      id="quote-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mrossi@empresa.com"
                      className="h-9 pl-8 text-xs bg-white border-[#EAEAEA]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-flota" className="text-xs font-semibold text-[#1E2227]">
                  Cantidad de Vehículos de la Flota
                </Label>
                <Input
                  id="quote-flota"
                  type="number"
                  min={1}
                  value={flota}
                  onChange={(e) => setFlota(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="h-9 text-xs bg-white border-[#EAEAEA] font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-mensaje" className="text-xs font-semibold text-[#1E2227]">
                  Requerimientos o Comentarios Adicionales (opcional)
                </Label>
                <textarea
                  id="quote-mensaje"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-[#EAEAEA] bg-white px-3 py-2 text-xs text-[#1E2227] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#1E2227]"
                  placeholder="Ej: Necesitamos integrar con sensores de combustible o GPS existentes..."
                />
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-[#787774]">
                <ShieldCheck className="h-4 w-4 text-[#346538] shrink-0 mt-0.5" />
                <span>
                  Sin compromiso. En el alta coordinaremos la instalación o integración de tus equipos y las modalidades de pago del servicio.
                </span>
              </div>

              <DialogFooter className="pt-3 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="h-9 px-4 text-xs border-[#EAEAEA] text-[#787774] hover:bg-[#F6F4EE]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="h-9 px-6 text-xs font-bold gap-2 bg-[#F2B705] text-[#1E2227] hover:bg-[#e0aa04] shadow-sm transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Enviando Solicitud...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Enviar Solicitud
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          /* Success Screen */
          <div className="py-8 px-2 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#E7FFDB] text-[#075E54] flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-xl font-bold text-[#1E2227]">
                ¡Solicitud Recibida con Éxito!
              </h3>
              <p className="text-xs text-[#787774] leading-relaxed">
                Muchas gracias, <strong className="text-[#1E2227]">{nombre}</strong>. Registramos tu cotización para una flota de <strong className="text-[#1E2227]">{flota} vehículos</strong>.
              </p>
              <p className="text-xs text-[#787774] leading-relaxed pt-2">
                Un asesor del equipo de TrackOps se contactará en breve al teléfono <strong className="text-[#1E2227]">{telefono}</strong> o al correo <strong className="text-[#1E2227]">{email}</strong> para coordinar el alta y resolver cualquier consulta.
              </p>
            </div>

            <div className="pt-4 w-full">
              <Button
                type="button"
                onClick={handleClose}
                className="w-full bg-[#1E2227] text-white hover:bg-[#111] text-xs font-semibold h-10 rounded-xl"
              >
                Entendido / Volver al Sitio
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default QuoteContactModal;
