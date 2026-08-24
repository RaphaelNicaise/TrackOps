"use client";

import { useState } from "react";
import { IdCard, CheckCircle2, AlertCircle, Eye, Download, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChoferRow } from "@/types/flota-viajes";

interface ChoferDniViewerDialogProps {
  chofer: ChoferRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ChoferDniViewerDialog({
  chofer,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: ChoferDniViewerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;

  const hasFrente = !!chofer.fotoDniFrente;
  const hasDorso = !!chofer.fotoDniDorso;
  const hasAnyPhoto = hasFrente || hasDorso;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <IdCard className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Legajo Documental: DNI del Chofer
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {chofer.nombre} {chofer.apellido} · DNI {chofer.dni}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant={hasAnyPhoto ? "default" : "outline"}
              className={
                hasAnyPhoto
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "text-muted-foreground"
              }
            >
              {hasAnyPhoto ? "Documento Digitalizado" : "Sin foto cargada"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Driver identity summary card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">DNI Registrado:</span>
              <span className="font-mono font-bold text-foreground text-sm">{chofer.dni}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Licencia:</span>
              <span className="font-semibold text-foreground">
                {chofer.licenciaCategoria || "—"} ({chofer.licenciaNumero || "S/N"})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Teléfono:</span>
              <span className="font-medium text-foreground">{chofer.telefono || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Estado Laboral:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {chofer.estado}
              </span>
            </div>
          </div>

          {/* DNI Photos grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Frente */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>DNI - Frente</span>
                {hasFrente && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Cargado
                  </span>
                )}
              </div>
              <div className="aspect-[1.58/1] rounded-xl border border-dashed border-border bg-background flex flex-col items-center justify-center overflow-hidden p-2 text-center relative group">
                {hasFrente ? (
                  <img
                    src={chofer.fotoDniFrente!}
                    alt={`DNI Frente de ${chofer.nombre}`}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-muted-foreground space-y-1.5 p-4">
                    <IdCard className="w-8 h-8 mx-auto opacity-30" />
                    <p className="text-xs">No se ha cargado foto del frente</p>
                    <p className="text-[10px] opacity-70">
                      Podés cargarla desde "Editar Chofer"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dorso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>DNI - Dorso (con Código de Barras)</span>
                {hasDorso && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Cargado
                  </span>
                )}
              </div>
              <div className="aspect-[1.58/1] rounded-xl border border-dashed border-border bg-background flex flex-col items-center justify-center overflow-hidden p-2 text-center relative group">
                {hasDorso ? (
                  <img
                    src={chofer.fotoDniDorso!}
                    alt={`DNI Dorso de ${chofer.nombre}`}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-muted-foreground space-y-1.5 p-4">
                    <IdCard className="w-8 h-8 mx-auto opacity-30" />
                    <p className="text-xs">No se ha cargado foto del dorso</p>
                    <p className="text-[10px] opacity-70">
                      Incluye el código de barras PDF417 para validación
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
