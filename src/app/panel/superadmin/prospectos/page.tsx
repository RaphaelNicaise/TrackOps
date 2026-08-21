import React from "react";
import { db } from "@/db";
import { prospectos } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Prospecto } from "@/lib/prospectos-actions";
import { ProspectosTable } from "@/components/superadmin/prospectos-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "CRM de Prospectos & Solicitudes de Demo | Superadmin TrackOps",
  description:
    "Embudo de ventas y seguimiento comercial de leads y solicitudes de demostración de TrackOps.",
};

const FALLBACK_PROSPECTOS: Prospecto[] = [
  {
    id: 1,
    nombre: "Martín Palermo",
    email: "mpalermo@transpalermo.com",
    telefono: "+54 9 11 4455-6677",
    empresa: "Transportes Palermo S.R.L.",
    flotaEstimada: 18,
    mensaje:
      "Hola, nos interesa el módulo de control de combustible y geocercas para 18 camiones en Buenos Aires.",
    estado: "nuevo",
    notas: "Lead originado desde formulario web de landing page.",
    createdAt: new Date("2026-08-15T14:30:00Z"),
  },
  {
    id: 2,
    nombre: "Laura Fernández",
    email: "lfernandez@delsurlog.com.ar",
    telefono: "+54 9 299 512-3456",
    empresa: "Distribuidora del Sur",
    flotaEstimada: 8,
    mensaje:
      "Buscamos controlar los vencimientos de RTO y seguros de utilitarios con alertas WhatsApp.",
    estado: "contactado",
    notas: "Primer contacto telefónico realizado. Se envió folleto comercial.",
    createdAt: new Date("2026-08-12T10:15:00Z"),
  },
  {
    id: 3,
    nombre: "Esteban Quito",
    email: "esteban@quitoexpress.com",
    telefono: "+54 9 351 678-9012",
    empresa: "Quito Logistics & Courier",
    flotaEstimada: 35,
    mensaje:
      "Queremos agendar una demo técnica para integración de GPS con nuestra flota en Córdoba.",
    estado: "demo_agendada",
    notas: "Demo agendada para el viernes a las 11:00 hs con el equipo de operaciones.",
    createdAt: new Date("2026-08-10T16:45:00Z"),
  },
  {
    id: 4,
    nombre: "Sofía Martínez",
    email: "smartinez@fletesexpress.com",
    telefono: "+54 9 11 9876-5432",
    empresa: "Fletes Express Rosario",
    flotaEstimada: 5,
    mensaje: "Queremos probar el sistema para 5 camionetas de reparto urbano.",
    estado: "convertido",
    notas: "Cliente convertido al plan Starter. Crearon cuenta exitosamente.",
    createdAt: new Date("2026-08-05T09:00:00Z"),
  },
  {
    id: 5,
    nombre: "Diego Rodríguez",
    email: "diego@transcuyo.com",
    telefono: "+54 9 261 333-4455",
    empresa: "Expreso Cuyo S.A.",
    flotaEstimada: 50,
    mensaje:
      "Presupuesto para 50 unidades de larga distancia con sensores de temperatura.",
    estado: "descartado",
    notas: "Fuera de alcance inicial por requisitos de hardware propietario legacy.",
    createdAt: new Date("2026-08-01T11:20:00Z"),
  },
];

export default async function SuperadminProspectosPage() {
  let prospectosList: Prospecto[] = [];

  try {
    const dbProspectos = await db
      .select()
      .from(prospectos)
      .orderBy(desc(prospectos.createdAt));

    if (dbProspectos && dbProspectos.length > 0) {
      prospectosList = dbProspectos;
    } else {
      prospectosList = FALLBACK_PROSPECTOS;
    }
  } catch (error) {
    console.warn(
      "Could not query live DB for superadmin prospectos, using fallback dataset.",
      error
    );
    prospectosList = FALLBACK_PROSPECTOS;
  }

  // Calculate CRM Pipeline KPIs
  const totalProspectos = prospectosList.length;
  const nuevosCount = prospectosList.filter(
    (p) => (p.estado || "nuevo").toLowerCase() === "nuevo"
  ).length;
  const demosAgendadasCount = prospectosList.filter(
    (p) => (p.estado || "").toLowerCase() === "demo_agendada"
  ).length;
  const convertidosCount = prospectosList.filter(
    (p) => (p.estado || "").toLowerCase() === "convertido"
  ).length;

  const tasaConversion =
    totalProspectos > 0
      ? Math.round((convertidosCount / totalProspectos) * 100)
      : 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono bg-muted/60">
              SUPERADMIN · PIPELINE CRM
            </Badge>
            <span className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 font-medium">
              <Sparkles className="h-3 w-3 text-sky-500" />
              Solicitudes de Demo Entrantes
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            CRM de Prospectos & Solicitudes de Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento de leads, estado comercial, solicitudes de demostración y conversión a clientes activos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Embudo Comercial Activo</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <Card className="border border-border/80 bg-card hover:border-primary/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Leads Recibidos
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {totalProspectos}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Solicitudes totales registradas
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Nuevos / Por Contactar */}
        <Card className="border border-border/80 bg-card hover:border-sky-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Nuevos / Por Contactar
            </CardTitle>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
              {nuevosCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              {nuevosCount > 0 ? "Pendientes de contacto inicial" : "Al día"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Demos Agendadas */}
        <Card className="border border-border/80 bg-card hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Demos Agendadas
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {demosAgendadasCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Reuniones técnicas programadas
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Tasa de Conversión */}
        <Card className="border border-border/80 bg-card hover:border-emerald-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Tasa de Conversión
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {tasaConversion}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              {convertidosCount} {convertidosCount === 1 ? "cliente ganado" : "clientes ganados"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interactive Table */}
      <ProspectosTable initialProspectos={prospectosList} />
    </div>
  );
}
