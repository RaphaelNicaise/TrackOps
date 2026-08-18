import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Construction,
  Radio,
  ArrowUpRight,
  Flame,
  type LucideIcon,
} from "lucide-react";

export interface RoadmapFeature {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status?: "planned" | "in-progress" | "testing" | "completed";
  eta?: string;
}

export interface UnderConstructionProps {
  moduleName?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  progress?: number;
  eta?: string;
  features?: RoadmapFeature[];
  className?: string;
}

export function UnderConstruction({
  moduleName = "Módulo en Desarrollo",
  title = "Capacidades Avanzadas en Construcción",
  subtitle = "Estamos desarrollando funcionalidades avanzadas de siguiente generación para esta sección de la plataforma.",
  badge = "Roadmap Q3 / Q4 2026",
  progress = 60,
  eta = "Lanzamiento estimado: Próximo Release v1.2",
  features = [],
  className = "",
}: UnderConstructionProps) {
  const getStatusBadge = (status?: RoadmapFeature["status"]) => {
    switch (status) {
      case "in-progress":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            En Desarrollo
          </span>
        );
      case "testing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            Testing / Alfa
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Completado
          </span>
        );
      case "planned":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
            <Clock className="w-2.5 h-2.5" />
            Planificado
          </span>
        );
    }
  };

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Banner de Hero / En Construcción */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-background p-6 md:p-8 shadow-sm">
        {/* Luces sutiles de fondo */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 text-xs font-semibold py-1 px-2.5"
              >
                <Construction className="h-3.5 w-3.5" />
                {moduleName}
              </Badge>
              <Badge
                variant="secondary"
                className="text-[11px] font-mono font-medium gap-1 py-1"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                {badge}
              </Badge>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h2>
              <p className="mt-1.5 text-sm md:text-base text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Radar / Status Box */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 w-full md:w-auto bg-muted/40 border border-border/60 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Layers className="h-5 w-5 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Estado del Módulo
                </div>
                <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  Fase de Desarrollo
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              {eta}
            </div>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div className="mt-6 pt-6 border-t border-border/60">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Progreso de Implementación y Testing
            </span>
            <span className="font-mono text-foreground font-bold">{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted border border-border/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-primary to-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid de Funcionalidades en Roadmap */}
      {features.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider text-muted-foreground">
              Próximas Capacidades en el Roadmap
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {features.length} funciones planificadas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, idx) => {
              const IconComp = feature.icon || Sparkles;
              return (
                <Card
                  key={idx}
                  className="group relative border border-border/70 hover:border-primary/40 bg-card hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                          <IconComp className="h-5 w-5" />
                        </div>
                        {getStatusBadge(feature.status)}
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {feature.title}
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    {feature.eta && (
                      <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-mono flex items-center justify-between">
                        <span>Lanzamiento estimado:</span>
                        <span className="text-foreground font-medium">{feature.eta}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
