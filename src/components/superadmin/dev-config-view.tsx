"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Server,
  Database,
  Container,
  HardDrive,
  BarChart3,
  ExternalLink,
  Activity,
  Sliders,
  Cpu,
  Radio,
  Settings,
  ShieldCheck,
  Zap,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Layers,
  Network,
  Power,
} from "lucide-react";
import { appAlert } from "@/lib/alerts";

export interface ServicePortCardData {
  id: string;
  name: string;
  port: string;
  url: string;
  description: string;
  category: string;
  status: "Online" | "Degraded" | "Offline";
  latency: string;
  specs: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function DevConfigView() {
  // Feature Flags State
  const [flags, setFlags] = useState({
    maintenanceMode: false,
    publicProspectsRegistration: true,
    whatsappAlertEngine: true,
    realtimeGpsStreaming: true,
    aiAnomalyDetection: true,
    strictAuditLogs: true,
  });

  // Telemetry & GPS Ingest Thresholds State
  const [thresholds, setThresholds] = useState({
    gpsPingFrequencyMotion: 5,
    gpsPingFrequencyParked: 60,
    geofenceCheckInterval: 10,
    offlineVehicleTimeout: 180,
    maxBatchBuffer: 5000,
    websocketHeartbeat: 15,
  });

  // Database Pool Configuration State
  const [dbPool, setDbPool] = useState({
    maxConnections: 20,
    activeConnections: 8,
    idleConnections: 12,
    queryTimeoutMs: 10000,
    poolLifetimeSeconds: 1800,
  });

  const [isSaving, setIsSaving] = useState(false);

  const services: ServicePortCardData[] = [
    {
      id: "umami",
      name: "Umami Analytics",
      port: ":3002",
      url: "http://localhost:3002",
      description: "Telemetría web, eventos de navegación y analítica de uso SaaS en tiempo real.",
      category: "Analítica & Telemetría Web",
      status: "Online",
      latency: "12 ms",
      specs: "Next.js Proxy · PostgreSQL DB propia",
      icon: BarChart3,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
    {
      id: "pgadmin",
      name: "pgAdmin 4 Database",
      port: ":5050",
      url: "http://localhost:5050",
      description: "Consola gráfica avanzada para administración de base de datos PostgreSQL y PostGIS.",
      category: "Gestión DB & PostGIS",
      status: "Online",
      latency: "4 ms",
      specs: "PostgreSQL 16.2 · PostGIS 3.4 Espacial",
      icon: Database,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      id: "portainer",
      name: "Portainer Docker",
      port: ":9000",
      url: "http://localhost:9000",
      description: "Gestión y orquestación visual de contenedores Docker, microservicios y logs.",
      category: "Contenedores & Microservicios",
      status: "Online",
      latency: "18 ms",
      specs: "Docker Engine v26 · 6 Contenedores activos",
      icon: Container,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/20",
    },
    {
      id: "minio",
      name: "MinIO Object Storage",
      port: ":9001 / :9002",
      url: "http://localhost:9001",
      description: "Almacenamiento compatible con AWS S3 para comprobantes de combustible y documentos VTV.",
      category: "Almacenamiento S3 (Storage)",
      status: "Online",
      latency: "15 ms",
      specs: "Consola: :9001 · S3 API: :9002 · 82.4 GB",
      icon: HardDrive,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
  ];

  const handleSaveAllConfig = async () => {
    setIsSaving(true);
    // Simulate async persisting
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSaving(false);
    appAlert.success(
      "Los parámetros del sistema, feature flags y umbrales de ingestión se guardaron correctamente.",
      "Configuración Guardada"
    );
  };

  const handleResetDefaults = () => {
    setThresholds({
      gpsPingFrequencyMotion: 5,
      gpsPingFrequencyParked: 60,
      geofenceCheckInterval: 10,
      offlineVehicleTimeout: 180,
      maxBatchBuffer: 5000,
      websocketHeartbeat: 15,
    });
    setDbPool({
      maxConnections: 20,
      activeConnections: 8,
      idleConnections: 12,
      queryTimeoutMs: 10000,
      poolLifetimeSeconds: 1800,
    });
    appAlert.info("Valores por defecto restaurados.", "Parámetros Restaurados");
  };

  return (
    <div className="space-y-8">
      {/* ══════════════════════════════════════════════════════ */}
      {/* 1. MAPA DE PUERTOS & INFRAESTRUCTURA EXTERNA           */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Servicios Externos & Mapeo de Puertos
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                4 / 4 Conectados
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Acceso directo a consolas operativas y puertos locales de la infraestructura Docker.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.id}
                className="border border-border/80 bg-card hover:border-primary/40 transition-all flex flex-col justify-between shadow-xs group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="font-mono text-[11px] font-bold">
                      {service.port}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      {service.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mt-3">
                    <div className={`p-2.5 rounded-xl ${service.bgColor} ${service.color} border ${service.borderColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {service.name}
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {service.category}
                      </p>
                    </div>
                  </div>

                  <CardDescription className="text-xs text-muted-foreground mt-2.5 line-clamp-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-[11px] font-mono text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Latencia:</span>
                      <strong className="text-foreground">{service.latency}</strong>
                    </div>
                    <div className="text-[10px] text-muted-foreground/80 truncate">
                      {service.specs}
                    </div>
                  </div>

                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all shadow-2xs group-hover:bg-primary group-hover:text-primary-foreground"
                  >
                    <span>Abrir Consola</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 2. POOL DE BASE DE DATOS & UMBRALES DE TELEMETRÍA      */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Connection Pools Card */}
        <Card className="border border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Pool de Conexiones PostgreSQL
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Parámetros de pooling con Drizzle ORM y Postgres.js
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-blue-600 dark:text-blue-400">
                PostGIS 3.4
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Pool Utilization Bar */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Utilización del Pool:</span>
                <span className="font-mono text-foreground">
                  {dbPool.activeConnections} / {dbPool.maxConnections} conexiones ({Math.round((dbPool.activeConnections / dbPool.maxConnections) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((dbPool.activeConnections / dbPool.maxConnections) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono pt-1">
                <span>{dbPool.idleConnections} conexiones listas (idle)</span>
                <span>Latencia query: 3.8 ms</span>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Máx. Conexiones Pool</label>
                <Input
                  type="number"
                  value={dbPool.maxConnections}
                  onChange={(e) =>
                    setDbPool({ ...dbPool, maxConnections: parseInt(e.target.value) || 20 })
                  }
                  className="h-8 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Query Timeout (ms)</label>
                <Input
                  type="number"
                  value={dbPool.queryTimeoutMs}
                  onChange={(e) =>
                    setDbPool({ ...dbPool, queryTimeoutMs: parseInt(e.target.value) || 10000 })
                  }
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telemetry & GPS Ingestion Engine Thresholds */}
        <Card className="border border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Umbrales de Telemetría GPS
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Frecuencias de muestreo satelital y detección de desconexión
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-amber-600 dark:text-amber-400">
                Streamer Live
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Ping en Movimiento (seg)</span>
                  <span className="font-mono text-primary">{thresholds.gpsPingFrequencyMotion}s</span>
                </label>
                <Input
                  type="number"
                  value={thresholds.gpsPingFrequencyMotion}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      gpsPingFrequencyMotion: parseInt(e.target.value) || 5,
                    })
                  }
                  className="h-8 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Ping en Reposo (seg)</span>
                  <span className="font-mono text-muted-foreground">{thresholds.gpsPingFrequencyParked}s</span>
                </label>
                <Input
                  type="number"
                  value={thresholds.gpsPingFrequencyParked}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      gpsPingFrequencyParked: parseInt(e.target.value) || 60,
                    })
                  }
                  className="h-8 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Chequeo Geocercas (seg)</span>
                  <span className="font-mono text-muted-foreground">{thresholds.geofenceCheckInterval}s</span>
                </label>
                <Input
                  type="number"
                  value={thresholds.geofenceCheckInterval}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      geofenceCheckInterval: parseInt(e.target.value) || 10,
                    })
                  }
                  className="h-8 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Timeout Offline (seg)</span>
                  <span className="font-mono text-rose-500">{thresholds.offlineVehicleTimeout}s</span>
                </label>
                <Input
                  type="number"
                  value={thresholds.offlineVehicleTimeout}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      offlineVehicleTimeout: parseInt(e.target.value) || 180,
                    })
                  }
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground border-t pt-2.5 font-mono">
              Un vehículo se marca como &quot;Offline&quot; automáticamente tras {Math.round(thresholds.offlineVehicleTimeout / 60)} min sin recibir pings.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 3. FEATURE FLAGS & CONTROLES GLOBALES DEL SISTEMA      */}
      {/* ══════════════════════════════════════════════════════ */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Sliders className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-foreground">
                  Feature Flags & Controles Globales
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-1">
                Activa o desactiva capacidades avanzadas y módulos de la plataforma en tiempo de ejecución.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDefaults}
                className="h-8 text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAllConfig}
                disabled={isSaving}
                className="h-8 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Flag 1: Modo Mantenimiento */}
            <div className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
              flags.maintenanceMode ? "bg-rose-500/10 border-rose-500/30" : "bg-muted/30 border-border/60"
            }`}>
              <div className="space-y-1">
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Power className="h-4 w-4 text-rose-500" />
                  Modo Mantenimiento Global
                  {flags.maintenanceMode && (
                    <Badge variant="destructive" className="text-[10px]">ACTIVO</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bloquea el acceso a todas las empresas clientes mostrando un aviso de mantenimiento. Los superadministradores conservan acceso.
                </p>
              </div>
              <Switch
                checked={flags.maintenanceMode}
                onCheckedChange={(checked) => setFlags({ ...flags, maintenanceMode: checked })}
              />
            </div>

            {/* Flag 2: Registro de Prospectos */}
            <div className="p-4 rounded-xl border bg-muted/30 border-border/60 transition-all flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Registro Público de Prospectos (Landing)
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Permite que nuevos clientes potenciales envíen formularios de cotización desde la página web principal.
                </p>
              </div>
              <Switch
                checked={flags.publicProspectsRegistration}
                onCheckedChange={(checked) => setFlags({ ...flags, publicProspectsRegistration: checked })}
              />
            </div>

            {/* Flag 3: Alertas WhatsApp */}
            <div className="p-4 rounded-xl border bg-muted/30 border-border/60 transition-all flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  Motor de Alertas WhatsApp (Twilio / Meta)
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Despacho automatizado de notificaciones críticas de excesos de velocidad y cruce de geocercas por WhatsApp.
                </p>
              </div>
              <Switch
                checked={flags.whatsappAlertEngine}
                onCheckedChange={(checked) => setFlags({ ...flags, whatsappAlertEngine: checked })}
              />
            </div>

            {/* Flag 4: Streaming GPS en Vivo */}
            <div className="p-4 rounded-xl border bg-muted/30 border-border/60 transition-all flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  Streaming GPS en Tiempo Real (WebSocket)
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Habilita la retransmisión continua de telemetría a los mapas interactivos con baja latencia.
                </p>
              </div>
              <Switch
                checked={flags.realtimeGpsStreaming}
                onCheckedChange={(checked) => setFlags({ ...flags, realtimeGpsStreaming: checked })}
              />
            </div>

            {/* Flag 5: Detección con IA */}
            <div className="p-4 rounded-xl border bg-muted/30 border-border/60 transition-all flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-violet-500" />
                  Detección de Anomalías de Combustible (IA)
                  <Badge variant="outline" className="text-[10px] text-violet-500 border-violet-500/30">Beta</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Algoritmo predictivo que detecta discrepancias en litros cargados vs. odómetro y alerta a los administradores.
                </p>
              </div>
              <Switch
                checked={flags.aiAnomalyDetection}
                onCheckedChange={(checked) => setFlags({ ...flags, aiAnomalyDetection: checked })}
              />
            </div>

            {/* Flag 6: Auditoría Inmutable */}
            <div className="p-4 rounded-xl border bg-muted/30 border-border/60 transition-all flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-500" />
                  Auditoría Inmutable Estricta
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Guarda en la base de datos el snapshot JSON de todas las acciones de creación, actualización y accesos con superpoderes.
                </p>
              </div>
              <Switch
                checked={flags.strictAuditLogs}
                onCheckedChange={(checked) => setFlags({ ...flags, strictAuditLogs: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
