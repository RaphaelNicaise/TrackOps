import React from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  subscriptionPlans,
  empresaSubscriptions,
} from "@/db/schema";
import { count } from "drizzle-orm";
import { isDemoUser } from "@/lib/demo-mode";
import { Badge } from "@/components/ui/badge";
import { PlanesView, SubscriptionPlanData } from "@/components/superadmin/planes/planes-view";
import { Layers, ShieldCheck, Zap } from "lucide-react";

export const metadata = {
  title: "Catálogo de Planes SaaS | Superadmin TrackOps",
  description:
    "Administración del catálogo de planes de suscripción, rangos de flota y precios mensuales/anuales.",
};

const FALLBACK_PLANS: SubscriptionPlanData[] = [
  { id: 1, nombre: "Inicial", minVehiculos: 1, maxVehiculos: 5, precioMensual: 39990, precioAnual: 399900, activo: 1, tenantsCount: 2 },
  { id: 2, nombre: "Crecimiento", minVehiculos: 6, maxVehiculos: 15, precioMensual: 64900, precioAnual: 649000, activo: 1, tenantsCount: 4 },
  { id: 3, nombre: "Consolidada", minVehiculos: 16, maxVehiculos: 30, precioMensual: 99900, precioAnual: 999000, activo: 1, tenantsCount: 1 },
  { id: 4, nombre: "Masiva", minVehiculos: 31, maxVehiculos: 49, precioMensual: 149900, precioAnual: 1499000, activo: 1, tenantsCount: 1 },
  { id: 5, nombre: "Enterprise", minVehiculos: 50, maxVehiculos: null, precioMensual: 199900, precioAnual: 1999000, activo: 1, tenantsCount: 2 },
];

export default async function SuperadminPlanesPage() {
  const session = await auth().catch(() => null);
  const demo = isDemoUser(session?.user);
  let plansList: SubscriptionPlanData[] = demo ? FALLBACK_PLANS : [];

  try {
    // 1. Fetch live subscription plans
    const dbPlans = await db.select().from(subscriptionPlans);
    
    // 2. Fetch tenant counts per plan
    let tenantCountsMap: Record<number, number> = {};
    try {
      const subsCount = await db
        .select({
          planId: empresaSubscriptions.planId,
          count: count(empresaSubscriptions.id),
        })
        .from(empresaSubscriptions)
        .groupBy(empresaSubscriptions.planId);

      for (const s of subsCount) {
        if (s.planId) {
          tenantCountsMap[s.planId] = Number(s.count);
        }
      }
    } catch {
      // ignore
    }

    if (dbPlans && dbPlans.length > 0) {
      plansList = dbPlans.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        minVehiculos: (p as unknown as { minVehiculos: number }).minVehiculos ?? 1,
        maxVehiculos: p.maxVehiculos,
        precioMensual: p.precioMensual,
        precioAnual: p.precioAnual,
        activo: p.activo,
        tenantsCount: tenantCountsMap[p.id] || 0,
      }));
    }
  } catch (error) {
    console.warn("Could not query subscription plans, using fallback dataset.", error);
    if (demo) {
      plansList = FALLBACK_PLANS;
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono bg-muted/60">
              SUPERADMIN · GESTIÓN DE PLANES
            </Badge>
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" />
              Catálogo de Precios Activo
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Catálogo de Planes SaaS
          </h1>
          <p className="text-sm text-muted-foreground">
            Administración de niveles de suscripción, rangos de cobertura por unidades de flota y estructuras arancelarias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Escalado Automático de Flota</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Planes View (Sin KPIs) */}
      <PlanesView plans={plansList} />
    </div>
  );
}
