"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, PowerOff, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exitSuperadminImpersonation } from "@/lib/impersonation";
import { appAlert } from "@/lib/alerts";

interface SuperadminImpersonationBannerProps {
  empresaId: number;
  empresaNombre: string;
}

export function SuperadminImpersonationBanner({
  empresaId,
  empresaNombre,
}: SuperadminImpersonationBannerProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = async () => {
    try {
      setIsExiting(true);
      await exitSuperadminImpersonation();
      appAlert.success("Sesión de soporte finalizada.", "Modo Soporte");
      router.push("/panel/superadmin/clientes");
      router.refresh();
    } catch (error: any) {
      appAlert.error(error?.message || "Error al finalizar el modo soporte");
      setIsExiting(false);
    }
  };

  return (
    <div className="w-full bg-amber-500/15 dark:bg-amber-500/20 border-b border-amber-500/30 text-amber-950 dark:text-amber-100 px-4 py-2 text-xs sm:text-sm font-medium flex flex-wrap items-center justify-between gap-3 shadow-xs sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full text-[11px] tracking-wider uppercase border border-amber-500/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>MODO SOPORTE ACTIVO</span>
        </div>
        <span className="hidden sm:inline text-amber-500/60 font-bold">·</span>
        <div className="flex items-center gap-1.5 text-foreground flex-wrap">
          <span className="text-muted-foreground text-xs">Viendo como:</span>
          <span className="font-semibold text-amber-950 dark:text-amber-200 inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            {empresaNombre}
          </span>
          <span className="text-[11px] font-mono bg-amber-500/10 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold">
            ID #{empresaId}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 bg-background/80 hover:bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
          asChild
        >
          <Link href="/panel/administracion/configuracion">
            <Settings className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Configuración Empresa</span>
            <span className="sm:hidden">Configuración</span>
          </Link>
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={isExiting}
          onClick={handleExit}
          className="h-7 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs border border-amber-700/50"
        >
          {isExiting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PowerOff className="h-3.5 w-3.5" />
          )}
          <span>Finalizar Soporte</span>
        </Button>
      </div>
    </div>
  );
}
