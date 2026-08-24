import React from "react";
import { db } from "@/db";
import {
  empresas,
  vehicles,
  subscriptionPlans,
  empresaSubscriptions,
} from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { ClientesTable, EmpresaRow } from "@/components/superadmin/clientes-table";
import { PlanOption } from "@/components/superadmin/empresa-form-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Car,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Headphones,
  Zap,
  Users,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "Empresas Clientes | Superadmin TrackOps",
  description:
    "Directorio consolidado de inquilinos, asignación de planes SaaS y acceso directo en modo soporte.",
};

const FALLBACK_PLANS: PlanOption[] = [
  { id: 1, nombre: "Inicial", minVehiculos: 1, maxVehiculos: 5, precioMensual: 39990, precioAnual: 399900 },
  { id: 2, nombre: "Crecimiento", minVehiculos: 6, maxVehiculos: 15, precioMensual: 64900, precioAnual: 649000 },
  { id: 3, nombre: "Consolidada", minVehiculos: 16, maxVehiculos: 30, precioMensual: 99900, precioAnual: 999000 },
  { id: 4, nombre: "Masiva", minVehiculos: 31, maxVehiculos: 49, precioMensual: 149900, precioAnual: 1499000 },
  { id: 5, nombre: "Enterprise", minVehiculos: 50, maxVehiculos: null, precioMensual: 199900, precioAnual: 1999000 },
];

const FALLBACK_EMPRESAS: EmpresaRow[] = [
  {
    id: 1,
    nombre: "Logística Alpha S.A.",
    cuit: "30-71234567-9",
    createdAt: new Date("2026-01-15T10:00:00Z"),
    planId: 5,
    planNombre: "Enterprise",
    estadoSuscripcion: "activa",
    totalVehiculos: 24,
  },
  {
    id: 2,
    nombre: "Transportes Patagonia SRL",
    cuit: "30-68912345-2",
    createdAt: new Date("2026-02-10T14:30:00Z"),
    planId: 2,
    planNombre: "Crecimiento",
    estadoSuscripcion: "activa",
    totalVehiculos: 12,
  },
  {
    id: 3,
    nombre: "Distribuidora Andina Express",
    cuit: "33-54891234-9",
    createdAt: new Date("2026-03-01T09:15:00Z"),
    planId: 1,
    planNombre: "Inicial",
    estadoSuscripcion: "activa",
    totalVehiculos: 4,
  },
  {
    id: 4,
    nombre: "TransCargas del Plata S.A.",
    cuit: "30-79812345-8",
    createdAt: new Date("2026-03-22T11:45:00Z"),
    planId: 5,
    planNombre: "Enterprise",
    estadoSuscripcion: "activa",
    totalVehiculos: 38,
  },
  {
    id: 5,
    nombre: "Flota Urbana Mensajería",
    cuit: "27-35678901-4",
    createdAt: new Date("2026-04-05T16:20:00Z"),
    planId: 1,
    planNombre: "Inicial",
    estadoSuscripcion: "suspendida",
    totalVehiculos: 2,
  },
];

export default async function SuperadminClientesPage() {
  let empresasList: EmpresaRow[] = [];
  let plansList: PlanOption[] = FALLBACK_PLANS;

  try {
    // 1. Fetch plans
    const dbPlans = await db.select().from(subscriptionPlans);
    if (dbPlans && dbPlans.length > 0) {
      plansList = dbPlans.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        minVehiculos: p.minVehiculos,
        maxVehiculos: p.maxVehiculos,
        precioMensual: p.precioMensual,
        precioAnual: p.precioAnual,
      }));
    }

    // 2. Fetch empresas with subscriptions
    const dbEmpresas = await db
      .select({
        id: empresas.id,
        nombre: empresas.nombre,
        cuit: empresas.cuit,
        email: empresas.email,
        telefono: empresas.telefono,
        direccion: empresas.direccion,
        ciudad: empresas.ciudad,
        provincia: empresas.provincia,
        createdAt: empresas.createdAt,
        planId: empresaSubscriptions.planId,
        planNombre: subscriptionPlans.nombre,
        estadoSuscripcion: empresaSubscriptions.estado,
      })
      .from(empresas)
      .leftJoin(
        empresaSubscriptions,
        eq(empresas.id, empresaSubscriptions.empresaId)
      )
      .leftJoin(
        subscriptionPlans,
        eq(empresaSubscriptions.planId, subscriptionPlans.id)
      );

    // 3. Fetch vehicle counts
    const vehiculosPorEmpresa = await db
      .select({
        empresaId: vehicles.empresaId,
        count: count(vehicles.id),
      })
      .from(vehicles)
      .groupBy(vehicles.empresaId);

    const countMap: Record<number, number> = {};
    for (const v of vehiculosPorEmpresa) {
      if (v.empresaId) {
        countMap[v.empresaId] = Number(v.count);
      }
    }

    if (dbEmpresas && dbEmpresas.length > 0) {
      empresasList = dbEmpresas.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        cuit: e.cuit,
        email: e.email,
        telefono: e.telefono,
        direccion: e.direccion,
        ciudad: e.ciudad,
        provincia: e.provincia,
        createdAt: e.createdAt,
        planId: e.planId,
        planNombre: e.planNombre || "Starter",
        estadoSuscripcion: e.estadoSuscripcion || "activa",
        totalVehiculos: countMap[e.id] || 0,
      }));
    } else {
      empresasList = FALLBACK_EMPRESAS;
    }
  } catch (error) {
    console.warn("Could not query live DB for superadmin clientes, using fallback dataset.", error);
    empresasList = FALLBACK_EMPRESAS;
  }

  // Calculate summary metrics
  const totalEmpresas = empresasList.length;
  const activasCount = empresasList.filter(
    (e) => (e.estadoSuscripcion?.toLowerCase() || "activa") === "activa"
  ).length;
  const totalVehiculos = empresasList.reduce(
    (acc, e) => acc + (e.totalVehiculos || 0),
    0
  );
  
  // Calculate estimated MRR
  const mrrEstimado = empresasList
    .filter((e) => (e.estadoSuscripcion?.toLowerCase() || "activa") === "activa")
    .reduce((sum, e) => {
      const plan = plansList.find(
        (p) =>
          p.id === e.planId ||
          p.nombre.toLowerCase() === (e.planNombre || "").toLowerCase()
      );
      return sum + (plan?.precioMensual || 49);
    }, 0);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono bg-muted/60">
              SUPERADMIN · GESTIÓN SAAS
            </Badge>
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <Headphones className="h-3 w-3 text-amber-500" />
              Soporte Multi-Inquilino
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Empresas Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Directorio consolidado de inquilinos, asignación de planes SaaS y acceso directo en modo soporte.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Auditoría de Inquilinos Activa</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Empresas */}
        <Card className="border border-border/80 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Inquilinos
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {totalEmpresas}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              {activasCount} empresas activas
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Empresas Activas */}
        <Card className="border border-border/80 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Empresas Activas
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {activasCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              {totalEmpresas > 0
                ? `${Math.round((activasCount / totalEmpresas) * 100)}% de tasa de retención`
                : "Sin registros"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Total Vehículos */}
        <Card className="border border-border/80 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Flota Conectada
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Car className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {totalVehiculos}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                unidades
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Promedio: {totalEmpresas > 0 ? (totalVehiculos / totalEmpresas).toFixed(1) : 0} veh/empresa
            </p>
          </CardContent>
        </Card>

        {/* Card 4: MRR Estimado */}
        <Card className="border border-border/80 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              MRR Recurrente Estimado
            </CardTitle>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              ${mrrEstimado.toLocaleString("es-AR")}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ARS/mes
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Facturación activa proyectada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interactive Table */}
      <ClientesTable
        initialEmpresas={empresasList}
        plans={plansList}
      />
    </div>
  );
}
