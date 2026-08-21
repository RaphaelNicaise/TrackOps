"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Bell,
  Truck,
  Users,
  Wrench,
  ArrowRight,
  Sparkles,
  Rocket,
  Loader2,
  ShieldCheck,
  Check,
} from "lucide-react";
import { completeTenantSetup } from "@/lib/onboarding-actions";
import { TenantOnboardingStatus } from "@/types/onboarding";
import { appAlert } from "@/lib/alerts";

interface OnboardingSetupCardProps {
  status: TenantOnboardingStatus;
}

const STEP_ICONS = {
  alerts: Bell,
  vehicles: Truck,
  users: Users,
  maintenance: Wrench,
};

export function OnboardingSetupCard({ status }: OnboardingSetupCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCompletedState, setIsCompletedState] = useState(status.isCompleted);

  if (isCompletedState) {
    return null;
  }

  const { progressPercent, completedStepsCount, totalStepsCount, stepItems, empresaNombre } = status;
  const isAllStepsDone = progressPercent === 100;

  const handleCompleteSetup = () => {
    startTransition(async () => {
      try {
        const res = await completeTenantSetup();
        if (res.success) {
          setIsCompletedState(true);
          appAlert.success(
            "¡Excelente! Has completado la configuración inicial de tu flota.",
            "Setup Completado"
          );
          router.refresh();
        } else {
          appAlert.error(res.error || "No se pudo actualizar el estado de setup");
        }
      } catch (err: any) {
        appAlert.error(err.message || "Error al completar el setup inicial");
      }
    });
  };

  return (
    <Card className="border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm overflow-hidden transition-all duration-300">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/30 flex items-center gap-1.5 py-0.5">
                <Rocket className="h-3.5 w-3.5 text-primary" />
                Asistente de Configuración Inicial
              </Badge>
              {empresaNombre && (
                <span className="text-xs text-muted-foreground font-medium">
                  · {empresaNombre}
                </span>
              )}
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Puesta a punto de tu Flota
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Completá estos pasos esenciales para desbloquear el monitoreo en tiempo real, alertas automáticas y auditoría de servicios.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {/* Progress Badge */}
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {progressPercent}%
                </span>
                <Badge
                  variant={isAllStepsDone ? "default" : "secondary"}
                  className={`text-xs font-mono font-medium ${
                    isAllStepsDone
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {completedStepsCount} de {totalStepsCount} listos
                </Badge>
              </div>
            </div>

            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expandir asistente" : "Minimizar asistente"}
              aria-label={isCollapsed ? "Expandir asistente" : "Minimizar asistente"}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-muted/80 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out rounded-full ${
              isAllStepsDone
                ? "bg-emerald-500 shadow-sm"
                : "bg-primary"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <CardContent className="space-y-5 pt-0">
          {/* Step Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {stepItems.map((step, index) => {
              const Icon = STEP_ICONS[step.id] || ShieldCheck;
              const isCompleted = step.completed;

              return (
                <div
                  key={step.id}
                  className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                    isCompleted
                      ? "bg-background/80 border-emerald-500/30 hover:border-emerald-500/50"
                      : "bg-background border-border/80 hover:border-primary/40 hover:shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="h-3 w-3 stroke-[3]" />
                            Listo
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            Paso {index + 1}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4
                      className={`text-sm font-semibold tracking-tight transition-colors ${
                        isCompleted ? "text-foreground" : "text-foreground group-hover:text-primary"
                      }`}
                    >
                      {step.title}
                    </h4>

                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
                    {step.badgeText && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {step.badgeText}
                      </span>
                    )}

                    <Link
                      href={step.href}
                      className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                        isCompleted
                          ? "text-muted-foreground hover:text-foreground"
                          : "text-primary hover:underline font-semibold"
                      }`}
                    >
                      {step.actionLabel}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="text-xs text-muted-foreground text-center sm:text-left">
              {isAllStepsDone ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 inline" /> ¡Todos los módulos iniciales están configurados!
                </span>
              ) : (
                <span>
                  Podés continuar configurando los módulos o marcar el setup como terminado para ocultar esta guía.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleCompleteSetup}
                disabled={isPending}
                variant={isAllStepsDone ? "default" : "outline"}
                size="sm"
                className={`font-medium text-xs transition-all ${
                  isAllStepsDone
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    : "border-primary/30 hover:bg-primary/10 text-primary"
                }`}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Guardando...
                  </>
                ) : (
                  <>
                    {isAllStepsDone ? (
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Marcar Setup como Completado
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
