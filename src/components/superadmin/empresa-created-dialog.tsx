"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { appAlert } from "@/lib/alerts";
import { enterTenantAsSuperadmin } from "@/lib/admin-actions";
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Headphones,
  KeyRound,
  Loader2,
  Mail,
  MessageCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export interface CreatedEmpresaInfo {
  id: number;
  nombre: string;
  cuit?: string | null;
  email?: string | null;
  telefono?: string | null;
}

export interface CreatedAdminInfo {
  name: string;
  email: string;
}

export interface EmpresaCreatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: CreatedEmpresaInfo | null;
  adminUser: CreatedAdminInfo | null;
  initialPassword?: string | null;
  planNombre?: string | null;
}

export function EmpresaCreatedDialog({
  open,
  onOpenChange,
  empresa,
  adminUser,
  initialPassword = "",
  planNombre = "Starter",
}: EmpresaCreatedDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEnteringSuperadmin, setIsEnteringSuperadmin] = useState(false);

  if (!empresa || !adminUser) return null;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://trackops.app";
  const loginUrl = `${origin}/auth/login`;

  const copyToClipboard = async (text: string, fieldId: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      appAlert.success(`${label} copiado al portapapeles.`, "Copiado");
      setTimeout(() => setCopiedField((cur) => (cur === fieldId ? null : cur)), 2500);
    } catch {
      appAlert.error("No se pudo copiar al portapapeles");
    }
  };

  const getWhatsAppMessage = () => {
    return (
      `🚚 *¡Bienvenido a TrackOps!*\n\n` +
      `Hola *${adminUser.name}*, se ha completado el alta para la empresa *${empresa.nombre}*.\n\n` +
      `🔑 *Tus credenciales de acceso inicial:*\n` +
      `• *Acceso Web:* ${loginUrl}\n` +
      `• *Usuario / Email:* ${adminUser.email}\n` +
      `• *Contraseña provisoria:* ${initialPassword || "(definida manualmente)"}\n` +
      `• *Plan:* ${planNombre || "Starter"}\n\n` +
      `⚠️ *Aviso de seguridad:* Por políticas de seguridad, el sistema te solicitará cambiar tu contraseña en el primer inicio de sesión.`
    );
  };

  const getEmailMessage = () => {
    return (
      `Asunto: Credenciales de acceso a TrackOps - ${empresa.nombre}\n\n` +
      `Hola ${adminUser.name},\n\n` +
      `Te damos la bienvenida a TrackOps Fleet & Logistics Platform. Tu cuenta de administrador para "${empresa.nombre}" ya se encuentra activa.\n\n` +
      `-----------------------------------------\n` +
      `DATOS DE ACCESO:\n` +
      `- Plataforma: ${loginUrl}\n` +
      `- Usuario: ${adminUser.email}\n` +
      `- Contraseña temporal: ${initialPassword || "(definida manualmente)"}\n` +
      `- Plan asignado: ${planNombre || "Starter"}\n` +
      (empresa.cuit ? `- CUIT: ${empresa.cuit}\n` : "") +
      `-----------------------------------------\n\n` +
      `IMPORTANTE: En tu primer inicio de sesión se te solicitará ingresar una nueva contraseña definitiva.\n\n` +
      `Saludos cordiales,\n` +
      `Equipo de Operaciones de TrackOps`
    );
  };

  const handleEnterSuperadmin = async () => {
    if (!empresa?.id) return;
    setIsEnteringSuperadmin(true);
    try {
      await enterTenantAsSuperadmin(empresa.id);
      appAlert.success(
        `Ingresando a "${empresa.nombre}" en Modo Soporte...`,
        "Modo Soporte Activado"
      );
      // Immediate redirection to panel
      window.location.href = "/panel/monitoreo/dashboard";
    } catch (err: any) {
      appAlert.error(err?.message || "Error al ingresar en modo soporte.");
      setIsEnteringSuperadmin(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] p-0 overflow-hidden border-border bg-card">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent p-6 border-b border-border">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 font-mono text-[11px] gap-1 shadow-2xs">
                <CheckCircle2 className="h-3 w-3" />
                ALTA EXITOSA
              </Badge>
              <Badge variant="outline" className="font-mono text-xs bg-background/80">
                ID #{empresa.id}
              </Badge>
            </div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-emerald-500" />
              Empresa y Administrador Creados
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              El espacio de trabajo multi-tenant ha sido aprovisionado. Copia y envía las credenciales de acceso inicial al administrador.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Company & Plan Summary Card */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium">
                Razón Social
              </span>
              <span className="font-bold text-foreground truncate block mt-0.5">
                {empresa.nombre}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium">
                Identificación CUIT
              </span>
              <span className="font-mono font-semibold text-foreground block mt-0.5">
                {empresa.cuit || "Sin CUIT"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] font-medium">
                Plan Asignado
              </span>
              <Badge
                variant="secondary"
                className="mt-0.5 font-semibold text-[11px] bg-primary/10 text-primary border-primary/20"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {planNombre || "Starter"}
              </Badge>
            </div>
          </div>

          {/* Credentials Box */}
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                  Credenciales de Acceso Administrador
                </h4>
              </div>
              <Badge variant="outline" className="text-[10px] bg-background/80 font-mono">
                Rol: ADMIN_EMPRESA
              </Badge>
            </div>

            {/* URL field */}
            <div className="flex items-center justify-between bg-background p-2.5 rounded-lg border border-border text-xs">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  URL de Acceso
                </span>
                <span className="font-mono text-foreground truncate block font-medium">
                  {loginUrl}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs shrink-0"
                onClick={() => copyToClipboard(loginUrl, "url", "URL de acceso")}
              >
                {copiedField === "url" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Admin Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between bg-background p-2.5 rounded-lg border border-border text-xs">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-muted-foreground block font-medium">
                    Nombre del Admin
                  </span>
                  <span className="font-semibold text-foreground truncate block">
                    {adminUser.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-background p-2.5 rounded-lg border border-border text-xs">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-muted-foreground block font-medium">
                    Email de Ingreso
                  </span>
                  <span className="font-mono font-medium text-foreground truncate block">
                    {adminUser.email}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs shrink-0"
                  onClick={() => copyToClipboard(adminUser.email, "email", "Email de acceso")}
                >
                  {copiedField === "email" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="flex items-center justify-between bg-background p-2.5 rounded-lg border border-border text-xs">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Contraseña Temporal
                </span>
                <span className="font-mono font-bold tracking-wide text-foreground block">
                  {showPassword
                    ? initialPassword || "(Definida manualmente)"
                    : "••••••••••••"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                {initialPassword && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      copyToClipboard(initialPassword, "pass", "Contraseña temporal")
                    }
                  >
                    {copiedField === "pass" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px]">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="leading-snug">
                <strong>Primer inicio obligatorio:</strong> El administrador deberá cambiar esta contraseña en su primer inicio de sesión.
              </p>
            </div>
          </div>

          {/* Action Template Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Envío Rápido de Bienvenida
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                className="justify-start gap-2 h-10 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs"
                onClick={() =>
                  copyToClipboard(getWhatsAppMessage(), "whatsapp", "Plantilla para WhatsApp")
                }
              >
                {copiedField === "whatsapp" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                )}
                <span>Copiar para WhatsApp</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="justify-start gap-2 h-10 border-sky-500/30 hover:bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold text-xs"
                onClick={() =>
                  copyToClipboard(getEmailMessage(), "emailMsg", "Plantilla para Email")
                }
              >
                {copiedField === "emailMsg" ? (
                  <Check className="h-4 w-4 text-sky-500" />
                ) : (
                  <Mail className="h-4 w-4 text-sky-600" />
                )}
                <span>Copiar para Email</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <DialogFooter className="bg-muted/30 px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs"
          >
            Cerrar
          </Button>

          <Button
            type="button"
            onClick={handleEnterSuperadmin}
            disabled={isEnteringSuperadmin}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold gap-2 text-xs shadow-xs"
          >
            {isEnteringSuperadmin ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Iniciando Soporte...
              </>
            ) : (
              <>
                <Headphones className="h-3.5 w-3.5 text-amber-950" />
                Entrar en Modo Soporte
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
