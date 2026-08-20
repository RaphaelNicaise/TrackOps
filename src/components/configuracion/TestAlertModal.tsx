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
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react";
import { sendTestAlertAction, type ParsedAlertConfig } from "@/lib/alert-config-actions";
import type { AlertModule, AlertSeverity, DispatchAlertResult } from "@/types/alerts";
import { appAlert } from "@/lib/alerts";

interface TestAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig?: ParsedAlertConfig;
  empresaId?: number;
}

export function TestAlertModal({
  open,
  onOpenChange,
  currentConfig,
  empresaId,
}: TestAlertModalProps) {
  const [modulo, setModulo] = useState<AlertModule>("MANTENIMIENTO");
  const [severidad, setSeveridad] = useState<AlertSeverity>("MEDIA");
  const [testChannel, setTestChannel] = useState<"AMBOS" | "EMAIL" | "WHATSAPP">("AMBOS");
  const [titulo, setTitulo] = useState<string>("Simulación de Alerta de Flota");
  const [mensaje, setMensaje] = useState<string>(
    "Esta es una alerta de prueba enviada desde el panel de configuración de TrackOps."
  );
  const [overrideEmail, setOverrideEmail] = useState<string>("");
  const [overrideWhatsapp, setOverrideWhatsapp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<DispatchAlertResult | null>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLastResult(null);

    try {
      const res = await sendTestAlertAction({
        empresaId: empresaId ?? currentConfig?.empresaId ?? 1,
        modulo,
        severidad,
        tipo: `TEST_${modulo}`,
        titulo: titulo.trim() || "Alerta de Prueba",
        mensaje: mensaje.trim() || "Mensaje de prueba",
        testChannel,
        overrideEmail: overrideEmail.trim() || undefined,
        overrideWhatsapp: overrideWhatsapp.trim() || undefined,
      });

      if (res.success && res.dispatchResult.success) {
        setLastResult(res.dispatchResult);
        appAlert.success(
          `Alerta enviada correctamente por ${res.dispatchResult.dispatchedChannels.join(" & ") || "canales habilitados"}`
        );
      } else {
        const result = res.dispatchResult;
        setLastResult(result);
        appAlert.error(result?.reason || "No se pudo despachar la alerta de prueba");
      }
    } catch (err: any) {
      appAlert.error(err.message || "Error al enviar la alerta de prueba");
    } finally {
      setLoading(false);
    }
  };

  const effectiveEmail = overrideEmail.trim() || currentConfig?.emailDestino || "No configurado";
  const effectivePhone = overrideWhatsapp.trim() || currentConfig?.telefonoWhatsapp || "No configurado";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:max-w-xl border-border bg-card">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Simulador &amp; Prueba de Alerta
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Dispara un evento sintético para validar el envío multicanal inmediato a los destinos configurados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSendTest} className="space-y-4 py-2">
          {/* Current Config Destination Summary */}
          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" /> Destinatarios Activos del Sistema:
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                Empresa #{empresaId ?? currentConfig?.empresaId ?? 1}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="truncate">Email: <strong className="text-foreground">{effectiveEmail}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">WhatsApp: <strong className="text-foreground">{effectivePhone}</strong></span>
              </div>
            </div>
          </div>

          {/* Module Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Módulo Emisor</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: "MANTENIMIENTO", label: "Mantenimiento" },
                  { id: "DOCUMENTACION", label: "Documentos" },
                  { id: "GEOCERCAS", label: "Geocercas" },
                  { id: "HORARIOS", label: "Horarios" },
                ] as const
              ).map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setModulo(mod.id)}
                  className={`px-3 py-2 text-xs rounded-md border text-center transition-colors font-medium ${
                    modulo === mod.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background border-border text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {mod.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Nivel de Severidad</Label>
              <div className="grid grid-cols-4 gap-1">
                {(["BAJA", "MEDIA", "ALTA", "CRITICA"] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeveridad(sev)}
                    className={`px-2 py-1.5 text-[11px] rounded border font-mono transition-colors text-center ${
                      severidad === sev
                        ? sev === "CRITICA"
                          ? "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50 font-bold"
                          : sev === "ALTA"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50 font-bold"
                          : "bg-primary/20 text-primary border-primary/50 font-bold"
                        : "bg-background border-border text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Canal de Envío</Label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: "AMBOS", label: "Ambos" },
                    { id: "EMAIL", label: "Email" },
                    { id: "WHATSAPP", label: "WhatsApp" },
                  ] as const
                ).map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setTestChannel(ch.id)}
                    className={`px-2 py-1.5 text-[11px] rounded border text-center font-medium transition-colors ${
                      testChannel === ch.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background border-border text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title & Message */}
          <div className="space-y-1.5">
            <Label htmlFor="test-title" className="text-xs font-semibold text-foreground">
              Título de la Alerta
            </Label>
            <Input
              id="test-title"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Service de 20.000 Km próximo a vencer"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="test-message" className="text-xs font-semibold text-foreground">
              Mensaje de Notificación
            </Label>
            <textarea
              id="test-message"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              placeholder="Escribe el cuerpo del mensaje..."
              required
            />
          </div>

          {/* Optional Direct Overrides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label htmlFor="override-email" className="text-[11px] text-muted-foreground">
                Email Temporal (Opcional)
              </Label>
              <Input
                id="override-email"
                type="email"
                value={overrideEmail}
                onChange={(e) => setOverrideEmail(e.target.value)}
                placeholder="test@otro-email.com"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="override-phone" className="text-[11px] text-muted-foreground">
                WhatsApp Temporal (Opcional)
              </Label>
              <Input
                id="override-phone"
                value={overrideWhatsapp}
                onChange={(e) => setOverrideWhatsapp(e.target.value)}
                placeholder="+54 9 11 9999-8888"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Dispatch Result Feedback Card */}
          {lastResult && (
            <div
              className={`rounded-lg border p-3 text-xs space-y-1.5 ${
                lastResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                  : "bg-destructive/10 border-destructive/30 text-destructive dark:text-red-300"
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  {lastResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  {lastResult.success ? "Alerta Simulada Despachada" : "Despacho Incompleto o Cancelado"}
                </span>
                {lastResult.logId && (
                  <span className="text-[10px] font-mono opacity-80">
                    Log ID: #{lastResult.logId}
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">
                {lastResult.reason ||
                  (lastResult.success
                    ? `Notificación entregada a través de ${lastResult.dispatchedChannels.join(", ")}.`
                    : "No se emitieron canales de destino.")}
              </p>
              {lastResult.success && (
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                  {lastResult.destinatarioEmail && (
                    <Badge variant="outline" className="bg-background/80 text-foreground border-border">
                      ✉ {lastResult.destinatarioEmail}
                    </Badge>
                  )}
                  {lastResult.destinatarioWhatsapp && (
                    <Badge variant="outline" className="bg-background/80 text-foreground border-border">
                      📱 {lastResult.destinatarioWhatsapp}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs"
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-9 px-5 text-xs font-semibold gap-2 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Enviar Alerta de Prueba
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
