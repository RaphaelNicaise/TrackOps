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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const MODULO_LABELS: Record<string, string> = {
  ALL: "Todos los Módulos",
  MANTENIMIENTO: "Mantenimiento",
  DOCUMENTACION: "Documentación",
  GEOCERCAS: "Geocercas",
  HORARIOS: "Horarios",
  SISTEMA: "Sistema",
};

const SEVERIDAD_LABELS: Record<string, string> = {
  ALL: "Todas las Severidades",
  CRITICA: "Crítica",
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const CANAL_LABELS: Record<string, string> = {
  ALL: "Todos los Canales",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  AMBOS: "Ambos",
  SISTEMA: "Sistema",
};

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

  const handleModuloChange = (val: string) => {
    onFilterChange({ ...filters, modulo: val === "ALL" ? "" : val });
  };

  const handleSeveridadChange = (val: string) => {
    onFilterChange({ ...filters, severidad: val === "ALL" ? "" : val });
  };

  const handleCanalChange = (val: string) => {
    onFilterChange({ ...filters, canal: val === "ALL" ? "" : val });
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
            className="pl-9 h-9 text-sm rounded-xl bg-card border-input"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleScanFleet}
            disabled={isScanning || isLoading}
            className="h-9 gap-1.5 rounded-xl text-xs font-medium border-border bg-card hover:bg-muted/80"
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
            className="h-9 gap-1.5 rounded-xl text-xs font-medium border-border bg-card hover:bg-muted/80"
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
              className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground rounded-xl"
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
            className="font-mono uppercase text-xs h-9 rounded-xl bg-card border-input"
          />
        </div>

        <div>
          <Select
            value={filters.modulo || "ALL"}
            onValueChange={handleModuloChange}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl bg-card border-input shadow-2xs">
              <SelectValue placeholder="Todos los Módulos">
                {MODULO_LABELS[filters.modulo] || "Todos los Módulos"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
              <SelectItem value="ALL">Todos los Módulos</SelectItem>
              <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
              <SelectItem value="DOCUMENTACION">Documentación</SelectItem>
              <SelectItem value="GEOCERCAS">Geocercas</SelectItem>
              <SelectItem value="HORARIOS">Horarios</SelectItem>
              <SelectItem value="SISTEMA">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={filters.severidad || "ALL"}
            onValueChange={handleSeveridadChange}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl bg-card border-input shadow-2xs">
              <SelectValue placeholder="Todas las Severidades">
                {SEVERIDAD_LABELS[filters.severidad] || "Todas las Severidades"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
              <SelectItem value="ALL">Todas las Severidades</SelectItem>
              <SelectItem value="CRITICA">Crítica</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="MEDIA">Media</SelectItem>
              <SelectItem value="BAJA">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={filters.canal || "ALL"}
            onValueChange={handleCanalChange}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl bg-card border-input shadow-2xs">
              <SelectValue placeholder="Todos los Canales">
                {CANAL_LABELS[filters.canal] || "Todos los Canales"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
              <SelectItem value="ALL">Todos los Canales</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="AMBOS">Ambos</SelectItem>
              <SelectItem value="SISTEMA">Sistema</SelectItem>
            </SelectContent>
          </Select>
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
