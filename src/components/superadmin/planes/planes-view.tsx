"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Layers,
  Sparkles,
  Plus,
  Settings,
  X,
  RefreshCw,
  Check,
  Building2,
  Calendar,
  Zap,
} from "lucide-react";
import { appAlert } from "@/lib/alerts";
import { createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from "@/lib/admin-actions";

export interface SubscriptionPlanData {
  id: number;
  nombre: string;
  minVehiculos: number;
  maxVehiculos: number | null;
  precioMensual: number;
  precioAnual?: number | null;
  activo?: number;
  badge?: string;
  features?: string[];
  tenantsCount?: number;
}

interface PlanesViewProps {
  plans: SubscriptionPlanData[];
}

function calcAnnualPrice(mensual: number, discountPct: number): number {
  const d = Math.min(100, Math.max(0, discountPct));
  return Math.round(mensual * 12 * (1 - d / 100));
}

export function PlanesView({ plans: initialPlans = [] }: PlanesViewProps) {
  const [plans, setPlans] = useState<SubscriptionPlanData[]>(initialPlans);
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  const [discountPct, setDiscountPct] = useState(16);
  const [discountInput, setDiscountInput] = useState(String(16));

  // Plan Dialog state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanData | null>(null);
  const [planForm, setPlanForm] = useState({
    nombre: "",
    minVehiculos: 1,
    maxVehiculos: "" as number | string,
    precioMensual: 0,
    precioAnual: "" as number | string,
  });
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  // Handlers for Plan Management
  const handleOpenNewPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      nombre: "",
      minVehiculos: plans.length > 0 ? Math.max(...plans.map((p) => p.maxVehiculos || p.minVehiculos)) + 1 : 1,
      maxVehiculos: "",
      precioMensual: 0,
      precioAnual: "",
    });
    setPlanDialogOpen(true);
  };

  const handleOpenEditPlan = (plan: SubscriptionPlanData) => {
    setEditingPlan(plan);
    setPlanForm({
      nombre: plan.nombre,
      minVehiculos: plan.minVehiculos,
      maxVehiculos: plan.maxVehiculos ?? "",
      precioMensual: plan.precioMensual,
      precioAnual: plan.precioAnual ?? calcAnnualPrice(plan.precioMensual, discountPct),
    });
    setPlanDialogOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.nombre.trim()) {
      appAlert.error("El nombre del plan es requerido");
      return;
    }
    if (planForm.minVehiculos < 1) {
      appAlert.error("El mínimo de vehículos debe ser al menos 1");
      return;
    }
    if (planForm.maxVehiculos !== "" && Number(planForm.maxVehiculos) < planForm.minVehiculos) {
      appAlert.error("El máximo de vehículos no puede ser menor al mínimo");
      return;
    }
    if (planForm.precioMensual <= 0) {
      appAlert.error("Ingrese un precio mensual válido");
      return;
    }

    setIsSubmittingPlan(true);
    try {
      if (editingPlan) {
        const fd = new FormData();
        fd.append("id", editingPlan.id.toString());
        fd.append("nombre", planForm.nombre);
        fd.append("minVehiculos", planForm.minVehiculos.toString());
        if (planForm.maxVehiculos !== "") fd.append("maxVehiculos", planForm.maxVehiculos.toString());
        fd.append("precioMensual", planForm.precioMensual.toString());
        if (planForm.precioAnual !== "") fd.append("precioAnual", planForm.precioAnual.toString());

        const res = await updateSubscriptionPlan(fd);

        if (res.success && res.plan) {
          appAlert.success(`Plan "${planForm.nombre}" actualizado`);
          setPlans((prev) =>
            prev.map((p) =>
              p.id === editingPlan.id
                ? {
                    ...p,
                    nombre: planForm.nombre,
                    minVehiculos: planForm.minVehiculos,
                    maxVehiculos: planForm.maxVehiculos === "" ? null : Number(planForm.maxVehiculos),
                    precioMensual: planForm.precioMensual,
                    precioAnual: planForm.precioAnual === "" ? null : Number(planForm.precioAnual),
                  }
                : p
            )
          );
          setPlanDialogOpen(false);
        } else {
          appAlert.error("No se pudo actualizar el plan");
        }
      } else {
        const fd = new FormData();
        fd.append("nombre", planForm.nombre);
        fd.append("minVehiculos", planForm.minVehiculos.toString());
        if (planForm.maxVehiculos !== "") fd.append("maxVehiculos", planForm.maxVehiculos.toString());
        fd.append("precioMensual", planForm.precioMensual.toString());
        if (planForm.precioAnual !== "") fd.append("precioAnual", planForm.precioAnual.toString());

        const res = await createSubscriptionPlan(fd);

        if (res.success && res.plan) {
          appAlert.success(`Nuevo plan "${planForm.nombre}" creado exitosamente`);
          setPlans((prev) => [
            ...prev,
            {
              id: res.plan!.id,
              nombre: res.plan!.nombre,
              minVehiculos: (res.plan as any).minVehiculos ?? planForm.minVehiculos,
              maxVehiculos: res.plan!.maxVehiculos,
              precioMensual: res.plan!.precioMensual,
              precioAnual: res.plan!.precioAnual,
              activo: res.plan!.activo,
              tenantsCount: 0,
            },
          ]);
          setPlanDialogOpen(false);
        } else {
          appAlert.error("No se pudo crear el plan");
        }
      }
    } catch (err: any) {
      appAlert.error(err.message || "Error al procesar el plan");
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const handleDeletePlan = async (plan: SubscriptionPlanData) => {
    if (!confirm(`¿Eliminar el plan "${plan.nombre}"?`)) return;
    try {
      const fd = new FormData();
      fd.append("id", plan.id.toString());
      const res = await deleteSubscriptionPlan(fd);
      if (res.success) {
        appAlert.success(`Plan "${plan.nombre}" eliminado`);
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      } else {
        appAlert.error("No se pudo eliminar el plan");
      }
    } catch (err: any) {
      appAlert.error(err.message || "Error al eliminar el plan");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION & CYCLE TOGGLE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              Catálogo de Planes Activos
              <Badge variant="outline" className="font-mono text-xs">
                {plans.length} niveles
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Configura rangos de flota y precios escalonados para la facturación SaaS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* Toggle Mensual / Anual */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border text-xs shrink-0">
            <button
              type="button"
              onClick={() => setIsAnnualBilling(false)}
              className={`px-3 py-1 rounded-md font-medium transition ${
                !isAnnualBilling
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Facturación Mensual
            </button>
            <button
              type="button"
              onClick={() => setIsAnnualBilling(true)}
              className={`px-3 py-1 rounded-md font-medium transition ${
                isAnnualBilling
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Facturación Anual
            </button>
          </div>

          {/* Mini input descuento anual - inline, sin altura vertical extra */}
          <div className="flex items-center gap-1 text-xs border rounded-lg bg-muted/40 px-2 py-1 h-8 shrink-0">
            <span className="text-muted-foreground font-medium whitespace-nowrap hidden lg:inline">Dto. anual</span>
            <span className="text-muted-foreground font-medium lg:hidden">Dto.</span>
            <Input
              type="text"
              inputMode="numeric"
              value={discountInput}
              onChange={(e) => {
                const raw = e.target.value;
                // Permitir vacío para poder borrar el 0
                if (raw === "") {
                  setDiscountInput("");
                  return;
                }
                // Solo dígitos
                if (!/^\d*$/.test(raw)) return;
                setDiscountInput(raw);
                const v = parseInt(raw, 10);
                if (isNaN(v)) return;
                const pct = Math.min(100, Math.max(0, v));
                setDiscountPct(pct);
                if (planForm.precioMensual > 0) {
                  setPlanForm((prev) => ({ ...prev, precioAnual: calcAnnualPrice(prev.precioMensual, pct) }));
                }
              }}
              onBlur={() => {
                if (discountInput === "" || discountInput.trim() === "") {
                  setDiscountInput("0");
                  setDiscountPct(0);
                  if (planForm.precioMensual > 0) {
                    setPlanForm((prev) => ({ ...prev, precioAnual: calcAnnualPrice(prev.precioMensual, 0) }));
                  }
                  return;
                }
                const v = parseInt(discountInput, 10);
                if (isNaN(v)) {
                  setDiscountInput(String(discountPct));
                  return;
                }
                const pct = Math.min(100, Math.max(0, v));
                setDiscountInput(String(pct));
                setDiscountPct(pct);
                if (planForm.precioMensual > 0) {
                  setPlanForm((prev) => ({ ...prev, precioAnual: calcAnnualPrice(prev.precioMensual, pct) }));
                }
              }}
              onFocus={(e) => e.target.select()}
              className="h-6 w-12 px-1 py-0 text-center font-mono text-xs"
              aria-label="Porcentaje descuento anual"
            />
            <span className="font-bold text-foreground">%</span>
          </div>

          <Button onClick={handleOpenNewPlan} size="sm" className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            <span>Nuevo Plan</span>
          </Button>
        </div>
      </div>

      {/* BARRA VISUAL DE RANGOS ESCALONADOS */}
      <Card className="shadow-xs border-border/80 overflow-hidden">
        <CardHeader className="pb-3 bg-muted/20 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Escala de Cobertura por Flota
              </CardTitle>
              <CardDescription className="text-xs">
                Segmentación automática de cuota según cantidad de vehículos activos en cada empresa
              </CardDescription>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Hacé clic en cualquier tramo para editar
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="h-10 w-full rounded-lg overflow-hidden flex border border-border shadow-2xs">
            {[...plans]
              .sort((a, b) => a.minVehiculos - b.minVehiculos)
              .map((plan) => {
                const width = plan.maxVehiculos
                  ? Math.max(8, plan.maxVehiculos - plan.minVehiculos + 1)
                  : 14;
                return (
                  <div
                    key={plan.id}
                    className="flex-1 flex items-center justify-center text-[11px] font-bold border-r border-white/40 last:border-0 relative group cursor-pointer hover:brightness-110 transition"
                    style={{
                      flex: width,
                      background: `hsl(${200 + (plan.id * 25) % 60} 70% 88%)`,
                      color: "#1E2227",
                    }}
                    title={`${plan.nombre}: ${plan.minVehiculos} - ${
                      plan.maxVehiculos ?? "∞"
                    } • $${plan.precioMensual.toLocaleString("es-AR")}`}
                    onClick={() => handleOpenEditPlan(plan)}
                  >
                    <span className="truncate px-1">
                      {plan.minVehiculos}
                      {plan.maxVehiculos ? `-${plan.maxVehiculos}` : "+"}
                    </span>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1E2227] text-white text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                      {plan.nombre} • ${plan.precioMensual.toLocaleString("es-AR")}/mes
                    </span>
                  </div>
                );
              })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1">
            <span>
              <span className="font-semibold text-foreground">Regla de exceso:</span> si un cliente supera el límite de su plan, el sistema escala automáticamente al siguiente nivel.
            </span>
            <span className="font-mono text-[11px]">
              Total clientes suscritos: {plans.reduce((acc, p) => acc + (p.tenantsCount || 0), 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* TABLA DE PLANES */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Plan</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Rango Flota</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">
                {isAnnualBilling ? "Precio Anual / Vehículo" : "Precio Mensual / Vehículo"}
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">
                {isAnnualBilling ? "Equiv. Mensual / Veh." : "Precio Anual / Veh."}
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Empresas Asignadas</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...plans]
              .sort((a, b) => a.minVehiculos - b.minVehiculos)
              .map((plan) => {
                const derivedAnnual = calcAnnualPrice(plan.precioMensual, discountPct);
                const currentPrice = isAnnualBilling ? derivedAnnual : plan.precioMensual;

                const rangeLabel = plan.maxVehiculos
                  ? `${plan.minVehiculos} a ${plan.maxVehiculos} unidades`
                  : `${plan.minVehiculos}+ unidades (Ilimitado)`;

                return (
                  <TableRow key={plan.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-bold text-sm text-foreground">{plan.nombre}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">ID #{plan.id}</div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {rangeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-foreground">
                      ${currentPrice.toLocaleString("es-AR")}
                      <span className="text-[10px] text-muted-foreground font-normal ml-1">
                        {isAnnualBilling ? "/año" : "/mes"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {isAnnualBilling
                        ? `$${Math.round(currentPrice / 12).toLocaleString("es-AR")}/mes`
                        : `$${derivedAnnual.toLocaleString("es-AR")}/año`}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono text-xs gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {plan.tenantsCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEditPlan(plan)}
                          title="Editar Plan"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeletePlan(plan)}
                          title="Eliminar Plan"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* MODAL CREAR / EDITAR PLAN */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSavePlan}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                {editingPlan ? `Editar Plan "${editingPlan.nombre}"` : "Nuevo Plan de Suscripción"}
              </DialogTitle>
              <DialogDescription>
                Define los parámetros de cobertura de flota y aranceles para este nivel.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Nombre del Plan *
                </label>
                <Input
                  value={planForm.nombre}
                  onChange={(e) => setPlanForm({ ...planForm, nombre: e.target.value })}
                  placeholder="Ej. Crecimiento, Enterprise, Starter"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Desde (Mín. Vehículos) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={planForm.minVehiculos}
                    onChange={(e) => setPlanForm({ ...planForm, minVehiculos: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Hasta (Máx. Vehículos)
                  </label>
                  <Input
                    type="number"
                    min={planForm.minVehiculos}
                    value={planForm.maxVehiculos}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        maxVehiculos: e.target.value === "" ? "" : parseInt(e.target.value),
                      })
                    }
                    placeholder="Vacío = Ilimitado"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Precio Mensual por Vehículo (ARS) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={planForm.precioMensual}
                    onChange={(e) => {
                      const mensual = parseFloat(e.target.value) || 0;
                      setPlanForm({
                        ...planForm,
                        precioMensual: mensual,
                        precioAnual: mensual > 0 ? calcAnnualPrice(mensual, discountPct) : "",
                      });
                    }}
                    placeholder="Ej. 12500"
                    required
                  />
                  {planForm.precioMensual > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Precio unitario por cada vehículo. Anual auto: 12× con {discountPct}% dto.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Precio Anual por Vehículo <span className="font-normal text-muted-foreground">· auto</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={planForm.precioAnual}
                    readOnly
                    className="bg-muted/50 font-mono"
                    placeholder="Se calcula automáticamente"
                  />
                  {planForm.precioAnual !== "" && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                      ${Number(planForm.precioAnual).toLocaleString("es-AR")}/año
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPlanDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingPlan} className="gap-2">
                {isSubmittingPlan ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editingPlan ? "Guardar Cambios" : "Crear Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
