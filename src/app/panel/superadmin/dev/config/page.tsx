import React from "react";
import { Badge } from "@/components/ui/badge";
import { DevConfigView } from "@/components/superadmin/dev-config-view";
import { Settings, ShieldCheck, Cpu, Terminal, Layers } from "lucide-react";

export const metadata = {
  title: "Configuración DevOps & Sistema | Superadmin TrackOps",
  description:
    "Mapeo de puertos de infraestructura, control de pools de base de datos, umbrales de ingestión GPS y feature flags globales.",
};

export default function SuperadminDevConfigPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono bg-muted/60">
              SUPERADMIN · DEV & OPS
            </Badge>
            <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <Terminal className="h-3.5 w-3.5" />
              Infraestructura & Parámetros Core
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Configuración del Sistema & DevOps
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo de puertos y servicios externos, control de pools de base de datos, umbrales de ingestión GPS y feature flags globales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Next.js 15 App Router</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Cluster Local Activo</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Dev Config Hub */}
      <DevConfigView />
    </div>
  );
}
