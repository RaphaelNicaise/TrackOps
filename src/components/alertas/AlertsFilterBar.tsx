"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  RotateCcw,
  Radar,
  FlaskConical,
  Loader2,
  Filter,
} from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
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
          `Escaneo de flota completado: se detectaron ${data.count ?? 0} alertas.`
        );
        if (onScanCompleted) {
          onScanCompleted();
        }
      } else {
        appAlert.error(data.error || "No se pudo completar el escaneo de flota.");
      }
    } catch (err: any) {
      appAlert.error(err.message || "Error al conectar con el motor de escaneo.");
    } finally {
      setIsScanning(false);
    }
  };

  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    Boolean(filters.patente.trim()) ||
    Boolean(filters.modulo) ||
    Boolean(filters.severidad) ||
    Boolean(filters.canal);

  return (
    <div className="p-4 border-b space-y-3 bg-card">
      {/* Top Search & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Buscar por patente, mensaje o destinatario..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleScanFleet}
            disabled={isScanning || isLoading}
            className="h-9 gap-1.5 rounded-lg text-xs font-medium"
          >
            {isScanning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Radar className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span>Escanear Flota</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTestModalOpen(true)}
            className="h-9 gap-1.5 rounded-lg text-xs font-medium"
          >
            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Alerta de Prueba</span>
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpiar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Dropdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div>
          <Input
            value={filters.patente}
            onChange={handlePatenteChange}
            placeholder="Patente (ej: AA123BB)"
            className="font-mono uppercase text-xs h-8"
          />
        </div>

        <div>
          <NativeSelect
            value={filters.modulo}
            onChange={handleModuloChange}
            sizeVariant="sm"
          >
            <option value="">Todos los Módulos</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
            <option value="DOCUMENTACION">Documentación</option>
            <option value="GEOCERCAS">Geocercas</option>
            <option value="HORARIOS">Horarios</option>
            <option value="SISTEMA">Sistema</option>
          </NativeSelect>
        </div>

        <div>
          <NativeSelect
            value={filters.severidad}
            onChange={handleSeveridadChange}
            sizeVariant="sm"
          >
            <option value="">Todas las Severidades</option>
            <option value="CRITICA">Crítica</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </NativeSelect>
        </div>

        <div>
          <NativeSelect
            value={filters.canal}
            onChange={handleCanalChange}
            sizeVariant="sm"
          >
            <option value="">Todos los Canales</option>
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="AMBOS">Ambos</option>
            <option value="SISTEMA">Sistema</option>
          </NativeSelect>
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
