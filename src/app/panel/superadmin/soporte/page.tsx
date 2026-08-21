import React from "react";
import { Badge } from "@/components/ui/badge";
import { Headphones } from "lucide-react";
import { getSupportTickets, getSupportTicketStats } from "@/lib/soporte-actions";
import { SoporteTable } from "@/components/superadmin/soporte/soporte-table";
import { TicketSoporteRow } from "@/types/soporte";

export const metadata = {
  title: "Centro de Soporte | Superadmin TrackOps",
  description:
    "Mesa de ayuda e incidencias técnicas, quejas y consultas multicanal de clientes y visitantes.",
};

const FALLBACK_STATS = {
  total: 0,
  pendientes: 0,
  enRevision: 0,
  resueltos: 0,
  urgentes: 0,
};

export default async function SuperadminSoportePage() {
  let tickets: TicketSoporteRow[] = [];
  let stats = FALLBACK_STATS;

  try {
    const ticketsRes = await getSupportTickets();
    if (ticketsRes?.success && Array.isArray(ticketsRes.data)) {
      tickets = ticketsRes.data;
    }
    const fetchedStats = await getSupportTicketStats();
    if (fetchedStats) {
      stats = fetchedStats;
    }
  } catch (error) {
    console.warn(
      "Could not query support tickets for superadmin, using fallback dataset.",
      error
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono bg-muted/60">
              SUPERADMIN · MESA DE AYUDA
            </Badge>
            <span className="flex items-center gap-1 text-xs text-primary font-medium">
              <Headphones className="h-3.5 w-3.5" />
              Soporte Multicanal Activo
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Centro de Soporte & Incidencias
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión centralizada de reclamos, problemas de GPS, consultas comerciales y soporte técnico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Mesa de Ayuda Operativa</span>
          </div>
        </div>
      </div>

      {/* Main Support Center Table & KPIs */}
      <SoporteTable initialTickets={tickets} stats={stats} />
    </div>
  );
}
