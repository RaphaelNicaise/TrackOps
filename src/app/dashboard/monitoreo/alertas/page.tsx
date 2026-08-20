import React, { Suspense } from "react";
import { auth } from "@/auth";
import { getAlertLogs } from "@/lib/alerts/dispatcher";
import { getAlertConfigAction } from "@/lib/alert-config-actions";
import { AlertsDashboardClient } from "@/components/alertas/AlertsDashboardClient";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Radio, CheckCircle2, ShieldAlert } from "lucide-react";
import type { AlertFilterOptions } from "@/types/alerts";
import type { AlertLog } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Consola de Monitoreo & Historial de Alertas | TrackOps",
  description:
    "Seguimiento centralizado de alertas multicanal emitidas, despachos por WhatsApp y Email, y métricas operativas de la flota.",
};

interface PageProps {
  searchParams?: {
    patente?: string;
    modulo?: string;
    severidad?: string;
    canal?: string;
    search?: string;
  };
}

function AlertsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

export default async function MonitoreoAlertasPage({ searchParams }: PageProps) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Session fallback for build/test
  }

  let empresaId = 1;
  if (session?.user?.empresaId) {
    empresaId = session.user.empresaId;
  }

  const initialPatente = searchParams?.patente || "";
  const initialModulo = searchParams?.modulo || "";
  const initialSeveridad = searchParams?.severidad || "";
  const initialCanal = searchParams?.canal || "";
  const initialSearch = searchParams?.search || "";

  const filters: AlertFilterOptions = {
    empresaId,
    ...(initialPatente ? { patente: initialPatente } : {}),
    ...(initialModulo && initialModulo !== "TODOS" ? { modulo: initialModulo } : {}),
    ...(initialSeveridad && initialSeveridad !== "TODAS" ? { severidad: initialSeveridad } : {}),
    ...(initialCanal && initialCanal !== "TODOS" ? { canal: initialCanal } : {}),
    ...(initialSearch ? { search: initialSearch } : {}),
  };

  let initialAlerts: AlertLog[] = [];
  try {
    initialAlerts = await getAlertLogs(filters);
  } catch (err) {
    console.error("Error loading initial alert logs:", err);
  }

  let initialConfig = undefined;
  try {
    initialConfig = await getAlertConfigAction(empresaId);
  } catch {
    // Fallback
  }

  const stats = {
    total: initialAlerts.length,
    whatsapp: initialAlerts.filter(
      (a) => a.canal === "WHATSAPP" || a.canal === "AMBOS" || !!a.destinatarioWhatsapp
    ).length,
    email: initialAlerts.filter(
      (a) => a.canal === "EMAIL" || a.canal === "AMBOS" || !!a.destinatarioEmail
    ).length,
    critical: initialAlerts.filter(
      (a) => a.severidad === "CRITICA" || a.severidad === "ALTA"
    ).length,
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono bg-muted/60">
              MONITOREO · HISTORIAL DE ALERTAS
            </Badge>
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Auditoría en Tiempo Real
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Consola de Monitoreo &amp; Historial de Alertas
          </h1>
          <p className="text-sm text-muted-foreground">
            Registro cronológico y métricas de notificaciones multicanal (Email y WhatsApp) emitidas a la flota.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 animate-pulse text-primary" />
            <span>Consola Activa</span>
          </div>
        </div>
      </div>

      {/* Main Monitoring Client with Suspense */}
      <Suspense fallback={<AlertsDashboardSkeleton />}>
        <AlertsDashboardClient
          initialAlerts={initialAlerts}
          initialConfig={initialConfig}
          initialStats={stats}
          initialPatente={initialPatente}
          empresaId={empresaId}
        />
      </Suspense>
    </div>
  );
}
