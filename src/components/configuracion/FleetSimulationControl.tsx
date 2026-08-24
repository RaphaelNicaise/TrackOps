"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Activity,
  AlertTriangle,
  Zap,
  MapPin,
  Radio,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { simulationEngine, type SimulatedAlert } from "@/lib/fleet-simulation";
import { appAlert } from "@/lib/alerts";

export function FleetSimulationControl() {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [intervalMs, setIntervalMs] = useState<number>(1200);
  const [alertCount, setAlertCount] = useState<number>(0);
  const [lastAlert, setLastAlert] = useState<SimulatedAlert | null>(null);

  useEffect(() => {
    setIsRunning(simulationEngine.getIsRunning());
    setIntervalMs(simulationEngine.getIntervalMs());

    const handleStateChange = (e: any) => {
      if (e.detail) {
        setIsRunning(e.detail.isRunning);
        if (e.detail.intervalMs) setIntervalMs(e.detail.intervalMs);
      }
    };

    const handleAlert = (e: any) => {
      if (e.detail?.alert) {
        const alert: SimulatedAlert = e.detail.alert;
        setAlertCount((prev) => prev + 1);
        setLastAlert(alert);

        // Notify user via app toast if high severity
        if (alert.severidad === "ALTA" || alert.severidad === "CRITICA") {
          appAlert.warning(`🚨 [Simulación] ${alert.titulo}: ${alert.mensaje}`);
        } else if (alert.tipo === "ENTER" || alert.tipo === "EXIT") {
          appAlert.info(`🛡️ [Simulación] ${alert.titulo}`);
        }
      }
    };

    window.addEventListener("trackops:simulation-state-change", handleStateChange);
    window.addEventListener("trackops:simulation-alert", handleAlert);

    return () => {
      window.removeEventListener("trackops:simulation-state-change", handleStateChange);
      window.removeEventListener("trackops:simulation-alert", handleAlert);
    };
  }, []);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      simulationEngine.start();
      appAlert.success("Simulador de telemetría iniciado en Bahía Blanca (rutas activas)");
    } else {
      simulationEngine.stop();
      appAlert.info("Simulador de telemetría pausado");
    }
  };

  const handleSpeedChange = (ms: number) => {
    setIntervalMs(ms);
    simulationEngine.setIntervalMs(ms);
  };

  const handleReset = () => {
    simulationEngine.reset();
    setAlertCount(0);
    setLastAlert(null);
    appAlert.success("Posiciones y estados de la flota restablecidos");
  };

  return (
    <Card className="rounded-2xl border border-amber-500/20 bg-card overflow-hidden shadow-xs">
      <CardHeader className="bg-amber-500/5 border-b border-amber-500/10 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Simulador de Telemetría &amp; Movimiento en Vivo
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    isRunning
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold"
                      : "border-slate-500/30 bg-slate-500/10 text-slate-400 text-[10px] font-semibold"
                  }
                >
                  {isRunning ? "● En Ejecución" : "Pausado"}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Simula el desplazamiento en tiempo real calle por calle en Bahía Blanca, interactuando con geocercas y límites de velocidad.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/panel/mapa">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5" />
                Ver en Mapa
              </Button>
            </Link>

            <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-xl border border-border">
              <span className="text-xs font-semibold text-foreground">
                {isRunning ? "Activado" : "Desactivado"}
              </span>
              <Switch
                checked={isRunning}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Frecuencia de actualización */}
          <div className="space-y-1.5 bg-background p-3 rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Frecuencia de Envío</span>
              <span className="text-xs font-mono font-bold text-foreground">
                {intervalMs === 800 ? "0.8s (Rápido)" : "1.2s (Fluido)"}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant={intervalMs === 1200 ? "secondary" : "outline"}
                onClick={() => handleSpeedChange(1200)}
                className="flex-1 h-7 text-[11px]"
              >
                Fluido (1.2s)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={intervalMs === 800 ? "secondary" : "outline"}
                onClick={() => handleSpeedChange(800)}
                className="flex-1 h-7 text-[11px]"
              >
                Rápido (0.8s)
              </Button>
            </div>
          </div>

          {/* Estadísticas de simulación */}
          <div className="space-y-1 bg-background p-3 rounded-xl border border-border">
            <span className="text-xs font-medium text-muted-foreground">Alertas Disparadas</span>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xl font-bold font-mono text-amber-500">{alertCount}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reiniciar
              </Button>
            </div>
          </div>

          {/* Rutas activas */}
          <div className="space-y-1 bg-background p-3 rounded-xl border border-border">
            <span className="text-xs font-medium text-muted-foreground">Zona Geográfica</span>
            <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-foreground">
              <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Bahía Blanca, Prov. Bs. As.</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              4 vehículos en circulación • 3 geocercas activas
            </p>
          </div>
        </div>

        {/* Última alerta generada */}
        {lastAlert && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground truncate">{lastAlert.titulo}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {lastAlert.timestamp.toLocaleTimeString("es-AR")}
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2">
                {lastAlert.mensaje}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
