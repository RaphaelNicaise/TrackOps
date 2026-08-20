"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  RotateCcw,
  Radar,
  FlaskConical,
  Filter,
  Loader2,
  Car,
  Wrench,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { TestAlertModal } from "@/components/configuracion/TestAlertModal";
import { appAlert } from "@/lib/alerts";
import type { ParsedAlertConfig } from "@/types/alerts";

export interface AlertFilters {
  search: string;
  patente: string;
  modulo: string;
  severidad: string;
  canal: string;
}

interface AlertsFilterBarProps {
  filters: AlertFilters;
  onFilterChange: (newFilters: AlertFilters) => void;
  onReset: () => void;
  onScanCompleted?: () => void;
  currentConfig?: ParsedAlertConfig;
  empresaId?: number;
  isLoading?: boolean;
}

export function AlertsFilterBar({
  filters,
  onFilterChange,
  onReset,
  onScanCompleted,
  currentConfig,
  empresaId,
  isLoading = false,
}: AlertsFilterBarProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handlePatenteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, patente: e.target.value.toUpperCase() });
  };

  const handleModuloChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, modulo: e.target.value });
  };

  const handleSeveridadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, severidad: e.target.value });
  };

  const handleCanalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, canal: e.target.value });
  };

  const handleScanFleet = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/alerts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        appAlert.success(
          `Escaneo de flota completado: se detectaron y procesaron ${data.count ?? 0} alertas.`
        );
        if (onScanCompleted) {
          onScanCompleted();
        }
      } else {
        appAlert.error(data.error || "No se pudo completar el escaneo de flota.");
      }
    } catch (err: any) {
      appAlert.error(err.message || "Error al conectar con el motor de escaneo de flota.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top action bar with Search, Action Buttons, and Quick Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Buscar por texto, patente, destinatario..."
            className="pl-9 bg-card border-border/80 text-sm"
          />
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleScanFleet}
            disabled={isScanning || isLoading}
            className="gap-1.5 shadow-sm font-medium"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Radar className="h-4 w-4" />
            )}
            <span>Escanear Flota Ahora</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTestModalOpen(true)}
            className="gap-1.5 border-border/80 font-medium"
          >
            <FlaskConical className="h-4 w-4 text-primary" />
            <span>Alerta de Prueba</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-1 text-muted-foreground hover:text-foreground text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Limpiar Filtros</span>
          </Button>
        </div>
      </div>

      {/* Filter Select Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {/* Patente Filter Input */}
        <div className="relative">
          <Input
            value={filters.patente}
            onChange={handlePatenteChange}
            placeholder="Filtrar Patente (ej: AB123CD)"
            className="font-mono uppercase text-xs h-9 bg-card border-border/80"
          />
        </div>

        {/* Módulo Select */}
        <div>
          <select
            value={filters.modulo}
            onChange={handleModuloChange}
            className="w-full h-9 rounded-md border border-border/80 bg-card px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los Módulos</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
            <option value="DOCUMENTACION">Documentación</option>
            <option value="GEOCERCAS">Geocercas</option>
            <option value="HORARIOS">Horarios</option>
            <option value="SISTEMA">Sistema</option>
          </select>
        </div>

        {/* Severidad Select */}
        <div>
          <select
            value={filters.severidad}
            onChange={handleSeveridadChange}
            className="w-full h-9 rounded-md border border-border/80 bg-card px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas las Severidades</option>
            <option value="CRITICA">Crítica</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>

        {/* Canal Select */}
        <div>
          <select
            value={filters.canal}
            onChange={handleCanalChange}
            className="w-full h-9 rounded-md border border-border/80 bg-card px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los Canales</option>
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="AMBOS">Ambos (Email & WhatsApp)</option>
            <option value="SISTEMA">Sistema</option>
          </select>
        </div>
      </div>

      {/* Test Alert Modal */}
      <TestAlertModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        currentConfig={currentConfig}
        empresaId={empresaId}
      />
    </div>
  );
}
