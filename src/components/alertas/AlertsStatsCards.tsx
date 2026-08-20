"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, MessageSquare, Mail, AlertTriangle, Radio } from "lucide-react";
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
      description: "Historial acumulado de eventos",
      icon: Bell,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Envíos WhatsApp",
      value: computedStats.whatsapp,
      description: "Mensajes directos a teléfonos de guardia",
      icon: MessageSquare,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Envíos Email",
      value: computedStats.email,
      description: "Reportes enviados a casillas operativas",
      icon: Mail,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
    {
      title: "Críticas / Altas",
      value: computedStats.critical,
      description: "Eventos que requieren acción urgente",
      icon: AlertTriangle,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
    },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className="border border-border/80 bg-card hover:border-primary/30 transition-all duration-200 shadow-sm"
          >
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {card.value}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {card.description}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${card.bgColor} ${card.color} border ${card.borderColor} flex-shrink-0`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
