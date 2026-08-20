import React from "react";
import { auth } from "@/auth";
import { getAlertConfigAction } from "@/lib/alert-config-actions";
import { AlertsConfigForm } from "@/components/configuracion/AlertsConfigForm";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Bell,
  Shield,
  Radio,
  CheckCircle2,
  Mail,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Configuración General & Alertas | TrackOps",
  description:
    "Gestión centralizada de alertas multicanal, canales de mensajería directa (Email & WhatsApp) y tolerancias de anticipación operativa.",
};

export default async function ConfiguracionPage() {
  const session = await auth();
  const config = await getAlertConfigAction();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono bg-muted/60">
              ADMINISTRACIÓN · CONFIGURACIÓN
            </Badge>
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Motor de Notificaciones Operativo
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Configuración General
          </h1>
          <p className="text-sm text-muted-foreground">
            Alertas Multicanal y Parámetros Globales de Operación de Flota.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 animate-pulse text-primary" />
            <span>Despacho Inmediato Activo</span>
          </div>
        </div>
      </div>

      {/* Main Alerts Configuration Form */}
      <AlertsConfigForm initialConfig={config} />
    </div>
  );
}
