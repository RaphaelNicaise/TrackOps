import React from "react";
import { auth } from "@/auth";
import { getAlertConfigAction } from "@/lib/alert-config-actions";
import { AlertsConfigForm } from "@/components/configuracion/AlertsConfigForm";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

export const metadata = {
  title: "Configuración General & Alertas | TrackOps",
  description:
    "Gestión centralizada de alertas multicanal, canales de mensajería directa (Email & WhatsApp) y tolerancias de anticipación operativa.",
};

export default async function ConfiguracionPage() {
  const session = await auth();
  const config = await getAlertConfigAction();

  return (
    <div className="space-y-6 p-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Configuración General
              </h1>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-semibold uppercase">
                Administración
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Configuración de Alertas Multicanal (WhatsApp &amp; Email), módulos autorizados y parámetros operativos de flota.
            </p>
          </div>
        </div>
      </div>

      {/* Main Alerts Configuration Form */}
      <AlertsConfigForm initialConfig={config} />
    </div>
  );
}
