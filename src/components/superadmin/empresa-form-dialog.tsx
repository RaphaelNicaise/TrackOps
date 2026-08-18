"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appAlert } from "@/lib/alerts";
import { createEmpresa, updateEmpresa } from "@/lib/admin-actions";
import {
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface PlanOption {
  id: number;
  nombre: string;
  maxVehiculos?: number;
  precioMensual?: number;
  precioAnual?: number | null;
}

export interface EmpresaFormData {
  id?: number;
  nombre: string;
  cuit?: string | null;
  planId?: number | null;
  planNombre?: string | null;
}

interface EmpresaFormDialogProps {
  empresa?: EmpresaFormData | null;
  plans?: PlanOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const DEFAULT_PLANS: PlanOption[] = [
  { id: 1, nombre: "Starter", maxVehiculos: 5, precioMensual: 49 },
  { id: 2, nombre: "Pro", maxVehiculos: 25, precioMensual: 149 },
  { id: 3, nombre: "Enterprise", maxVehiculos: 100, precioMensual: 399 },
];

export function EmpresaFormDialog({
  empresa,
  plans = DEFAULT_PLANS,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: EmpresaFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const isEdit = !!empresa?.id;

  const [nombre, setNombre] = useState(empresa?.nombre || "");
  const [cuit, setCuit] = useState(empresa?.cuit || "");
  const [selectedPlanId, setSelectedPlanId] = useState<number>(() => {
    if (empresa?.planId) return empresa.planId;
    if (empresa?.planNombre) {
      const found = plans.find(
        (p) => p.nombre.toLowerCase() === empresa.planNombre?.toLowerCase()
      );
      if (found) return found.id;
    }
    return plans[0]?.id || 1;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state with incoming empresa prop
  useEffect(() => {
    if (empresa) {
      setNombre(empresa.nombre || "");
      setCuit(empresa.cuit || "");
      if (empresa.planId) {
        setSelectedPlanId(empresa.planId);
      } else if (empresa.planNombre) {
        const found = plans.find(
          (p) => p.nombre.toLowerCase() === empresa.planNombre?.toLowerCase()
        );
        setSelectedPlanId(found ? found.id : 1);
      } else {
        setSelectedPlanId(plans[0]?.id || 1);
      }
    } else {
      setNombre("");
      setCuit("");
      setSelectedPlanId(plans[0]?.id || 1);
    }
    setErrorMsg(null);
  }, [empresa, plans, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg("El nombre de la empresa o razón social es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre.trim());
      if (cuit.trim()) {
        formData.append("cuit", cuit.trim());
      }
      formData.append("planId", selectedPlanId.toString());

      if (isEdit && empresa?.id) {
        formData.append("id", empresa.id.toString());
        await updateEmpresa(formData);
        appAlert.success(
          `La empresa "${nombre}" ha sido actualizada correctamente.`,
          "Empresa Actualizada"
        );
      } else {
        await createEmpresa(formData);
        appAlert.success(
          `La empresa "${nombre}" fue registrada con éxito en la plataforma.`,
          "Empresa Creada"
        );
      }

      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      const message =
        err?.message || "Ocurrió un error inesperado al procesar la solicitud.";
      setErrorMsg(message);
      appAlert.error(message, "Error al guardar empresa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPlans = plans.length > 0 ? plans : DEFAULT_PLANS;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Nueva Empresa
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-border bg-card">
        <form onSubmit={handleSubmit}>
          {/* Header Banner */}
          <div className="bg-muted/40 p-6 border-b border-border">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="font-mono text-xs bg-background/80"
                >
                  {isEdit ? `ID: #${empresa?.id}` : "NUEVO CLIENTE"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Gestión de Inquilino SaaS
                </span>
              </div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {isEdit ? "Editar Empresa Cliente" : "Registrar Nueva Empresa"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isEdit
                  ? "Actualiza la razón social, CUIT o plan asignado para este inquilino."
                  : "Completa los datos de la empresa cliente para aprovisionar su espacio en TrackOps."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-lg font-medium">
                {errorMsg}
              </div>
            )}

            {/* Field: Nombre */}
            <div className="space-y-2">
              <Label htmlFor="empresa-nombre" className="text-sm font-semibold flex items-center gap-1.5">
                Razón Social / Nombre Comercial
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="empresa-nombre"
                  name="nombre"
                  placeholder="ej. Transportes del Sur S.A."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  required
                />
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Field: CUIT */}
            <div className="space-y-2">
              <Label htmlFor="empresa-cuit" className="text-sm font-semibold">
                CUIT / Identificación Tributaria
              </Label>
              <div className="relative">
                <Input
                  id="empresa-cuit"
                  name="cuit"
                  placeholder="ej. 30-71234567-9"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  className="pl-9 h-10 font-mono text-sm"
                />
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Formato sugerido: XX-XXXXXXXX-X para validación fiscal en Argentina.
              </p>
            </div>

            {/* Field: Plan Selection */}
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold flex items-center justify-between">
                <span>Plan de Suscripción Inicial</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Límites de telemetría y flota
                </span>
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {currentPlans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isStarter = plan.nombre.toLowerCase().includes("starter") || plan.id === 1;
                  const isPro = plan.nombre.toLowerCase().includes("pro") || plan.id === 2;
                  const isEnterprise = plan.nombre.toLowerCase().includes("enterprise") || plan.id === 3;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-all flex flex-col justify-between text-left ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                          : "border-border hover:border-primary/40 bg-card"
                      }`}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          setSelectedPlanId(plan.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs tracking-tight text-foreground">
                          {plan.nombre}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </div>

                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {plan.maxVehiculos
                          ? `Hasta ${plan.maxVehiculos} vehículos`
                          : "Flota ilimitada"}
                      </div>

                      <div className="mt-2 text-xs font-bold text-foreground">
                        {plan.precioMensual != null
                          ? `$${plan.precioMensual} USD/mes`
                          : "Cotización a medida"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-muted/30 px-6 py-4 border-t border-border flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2 min-w-[130px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEdit ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  Actualizar
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Crear Empresa
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
