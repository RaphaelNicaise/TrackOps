"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  MessageSquare,
  Wrench,
  FileText,
  MapPin,
  Clock,
  Gauge,
  Calendar,
  Save,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  saveAlertConfigAction,
  type ParsedAlertConfig,
  type AlertConfigFormValues,
} from "@/lib/alert-config-actions";
import { appAlert } from "@/lib/alerts";
import { TestAlertModal } from "./TestAlertModal";

interface AlertsConfigFormProps {
  initialConfig: ParsedAlertConfig;
  empresaId?: number;
  onSaved?: (newConfig: ParsedAlertConfig) => void;
}

export function AlertsConfigForm({
  initialConfig,
  empresaId,
  onSaved,
}: AlertsConfigFormProps) {
  const [activo, setActivo] = useState<boolean>(Boolean(initialConfig.activo));
  const [canalEmail, setCanalEmail] = useState<boolean>(Boolean(initialConfig.canalEmail));
  const [emailDestino, setEmailDestino] = useState<string>(initialConfig.emailDestino || "");
  const [canalWhatsapp, setCanalWhatsapp] = useState<boolean>(Boolean(initialConfig.canalWhatsapp));
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState<string>(
    initialConfig.telefonoWhatsapp || ""
  );

  const initialModules = Array.isArray(initialConfig.modulosHabilitados)
    ? initialConfig.modulosHabilitados
    : ["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS", "HORARIOS"];

  const [modulosHabilitados, setModulosHabilitados] = useState<string[]>(initialModules);
  const [toleranciaKm, setToleranciaKm] = useState<number>(initialConfig.toleranciaKm ?? 500);
  const [toleranciaDias, setToleranciaDias] = useState<number>(initialConfig.toleranciaDias ?? 15);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [testModalOpen, setTestModalOpen] = useState<boolean>(false);

  const toggleModule = (moduleKey: string) => {
    setModulosHabilitados((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((m) => m !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const payload: AlertConfigFormValues = {
      empresaId: empresaId ?? initialConfig.empresaId,
      activo: activo ? 1 : 0,
      canalEmail: canalEmail ? 1 : 0,
      emailDestino: emailDestino.trim() || null,
      canalWhatsapp: canalWhatsapp ? 1 : 0,
      telefonoWhatsapp: telefonoWhatsapp.trim() || null,
      toleranciaKm: Number(toleranciaKm) || 500,
      toleranciaDias: Number(toleranciaDias) || 15,
      modulosHabilitados,
    };

    try {
      const res = await saveAlertConfigAction(payload);
      if (res.success) {
        appAlert.success("Configuración de alertas guardada exitosamente");
        if (onSaved) {
          onSaved(res.config);
        }
      } else {
        appAlert.error("No se pudo guardar la configuración de alertas");
      }
    } catch (err: any) {
      appAlert.error(err.message || "Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const currentConfigSnapshot: ParsedAlertConfig = {
    ...initialConfig,
    activo: activo ? 1 : 0,
    canalEmail: canalEmail ? 1 : 0,
    emailDestino: emailDestino.trim() || null,
    canalWhatsapp: canalWhatsapp ? 1 : 0,
    telefonoWhatsapp: telefonoWhatsapp.trim() || null,
    toleranciaKm: Number(toleranciaKm) || 500,
    toleranciaDias: Number(toleranciaDias) || 15,
    modulosHabilitados,
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Master Switch Card */}
        <Card className="border-border/80 bg-card overflow-hidden shadow-xs">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`p-3 rounded-xl border transition-colors ${
                    activo
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted/60 border-border text-muted-foreground"
                  }`}
                >
                  <Bell className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground">
                      Sistema de Alertas Habilitado
                    </h2>
                    <Badge
                      variant={activo ? "default" : "secondary"}
                      className={`text-xs font-semibold ${
                        activo
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {activo ? "Activo" : "Pausado"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Control maestro global de notificaciones. Si se pausa, no se enviarán avisos automáticos por ningún canal ni módulo.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <Switch
                  id="master-switch"
                  checked={activo}
                  onCheckedChange={setActivo}
                  aria-label="Sistema de Alertas Habilitado"
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Notification Channels (Email & WhatsApp) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground font-mono flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Canales de Notificación
              </h3>
              <p className="text-xs text-muted-foreground">
                Configura los destinos únicos de despacho para tu empresa (1 Email &amp; 1 WhatsApp).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Channel Card */}
            <Card className="border border-border/80 bg-card hover:border-border transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Notificaciones por Email
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Alertas operativas, reportes de vencimiento y sumarios diarios.
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    id="switch-email"
                    checked={canalEmail}
                    onCheckedChange={setCanalEmail}
                    disabled={!activo}
                    aria-label="Habilitar canal email"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="email-destino" className="text-xs font-medium text-foreground">
                    Email Destinatario
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-destino"
                      type="email"
                      placeholder="alertas@empresa.com"
                      value={emailDestino}
                      onChange={(e) => setEmailDestino(e.target.value)}
                      disabled={!activo || !canalEmail}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Recepción de advertencias preventivas y eventos críticos por correo.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Channel Card */}
            <Card className="border border-border/80 bg-card hover:border-border transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Notificaciones por WhatsApp
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Despacho inmediato para alertas críticas y de seguridad.
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    id="switch-whatsapp"
                    checked={canalWhatsapp}
                    onCheckedChange={setCanalWhatsapp}
                    disabled={!activo}
                    aria-label="Habilitar canal whatsapp"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="phone-destino" className="text-xs font-medium text-foreground">
                    Teléfono WhatsApp Destinatario
                  </Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone-destino"
                      type="tel"
                      placeholder="+54 9 11 1234-5678"
                      value={telefonoWhatsapp}
                      onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                      disabled={!activo || !canalWhatsapp}
                      className="pl-9 h-9 text-xs font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Formato internacional con código de país (ej. +54 9 11...).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3. Enabled Modules */}
        <div className="space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground font-mono flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" /> Módulos Habilitados
            </h3>
            <p className="text-xs text-muted-foreground">
              Selecciona qué subsistemas de la plataforma están autorizados a emitir alertas automáticas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Mantenimiento */}
            <Card
              className={`border transition-all ${
                modulosHabilitados.includes("MANTENIMIENTO") && activo
                  ? "border-primary/40 bg-card shadow-xs"
                  : "border-border/60 bg-muted/20 opacity-75"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <Switch
                    id="mod-mantenimiento"
                    checked={modulosHabilitados.includes("MANTENIMIENTO")}
                    onCheckedChange={() => toggleModule("MANTENIMIENTO")}
                    disabled={!activo}
                    aria-label="Mantenimiento Preventivo"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">
                    Mantenimiento Preventivo
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Avisos por Kms de service, cambio de aceite, filtros y revisiones mecánicas.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Documentacion */}
            <Card
              className={`border transition-all ${
                modulosHabilitados.includes("DOCUMENTACION") && activo
                  ? "border-primary/40 bg-card shadow-xs"
                  : "border-border/60 bg-muted/20 opacity-75"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <Switch
                    id="mod-documentacion"
                    checked={modulosHabilitados.includes("DOCUMENTACION")}
                    onCheckedChange={() => toggleModule("DOCUMENTACION")}
                    disabled={!activo}
                    aria-label="Vencimiento de Documentación"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">
                    Vencimiento de Documentación
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Vencimientos de VTV, RTO, Seguros, Cédula Verde y habilitaciones de chofer.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Geocercas */}
            <Card
              className={`border transition-all ${
                modulosHabilitados.includes("GEOCERCAS") && activo
                  ? "border-primary/40 bg-card shadow-xs"
                  : "border-border/60 bg-muted/20 opacity-75"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <Switch
                    id="mod-geocercas"
                    checked={modulosHabilitados.includes("GEOCERCAS")}
                    onCheckedChange={() => toggleModule("GEOCERCAS")}
                    disabled={!activo}
                    aria-label="Control de Geocercas"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">
                    Control de Geocercas
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Zonas y perímetros operativos (salidas no autorizadas, ingresos y excesos de velocidad).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Horarios */}
            <Card
              className={`border transition-all ${
                modulosHabilitados.includes("HORARIOS") && activo
                  ? "border-primary/40 bg-card shadow-xs"
                  : "border-border/60 bg-muted/20 opacity-75"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500">
                    <Clock className="h-4 w-4" />
                  </div>
                  <Switch
                    id="mod-horarios"
                    checked={modulosHabilitados.includes("HORARIOS")}
                    onCheckedChange={() => toggleModule("HORARIOS")}
                    disabled={!activo}
                    aria-label="Horarios y Uso No Autorizado"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">
                    Horarios y Uso No Autorizado
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Encendido y desplazamiento fuera de franja horaria laboral o en días inhábiles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 4. Advance Tolerances */}
        <div className="space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground font-mono flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Tolerancias de Anticipación
            </h3>
            <p className="text-xs text-muted-foreground">
              Define los márgenes preventivos para el disparo automático de avisos antes de que ocurra el vencimiento.
            </p>
          </div>

          <Card className="border border-border/80 bg-card">
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tolerancia-km" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Gauge className="h-4 w-4 text-amber-500" />
                    Anticipación de Service (Km)
                  </Label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {toleranciaKm} km
                  </span>
                </div>
                <Input
                  id="tolerancia-km"
                  type="number"
                  min={0}
                  step={50}
                  value={toleranciaKm}
                  onChange={(e) => setToleranciaKm(Number(e.target.value))}
                  disabled={!activo}
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Se emitirá una alerta temprana cuando el odómetro del vehículo esté a esta distancia del próximo service.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tolerancia-dias" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Anticipación de Documentos (Días)
                  </Label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {toleranciaDias} días
                  </span>
                </div>
                <Input
                  id="tolerancia-dias"
                  type="number"
                  min={0}
                  step={1}
                  value={toleranciaDias}
                  onChange={(e) => setToleranciaDias(Number(e.target.value))}
                  disabled={!activo}
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Días previos al vencimiento formal de pólizas de seguro, RTO, VTV o registros para enviar la notificación.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 5. Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/80">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Los cambios tendrán impacto inmediato sobre los motores de telemetría y reglas de despacho.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTestModalOpen(true)}
              className="h-9 px-4 text-xs font-semibold gap-2 w-full sm:w-auto"
            >
              <FlaskConical className="h-4 w-4 text-amber-500" />
              Disparar Alerta de Prueba
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="h-9 px-5 text-xs font-bold gap-2 shadow-sm w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Simulator Modal */}
      <TestAlertModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        currentConfig={currentConfigSnapshot}
        empresaId={empresaId ?? initialConfig.empresaId}
      />
    </div>
  );
}
