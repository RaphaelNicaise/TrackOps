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
    <div className="space-y-6 p-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Historial de Alertas
              </h1>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-semibold uppercase">
                Monitoreo
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Registro centralizado de eventos, despachos a WhatsApp y Email, y estado de alertas de la flota.
            </p>
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
