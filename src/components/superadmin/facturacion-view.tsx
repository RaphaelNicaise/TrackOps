"use client";

import React, { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Search,
  X,
  Calendar,
  ChevronRight,
  Download,
  Send,
  MoreHorizontal,
  Receipt,
  Car,
  Check,
  RefreshCw,
  Wallet,
  Landmark,
  ArrowRight,
  FileCheck,
  HelpCircle,
  Plus,
  Settings,
} from "lucide-react";
import { appAlert } from "@/lib/alerts";
import { format, addMonths, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
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

export interface BillingRecord {
  id: number;
  empresaId: number;
  empresaNombre: string;
  cuit: string | null;
  planId: number;
  planNombre: string;
  precioMensual: number;
  precioAnual?: number | null;
  estadoPago: "al_dia" | "por_vencer" | "vencido" | "suspendida" | string;
  metodoPago: "mercadopago" | "transferencia" | "tarjeta" | "efectivo" | string;
  fechaInicio: string | Date;
  fechaProximoVencimiento: string | Date;
  totalVehiculos: number;
  ultimaFacturaRef?: string;
  montoUltimoPago?: number;
}

interface FacturacionViewProps {
  plans: SubscriptionPlanData[];
  records: BillingRecord[];
}

export function FacturacionView({ plans: initialPlans, records: initialRecords }: FacturacionViewProps) {
  const [plans, setPlans] = useState<SubscriptionPlanData[]>(initialPlans);
  const [records, setRecords] = useState<BillingRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [planFilter, setPlanFilter] = useState<string>("todos");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("todos");
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);

  // Modal states
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isChangePlanDialogOpen, setIsChangePlanDialogOpen] = useState(false);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("mercadopago");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [newPlanId, setNewPlanId] = useState<number>(1);

  // Plan CRUD dialog
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanData | null>(null);
  const [planForm, setPlanForm] = useState({ nombre: "", minVehiculos: 1, maxVehiculos: "" as string | number, precioMensual: 0, precioAnual: "" as string | number });
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Financial Metrics Calculation
  const metrics = useMemo(() => {
    const totalTenants = records.length;
    const activeRecords = records.filter(
      (r) => r.estadoPago.toLowerCase() !== "suspendida" && r.estadoPago.toLowerCase() !== "vencido"
    );
    const mrr = records
      .filter((r) => r.estadoPago.toLowerCase() !== "suspendida")
      .reduce((sum, r) => sum + (r.precioMensual || 0), 0);
    const arr = mrr * 12;
    const activeCount = activeRecords.length;
    const arpu = activeCount > 0 ? Math.round(mrr / activeCount) : 0;
    const alDiaCount = records.filter((r) => r.estadoPago.toLowerCase() === "al_dia").length;
    const porVencerCount = records.filter((r) => r.estadoPago.toLowerCase() === "por_vencer").length;
    const vencidosCount = records.filter((r) => r.estadoPago.toLowerCase() === "vencido").length;
    const suspendidasCount = records.filter((r) => r.estadoPago.toLowerCase() === "suspendida").length;
    const retentionRate = totalTenants > 0 ? Math.round((alDiaCount / totalTenants) * 100) : 100;

    return {
      mrr,
      arr,
      arpu,
      totalTenants,
      activeCount,
      alDiaCount,
      porVencerCount,
      vencidosCount,
      suspendidasCount,
      retentionRate,
    };
  }, [records]);

  // Plan tenant counters
  const plansWithTenantCounts = useMemo(() => {
    return plans.map((p) => {
      const count = records.filter(
        (r) => r.planId === p.id || r.planNombre.toLowerCase() === p.nombre.toLowerCase()
      ).length;
      return {
        ...p,
        tenantsCount: count,
      };
    });
  }, [plans, records]);

  // Filtered Billing Records
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        record.empresaNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.cuit && record.cuit.includes(searchQuery.trim())) ||
        (record.ultimaFacturaRef && record.ultimaFacturaRef.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "todos" ||
        record.estadoPago.toLowerCase() === statusFilter.toLowerCase();

      const matchPlan =
        planFilter === "todos" ||
        record.planNombre.toLowerCase() === planFilter.toLowerCase();

      const matchMethod =
        paymentMethodFilter === "todos" ||
        record.metodoPago.toLowerCase() === paymentMethodFilter.toLowerCase();

      return matchSearch && matchStatus && matchPlan && matchMethod;
    });
  }, [records, searchQuery, statusFilter, planFilter, paymentMethodFilter]);

  // Date formatter
  const formatDate = (dateVal: string | Date) => {
    try {
      const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
      if (isNaN(d.getTime())) return "Fecha no disp.";
      return format(d, "dd MMM yyyy", { locale: es });
    } catch {
      return "Fecha no disp.";
    }
  };

  // Remaining days helper
  const getDaysRemainingInfo = (dateVal: string | Date) => {
    try {
      const targetDate = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
      const today = new Date();
      const diff = differenceInDays(targetDate, today);

      if (diff < 0) {
        return { text: `Vencido hace ${Math.abs(diff)}d`, variant: "destructive" as const, isPast: true };
      } else if (diff === 0) {
        return { text: "Vence hoy", variant: "warning" as const, isPast: false };
      } else if (diff <= 7) {
        return { text: `Vence en ${diff}d`, variant: "warning" as const, isPast: false };
      } else {
        return { text: `En ${diff} días`, variant: "default" as const, isPast: false };
      }
    } catch {
      return { text: "Fecha no disp.", variant: "default" as const, isPast: false };
    }
  };

  // Payment Badge Helper
  const getPaymentMethodBadge = (metodo: string) => {
    const m = (metodo || "transferencia").toLowerCase();
    if (m === "mercadopago") {
      return (
        <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25 border-sky-500/30 gap-1 text-[11px] font-medium">
          <Wallet className="h-3 w-3" />
          MercadoPago
        </Badge>
      );
    }
    if (m === "tarjeta") {
      return (
        <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 hover:bg-violet-500/25 border-violet-500/30 gap-1 text-[11px] font-medium">
          <CreditCard className="h-3 w-3" />
          Tarjeta
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px] font-medium">
        <Landmark className="h-3 w-3" />
        Transferencia
      </Badge>
    );
  };

  // Status Badge Helper
  const getBillingStatusBadge = (estado: string) => {
    const s = (estado || "al_dia").toLowerCase();
    if (s === "al_dia") {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30 gap-1 text-[11px] font-semibold">
          <CheckCircle2 className="h-3 w-3" />
          Al día
        </Badge>
      );
    }
    if (s === "por_vencer") {
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border-amber-500/30 gap-1 text-[11px] font-semibold">
          <Clock className="h-3 w-3" />
          Por vencer
        </Badge>
      );
    }
    if (s === "vencido") {
      return (
        <Badge variant="destructive" className="bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border-rose-500/30 gap-1 text-[11px] font-semibold">
          <AlertCircle className="h-3 w-3" />
          Vencido
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 gap-1 text-[11px] font-medium">
        Suspendida
      </Badge>
    );
  };

  // Plan Badge Helper
  const getPlanBadge = (planNombre: string) => {
    const name = (planNombre || "Starter").toLowerCase();
    if (name.includes("enterprise")) {
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold text-[11px]">
          <Sparkles className="h-3 w-3" />
          Enterprise
        </Badge>
      );
    }
    if (name.includes("pro")) {
      return (
        <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30 gap-1 font-semibold text-[11px]">
          <Zap className="h-3 w-3" />
          Pro
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 gap-1 font-medium text-[11px]">
        Starter
      </Badge>
    );
  };

  // Actions Handlers
  const handleOpenRegisterPayment = (record: BillingRecord) => {
    setSelectedRecord(record);
    setPaymentAmount(record.precioMensual);
    setPaymentMethod(record.metodoPago || "mercadopago");
    setPaymentReference(`PAY-${Date.now().toString().slice(-6)}`);
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedRecord) return;
    const updatedRecords = records.map((r) => {
      if (r.id === selectedRecord.id) {
        return {
          ...r,
          estadoPago: "al_dia",
          metodoPago: paymentMethod,
          montoUltimoPago: paymentAmount,
          ultimaFacturaRef: paymentReference,
          fechaProximoVencimiento: addMonths(new Date(), 1),
        };
      }
      return r;
    });
    setRecords(updatedRecords);
    setIsPaymentDialogOpen(false);
    appAlert.success(
      `Cobro de $${paymentAmount} USD registrado correctamente para "${selectedRecord.empresaNombre}". Próximo vencimiento actualizado.`,
      "Pago Registrado"
    );
  };

  const handleOpenChangePlan = (record: BillingRecord) => {
    setSelectedRecord(record);
    setNewPlanId(record.planId);
    setIsChangePlanDialogOpen(true);
  };

  const handleConfirmChangePlan = () => {
    if (!selectedRecord) return;
    const targetPlan = plans.find((p) => p.id === newPlanId);
    if (!targetPlan) return;

    const updatedRecords = records.map((r) => {
      if (r.id === selectedRecord.id) {
        return {
          ...r,
          planId: targetPlan.id,
          planNombre: targetPlan.nombre,
          precioMensual: targetPlan.precioMensual,
        };
      }
      return r;
    });
    setRecords(updatedRecords);
    setIsChangePlanDialogOpen(false);
    appAlert.success(
      `El plan de "${selectedRecord.empresaNombre}" se actualizó a ${targetPlan.nombre} ($${targetPlan.precioMensual} USD/mes).`,
      "Plan Actualizado"
    );
  };

  const handleSendReminder = (record: BillingRecord) => {
    appAlert.info(
      `Recordatorio de vencimiento enviado por email y WhatsApp a los contactos de "${record.empresaNombre}".`,
      "Recordatorio Enviado"
    );
  };

  const handleOpenInvoiceDetail = (record: BillingRecord) => {
    setSelectedRecord(record);
    setIsInvoiceDetailOpen(true);
  };

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({ nombre: "", minVehiculos: plans.length > 0 ? Math.max(...plans.map((p) => (p.maxVehiculos ?? p.minVehiculos) + 1), 1) : 1, maxVehiculos: "", precioMensual: 0, precioAnual: "" });
    setIsPlanDialogOpen(true);
  };
  const handleOpenEditPlan = (plan: SubscriptionPlanData) => {
    setEditingPlan(plan);
    setPlanForm({ nombre: plan.nombre, minVehiculos: plan.minVehiculos, maxVehiculos: plan.maxVehiculos ?? "", precioMensual: plan.precioMensual, precioAnual: plan.precioAnual ?? "" });
    setIsPlanDialogOpen(true);
  };
  const handleSavePlan = async () => {
    if (!planForm.nombre.trim()) { appAlert.error("Nombre requerido", "Error"); return; }
    if (planForm.minVehiculos < 1) { appAlert.error("Mínimo debe ser >=1", "Error"); return; }
    const maxVal = planForm.maxVehiculos === "" ? null : Number(planForm.maxVehiculos);
    if (maxVal != null && maxVal < planForm.minVehiculos) { appAlert.error("El máximo no puede ser menor que el mínimo", "Error"); return; }
    setIsSavingPlan(true);
    try {
      const fd = new FormData();
      fd.append("nombre", planForm.nombre.trim());
      fd.append("minVehiculos", String(planForm.minVehiculos));
      fd.append("maxVehiculos", maxVal != null ? String(maxVal) : "");
      fd.append("precioMensual", String(planForm.precioMensual));
      if (planForm.precioAnual !== "" && planForm.precioAnual != null) fd.append("precioAnual", String(planForm.precioAnual));
      if (editingPlan) {
        fd.append("id", String(editingPlan.id));
        await updateSubscriptionPlan(fd);
        appAlert.success(`Plan "${planForm.nombre}" actualizado`, "Plan actualizado");
      } else {
        await createSubscriptionPlan(fd);
        appAlert.success(`Plan "${planForm.nombre}" creado`, "Plan creado");
      }
      setIsPlanDialogOpen(false);
      // optimistic update
      window.location.reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al guardar plan";
      appAlert.error(msg, "Error");
    } finally { setIsSavingPlan(false); }
  };
  const handleDeletePlan = async (plan: SubscriptionPlanData) => {
    if (!confirm(`¿Eliminar plan "${plan.nombre}"?`)) return;
    try {
      const fd = new FormData(); fd.append("id", String(plan.id));
      await deleteSubscriptionPlan(fd);
      appAlert.success("Plan eliminado", "Eliminado");
      window.location.reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al eliminar";
      appAlert.error(msg, "Error");
    }
  };

  return (
    <div className="space-y-8">
      {/* ══════════════════════════════════════════════════════ */}
      {/* 1. FINANCIAL SAAS KPIS                                 */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MRR */}
        <Card className="border border-border/80 bg-card hover:border-primary/30 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              MRR (Ingreso Mensual)
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              ${metrics.mrr.toLocaleString("en-US")}{" "}
              <span className="text-xs font-normal text-muted-foreground">USD/mes</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                +14.2% este mes
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 border-t pt-2 font-mono">
              {metrics.activeCount} suscripciones activas
            </p>
          </CardContent>
        </Card>

        {/* Card 2: ARR */}
        <Card className="border border-border/80 bg-card hover:border-primary/30 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              ARR (Proyección Anual)
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              ${metrics.arr.toLocaleString("en-US")}{" "}
              <span className="text-xs font-normal text-muted-foreground">USD/año</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cálculo base: MRR × 12 meses
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 border-t pt-2 font-mono">
              Pipeline proyectado Q4
            </p>
          </CardContent>
        </Card>

        {/* Card 3: ARPU */}
        <Card className="border border-border/80 bg-card hover:border-primary/30 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              ARPU (Ticket Promedio)
            </CardTitle>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-foreground">
              ${metrics.arpu}{" "}
              <span className="text-xs font-normal text-muted-foreground">USD/inquilino</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ingreso medio por cliente activo
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 border-t pt-2 font-mono">
              Top Tier: Enterprise ($399)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Retención & Cobro */}
        <Card className="border border-border/80 bg-card hover:border-primary/30 transition-all shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tasa de Cobro al Día
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics.retentionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.alDiaCount} de {metrics.totalTenants} inquilinos al día
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 border-t pt-2 font-mono">
              {metrics.vencidosCount > 0 ? `${metrics.vencidosCount} pagos pendientes` : "0 moras detectadas"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 2. CATÁLOGO DE PLANES DE SUSCRIPCIÓN                   */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Catálogo de Planes Activos
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono">
                {plans.length} Planes Disponibles
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Estructura de precios, límites vehiculares y clientes asignados por plan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleOpenCreatePlan} className="h-8 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Nuevo rango
            </Button>
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border text-xs">
              <button
                onClick={() => setIsAnnualBilling(false)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  !isAnnualBilling
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setIsAnnualBilling(true)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  isAnnualBilling
                    ? "bg-background text-primary shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Anual
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  -17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plansWithTenantCounts.map((plan) => {
            const isPro = plan.nombre.toLowerCase().includes("pro");
            const isEnterprise = plan.nombre.toLowerCase().includes("enterprise");
            const price = isAnnualBilling
              ? plan.precioAnual || plan.precioMensual * 10
              : plan.precioMensual;
            const period = isAnnualBilling ? "/año" : "/mes";

            const planFeatures = plan.features || (
              isEnterprise
                ? [
                    "Flota ilimitada (100+ vehículos)",
                    "Telemetría GPS en tiempo real (5s)",
                    "Geocercas y paradas ilimitadas",
                    "Alertas automáticas por WhatsApp & Email",
                    "API & Webhooks dedicados",
                    "Detección de anomalías con IA",
                    "Soporte SLA 99.9% y Account Manager",
                  ]
                : isPro
                ? [
                    `Hasta ${plan.maxVehiculos} vehículos conectados`,
                    "Telemetría GPS de alta frecuencia",
                    "Control avanzado de combustible",
                    "Geocercas ilimitadas",
                    "Alertas instantáneas por WhatsApp",
                    "Reportes ejecutivos exportables",
                    "Soporte prioritario 24/7",
                  ]
                : [
                    `Hasta ${plan.maxVehiculos} vehículos incluidos`,
                    "Monitoreo GPS estándar (30s)",
                    "Historial de rutas (30 días)",
                    "Hasta 3 geocercas activas",
                    "Alertas básicas por Email",
                    "Soporte técnico estándar",
                  ]
            );

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between overflow-hidden border transition-all duration-200 ${
                  isPro
                    ? "border-primary shadow-md bg-gradient-to-b from-primary/5 via-card to-card ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                {isPro && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                    Más Elegido
                  </div>
                )}
                {isEnterprise && (
                  <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-b border-l border-amber-500/30 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                    Enterprise Tier
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-foreground">
                      Plan {plan.nombre}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditPlan(plan)} title="Editar rango">
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeletePlan(plan)} title="Eliminar">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    {isEnterprise
                      ? "Para empresas con flotas masivas y requerimientos de alta disponibilidad."
                      : isPro
                      ? "Ideal para empresas en expansión con necesidades de control de combustible."
                      : "Para pequeñas operaciones y monitoreo de flota inicial."}
                  </CardDescription>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tight text-foreground">
                      ${price}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      USD {period}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-primary" />
                      Rango:
                    </span>
                    <span className="font-bold text-foreground font-mono">
                      {plan.minVehiculos} - {plan.maxVehiculos ? plan.maxVehiculos : "∞"} veh.
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground text-center">
                    {plan.maxVehiculos
                      ? `De ${plan.minVehiculos} a ${plan.maxVehiculos} vehículos`
                      : `Desde ${plan.minVehiculos} vehículos (tope abierto)`}
                    <br />
                    <span className="text-[10px]">Extra: al siguiente plan</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                      Características Incluidas
                    </span>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {planFeatures.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <div className="p-4 bg-muted/20 border-t border-border mt-auto flex items-center justify-between">
                  <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      <strong className="text-foreground">{plan.tenantsCount || 0}</strong> clientes activos
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono bg-background">
                    ID #{plan.id}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 3. TABLA DE FACTURACIÓN & ESTADO DE COBROS             */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Estado de Cobros & Suscripciones de Clientes
          </h2>
          <p className="text-xs text-muted-foreground">
            Seguimiento de facturas emitidas, vencimientos próximos, pasarelas de pago y registro manual de cobranzas.
          </p>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por empresa, CUIT o factura..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border text-xs">
              <button
                onClick={() => setStatusFilter("todos")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  statusFilter === "todos"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos ({records.length})
              </button>
              <button
                onClick={() => setStatusFilter("al_dia")}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  statusFilter === "al_dia"
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Al día ({metrics.alDiaCount})
              </button>
              <button
                onClick={() => setStatusFilter("por_vencer")}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  statusFilter === "por_vencer"
                    ? "bg-background text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Por vencer ({metrics.porVencerCount})
              </button>
              <button
                onClick={() => setStatusFilter("vencido")}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  statusFilter === "vencido"
                    ? "bg-background text-rose-600 dark:text-rose-400 shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                Vencidos ({metrics.vencidosCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[260px] font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Inquilino / Empresa
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Plan SaaS
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Cuota Mensual
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Método de Pago
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Estado Cobro
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Próximo Vencimiento
                </TableHead>
                <TableHead className="text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider pr-6">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <Receipt className="h-8 w-8 text-muted-foreground/40 stroke-1" />
                      <p className="text-sm font-medium">
                        No se encontraron registros de facturación
                      </p>
                      <p className="text-xs text-muted-foreground/80 max-w-sm">
                        {searchQuery
                          ? `No hay coincidencias para "${searchQuery}".`
                          : "No hay registros con los filtros seleccionados."}
                      </p>
                      {searchQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("todos");
                            setPlanFilter("todos");
                          }}
                          className="mt-2 text-xs"
                        >
                          Limpiar Filtros
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => {
                  const daysInfo = getDaysRemainingInfo(record.fechaProximoVencimiento);
                  const isVencido = record.estadoPago.toLowerCase() === "vencido";

                  return (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      {/* Empresa / Tenant */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                            {record.empresaNombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-foreground">
                              {record.empresaNombre}
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-2">
                              <span>ID: #{record.empresaId}</span>
                              <span>•</span>
                              <span>{record.cuit || "Sin CUIT"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Plan */}
                      <TableCell>
                        <div className="space-y-1">
                          {getPlanBadge(record.planNombre)}
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {record.totalVehiculos} veh. conectados
                          </div>
                        </div>
                      </TableCell>

                      {/* Cuota */}
                      <TableCell>
                        <div className="font-bold text-sm text-foreground">
                          ${record.precioMensual}{" "}
                          <span className="text-[11px] font-normal text-muted-foreground">USD/m</span>
                        </div>
                        {record.ultimaFacturaRef && (
                          <div className="text-[10px] font-mono text-muted-foreground">
                            Ref: {record.ultimaFacturaRef}
                          </div>
                        )}
                      </TableCell>

                      {/* Método de Pago */}
                      <TableCell>{getPaymentMethodBadge(record.metodoPago)}</TableCell>

                      {/* Estado de Cobro */}
                      <TableCell>{getBillingStatusBadge(record.estadoPago)}</TableCell>

                      {/* Próximo Vencimiento */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-foreground">
                            {formatDate(record.fechaProximoVencimiento)}
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm ${
                              daysInfo.isPast
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {daysInfo.text}
                          </span>
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Registrar Pago Quick Action */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRegisterPayment(record)}
                            className="h-8 px-2.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 shadow-2xs"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Cobrar</span>
                          </Button>

                          {/* Dropdown Options */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <span className="sr-only">Opciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Facturación · {record.empresaNombre}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleOpenRegisterPayment(record)}
                                className="text-xs gap-2 cursor-pointer font-medium text-emerald-600 dark:text-emerald-400"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                Registrar Pago / Facturar
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleOpenChangePlan(record)}
                                className="text-xs gap-2 cursor-pointer"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                Cambiar Plan SaaS
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleSendReminder(record)}
                                className="text-xs gap-2 cursor-pointer"
                              >
                                <Send className="h-3.5 w-3.5 text-amber-500" />
                                Enviar Recordatorio de Pago
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleOpenInvoiceDetail(record)}
                                className="text-xs gap-2 cursor-pointer"
                              >
                                <FileCheck className="h-3.5 w-3.5" />
                                Ver Detalle / Historial
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Table Summary Footer */}
          <div className="px-6 py-3.5 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Mostrando{" "}
              <span className="font-semibold text-foreground">{filteredRecords.length}</span> de{" "}
              <span className="font-semibold text-foreground">{records.length}</span> cuentas de facturación
            </div>
            <div className="font-mono text-[11px] flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>SaaS Automated Billing Hub v1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 4. DIALOGS (PAYMENT, CHANGE PLAN, DETAILS)             */}
      {/* ══════════════════════════════════════════════════════ */}

      {/* Register Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                RECIBO MANUAL
              </Badge>
            </div>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
              Registrar Cobro de Cuota
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registra el cobro para {selectedRecord?.empresaNombre}. Se actualizará su estado a &quot;Al día&quot; y se extenderá su próximo vencimiento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Importe Recibido (USD)</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="h-9 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="mercadopago">MercadoPago (QR / Link)</option>
                <option value="transferencia">Transferencia Bancaria Directa</option>
                <option value="tarjeta">Tarjeta de Crédito / Débito</option>
                <option value="efectivo">Efectivo / Cheque</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Número de Comprobante / Referencia</label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Ej. TRANSF-89342 o MP-12903841"
                className="h-9 font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Confirmar Cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={isChangePlanDialogOpen} onOpenChange={setIsChangePlanDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Cambiar Plan de Suscripción
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecciona el nuevo nivel de servicio para {selectedRecord?.empresaNombre}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {plans.map((p) => (
              <div
                key={p.id}
                onClick={() => setNewPlanId(p.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  newPlanId === p.id
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border hover:border-border/80 bg-card"
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    Plan {p.nombre}
                    {p.id === selectedRecord?.planId && (
                      <Badge variant="outline" className="text-[10px]">Actual</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Límite: Hasta {p.maxVehiculos} vehículos
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-sm text-foreground">${p.precioMensual} USD</div>
                  <div className="text-[10px] text-muted-foreground">por mes</div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsChangePlanDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmChangePlan} className="font-semibold">
              Guardar Nuevo Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={isInvoiceDetailOpen} onOpenChange={setIsInvoiceDetailOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-[10px]">
                INFORME DE CUENTA
              </Badge>
            </div>
            <DialogTitle className="text-lg font-bold">
              Detalle de Facturación: {selectedRecord?.empresaNombre}
            </DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empresa:</span>
                  <span className="font-semibold text-foreground">{selectedRecord.empresaNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CUIT:</span>
                  <span className="font-mono font-medium">{selectedRecord.cuit || "Sin registrar"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan Contratado:</span>
                  <span>{getPlanBadge(selectedRecord.planNombre)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flota Activa:</span>
                  <span className="font-semibold">{selectedRecord.totalVehiculos} unidades conectadas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota Mensual:</span>
                  <span className="font-bold text-foreground font-mono">${selectedRecord.precioMensual} USD/mes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado Actual:</span>
                  <span>{getBillingStatusBadge(selectedRecord.estadoPago)}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-800 dark:text-blue-300">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <HelpCircle className="h-4 w-4" />
                  Próxima Fecha de Corte
                </div>
                <p className="text-[11px] leading-relaxed">
                  El ciclo de facturación se renueva el <strong>{formatDate(selectedRecord.fechaProximoVencimiento)}</strong>.
                  Las facturas automáticas se envían con 5 días de anticipación.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsInvoiceDetailOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Range Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {editingPlan ? "Editar rango" : "Nuevo rango"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Definí de cuántos a cuántos vehículos aplica y el valor. Dejá vacío el máximo para tope abierto (ej +50).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Nombre del plan</label>
              <Input value={planForm.nombre} onChange={(e) => setPlanForm({ ...planForm, nombre: e.target.value })} placeholder="Ej: Inicial, Crecimiento" className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Desde (mín)</label>
                <Input type="number" min={1} value={planForm.minVehiculos} onChange={(e) => setPlanForm({ ...planForm, minVehiculos: parseInt(e.target.value) || 1 })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Hasta (máx) — vacío = ∞</label>
                <Input type="number" placeholder="Ej: 5 o vacío para +50" value={planForm.maxVehiculos} onChange={(e) => setPlanForm({ ...planForm, maxVehiculos: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Precio mensual (ARS)</label>
                <Input type="number" value={planForm.precioMensual} onChange={(e) => setPlanForm({ ...planForm, precioMensual: parseFloat(e.target.value) || 0 })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Precio anual (opcional)</label>
                <Input type="number" value={planForm.precioAnual} onChange={(e) => setPlanForm({ ...planForm, precioAnual: e.target.value })} className="h-9" placeholder="Ej: 399900" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border">
              Ej: 1-5 $39990, 6-15 $64900, 50-∞ $199900. Si una empresa supera el máximo, se cobra la diferencia en la siguiente cuota al valor del siguiente plan.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePlan} disabled={isSavingPlan} className="font-semibold">
              {isSavingPlan ? "Guardando..." : editingPlan ? "Guardar cambios" : "Crear plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
