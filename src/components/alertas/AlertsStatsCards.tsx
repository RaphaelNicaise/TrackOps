"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, MessageSquare, Mail, AlertTriangle } from "lucide-react";
import type { AlertLog } from "@/db/schema";

export interface AlertStats {
  total: number;
  whatsapp: number;
  email: number;
  critical: number;
}

interface AlertsStatsCardsProps {
  stats?: AlertStats;
  alerts?: AlertLog[];
  className?: string;
}

export function AlertsStatsCards({ stats, alerts, className = "" }: AlertsStatsCardsProps) {
  const computedStats: AlertStats = stats || {
    total: alerts ? alerts.length : 0,
    whatsapp: alerts
      ? alerts.filter(
          (a) => a.canal === "WHATSAPP" || a.canal === "AMBOS" || !!a.destinatarioWhatsapp
        ).length
      : 0,
    email: alerts
      ? alerts.filter((a) => a.canal === "EMAIL" || a.canal === "AMBOS" || !!a.destinatarioEmail)
          .length
      : 0,
    critical: alerts
      ? alerts.filter((a) => a.severidad === "CRITICA" || a.severidad === "ALTA").length
      : 0,
  };

  const cards = [
    {
      title: "Total Alertas",
      value: computedStats.total,
      description: "Notificaciones emitidas",
      icon: Bell,
    },
    {
      title: "WhatsApp",
      value: computedStats.whatsapp,
      description: "Envíos directos a teléfonos",
      icon: MessageSquare,
    },
    {
      title: "Email",
      value: computedStats.email,
      description: "Envíos a casillas de correo",
      icon: Mail,
    },
    {
      title: "Críticas / Altas",
      value: computedStats.critical,
      description: "Eventos de alta prioridad",
      icon: AlertTriangle,
      isWarning: computedStats.critical > 0,
    },
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className="rounded-xl border border-border/80 bg-card p-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                card.isWarning
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {card.value}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {card.description}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
