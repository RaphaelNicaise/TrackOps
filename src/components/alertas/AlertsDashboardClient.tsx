"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AlertsStatsCards, type AlertStats } from "./AlertsStatsCards";
import { AlertsFilterBar, type AlertFilters } from "./AlertsFilterBar";
import { AlertsHistoryTable } from "./AlertsHistoryTable";
import { AlertDetailDialog } from "./AlertDetailDialog";
import type { AlertLog } from "@/db/schema";
import type { ParsedAlertConfig } from "@/types/alerts";

interface AlertsDashboardClientProps {
  initialAlerts: AlertLog[];
  initialConfig?: ParsedAlertConfig;
  initialStats?: AlertStats;
  initialPatente?: string;
  empresaId?: number;
}

export function AlertsDashboardClient({
  initialAlerts,
  initialConfig,
  initialStats,
  initialPatente = "",
  empresaId,
}: AlertsDashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlPatente = searchParams?.get("patente") || initialPatente || "";
  const urlModulo = searchParams?.get("modulo") || "";
  const urlSeveridad = searchParams?.get("severidad") || "";
  const urlCanal = searchParams?.get("canal") || "";
  const urlSearch = searchParams?.get("search") || "";

  const [filters, setFilters] = useState<AlertFilters>({
    search: urlSearch,
    patente: urlPatente,
    modulo: urlModulo,
    severidad: urlSeveridad,
    canal: urlCanal,
  });

  const [alerts, setAlerts] = useState<AlertLog[]>(initialAlerts);
  const [stats, setStats] = useState<AlertStats | undefined>(initialStats);
  const [selectedAlert, setSelectedAlert] = useState<AlertLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync URL search params when filters change
  const updateUrlParams = (newFilters: AlertFilters) => {
    if (!router || !pathname) return;
    const params = new URLSearchParams();
    if (newFilters.patente) params.set("patente", newFilters.patente);
    if (newFilters.modulo) params.set("modulo", newFilters.modulo);
    if (newFilters.severidad) params.set("severidad", newFilters.severidad);
    if (newFilters.canal) params.set("canal", newFilters.canal);
    if (newFilters.search) params.set("search", newFilters.search);

    const qs = params.toString();
    const targetUrl = qs ? `${pathname}?${qs}` : pathname;
    try {
      router.replace(targetUrl, { scroll: false });
    } catch {
      // Fallback
    }
  };

  const handleFilterChange = (newFilters: AlertFilters) => {
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const handleResetFilters = () => {
    const emptyFilters: AlertFilters = {
      search: "",
      patente: "",
      modulo: "",
      severidad: "",
      canal: "",
    };
    setFilters(emptyFilters);
    updateUrlParams(emptyFilters);
  };

  const handleSelectAlert = (alert: AlertLog) => {
    setSelectedAlert(alert);
    setDetailOpen(true);
  };

  // Re-fetch alerts from API when requested or on scan
  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (empresaId) params.set("empresaId", String(empresaId));
      if (filters.patente) params.set("patente", filters.patente);
      if (filters.modulo) params.set("modulo", filters.modulo);
      if (filters.severidad) params.set("severidad", filters.severidad);
      if (filters.canal) params.set("canal", filters.canal);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/alerts/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAlerts(data.alerts || []);
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Error refreshing alerts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter alerts in-memory for instant feedback when alerts are loaded
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (
        filters.patente &&
        (!alert.patente || alert.patente.toUpperCase() !== filters.patente.toUpperCase())
      ) {
        return false;
      }
      if (filters.modulo && alert.modulo !== filters.modulo) {
        return false;
      }
      if (filters.severidad && alert.severidad !== filters.severidad) {
        return false;
      }
      if (filters.canal && alert.canal !== filters.canal) {
        return false;
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match =
          (alert.titulo && alert.titulo.toLowerCase().includes(s)) ||
          (alert.mensaje && alert.mensaje.toLowerCase().includes(s)) ||
          (alert.patente && alert.patente.toLowerCase().includes(s)) ||
          (alert.destinatarioEmail && alert.destinatarioEmail.toLowerCase().includes(s)) ||
          (alert.destinatarioWhatsapp && alert.destinatarioWhatsapp.toLowerCase().includes(s));
        if (!match) return false;
      }
      return true;
    });
  }, [alerts, filters]);

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards */}
      <AlertsStatsCards stats={stats} alerts={alerts} />

      {/* Filter Toolbar & Actions */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground font-mono">
            Filtros &amp; Control de Historial
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            Mostrando {filteredAlerts.length} de {alerts.length} alertas
          </span>
        </div>

        <AlertsFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          onScanCompleted={fetchAlerts}
          currentConfig={initialConfig}
          empresaId={empresaId}
          isLoading={isLoading}
        />
      </div>

      {/* History Data Table */}
      <AlertsHistoryTable
        alerts={filteredAlerts}
        onSelectAlert={handleSelectAlert}
        isLoading={isLoading}
      />

      {/* Detail Dialog Modal */}
      <AlertDetailDialog
        alert={selectedAlert}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
