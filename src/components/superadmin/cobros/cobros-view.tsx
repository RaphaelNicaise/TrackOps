"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
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
  Search,
  X,
  Calendar,
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
  History,
  ChevronRight,
} from "lucide-react";
import { appAlert } from "@/lib/alerts";
import { format, addMonths, subMonths, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export interface PaymentHistoryItem {
  id: number | string;
  referenciaFactura: string;
  fechaPago: string | Date;
  periodo: string;
  monto: number;
  moneda?: string;
  metodoPago: "mercadopago" | "transferencia" | "tarjeta" | "efectivo" | string;
  estado: "APROBADO" | "PENDIENTE" | "REEMBOLSADO" | string;
  notas?: string;
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
  moneda?: string;
  estadoPago: "al_dia" | "por_vencer" | "vencido" | "suspendida" | string;
  metodoPago: "mercadopago" | "transferencia" | "tarjeta" | "efectivo" | string;
  fechaInicio: string | Date;
  fechaProximoVencimiento: string | Date;
  totalVehiculos: number;
  ultimaFacturaRef?: string;
  montoUltimoPago?: number;
  historialPagos?: PaymentHistoryItem[];
}

export function generatePaymentHistoryForRecord(record: BillingRecord): PaymentHistoryItem[] {
  if (record.historialPagos && record.historialPagos.length > 0) {
    return record.historialPagos;
  }
  const items: PaymentHistoryItem[] = [];
  const baseDate = new Date();

  // Create realistic historical monthly payments
  const offsets = [0, 1, 2, 3];
  offsets.forEach((mOffset, idx) => {
    const payDate = subMonths(baseDate, mOffset);
    const ref = `FAC-${format(payDate, "yyyy-MM")}${String(record.empresaId).padStart(2, "0")}${idx + 1}`;
    const periodo = format(payDate, "MMMM yyyy", { locale: es });

    items.push({
      id: `${record.id}-hist-${idx}`,
      referenciaFactura: idx === 0 && record.ultimaFacturaRef ? record.ultimaFacturaRef : ref,
      fechaPago: payDate,
      periodo: periodo.charAt(0).toUpperCase() + periodo.slice(1),
      monto: record.precioMensual || 39990,
      moneda: record.moneda || "ARS",
      metodoPago: record.metodoPago || "transferencia",
      estado: idx === 0 && record.estadoPago === "vencido" ? "PENDIENTE" : "APROBADO",
      notas: `Abono mensual recurrente Plan ${record.planNombre}`,
    });
  });
  return items;
}

interface CobrosViewProps {
  records: BillingRecord[];
}

export function CobrosView({ records: initialRecords = [] }: CobrosViewProps) {
  const [records, setRecords] = useState<BillingRecord[]>(() =>
    initialRecords.map((r) => ({
      ...r,
      historialPagos: generatePaymentHistoryForRecord(r),
    }))
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Payment History Sheet state
  const [historyRecord, setHistoryRecord] = useState<BillingRecord | null>(null);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);

  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<{
    empresaNombre: string;
    cuit: string | null;
    planNombre: string;
    precioMensual: number;
    totalVehiculos: number;
    ultimaFacturaRef: string;
    fechaPago: string | Date;
    metodoPago: string;
  } | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Manual payment registration modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payingRecord, setPayingRecord] = useState<BillingRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("transferencia");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // FINANCIAL KPIs CALCULATIONS
  const kpis = useMemo(() => {
    const totalTenants = records.length;
    const activeTenants = records.filter((r) => r.estadoPago !== "suspendida").length;

    // Monthly Recurring Revenue (MRR)
    const mrr = records.reduce((acc, r) => {
      if (r.estadoPago === "suspendida") return acc;
      return acc + (r.precioMensual || 0);
    }, 0);

    // Annual Recurring Revenue (ARR)
    const arr = mrr * 12;

    // Average Revenue Per User/Tenant (ARPU)
    const arpu = activeTenants > 0 ? Math.round(mrr / activeTenants) : 0;

    // Collection rate & status breakdown
    const upToDateTenants = records.filter((r) => r.estadoPago === "al_dia").length;
    const warningTenants = records.filter((r) => r.estadoPago === "por_vencer").length;
    const overdueTenants = records.filter((r) => r.estadoPago === "vencido").length;
    const suspendedTenants = records.filter((r) => r.estadoPago === "suspendida").length;

    const collectionRate = totalTenants > 0 ? Math.round((upToDateTenants / totalTenants) * 100) : 100;

    return {
      mrr,
      arr,
      arpu,
      collectionRate,
      totalTenants,
      activeTenants,
      upToDateTenants,
      warningTenants,
      overdueTenants,
      suspendedTenants,
    };
  }, [records]);

  // FILTERED RECORDS
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.empresaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.cuit && r.cuit.includes(searchTerm)) ||
        (r.ultimaFacturaRef && r.ultimaFacturaRef.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === "todos" ||
        (statusFilter === "al_dia" && r.estadoPago === "al_dia") ||
        (statusFilter === "por_vencer" && r.estadoPago === "por_vencer") ||
        (statusFilter === "vencido" && r.estadoPago === "vencido") ||
        (statusFilter === "suspendida" && r.estadoPago === "suspendida");

      return matchSearch && matchStatus;
    });
  }, [records, searchTerm, statusFilter]);

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
    if (s === "al_dia" || s === "aprobado") {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Al día
        </Badge>
      );
    }
    if (s === "por_vencer") {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold">
          <Clock className="h-3.5 w-3.5" />
          Por vencer
        </Badge>
      );
    }
    if (s === "vencido" || s === "pendiente") {
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1 font-semibold">
          <AlertCircle className="h-3.5 w-3.5" />
          Vencido
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 gap-1 font-semibold">
        Suspendida
      </Badge>
    );
  };

  // Handlers for Payments & Receipts
  const handleOpenHistory = (record: BillingRecord) => {
    setHistoryRecord(record);
    setHistorySheetOpen(true);
  };

  const handleOpenRegisterPayment = (record: BillingRecord) => {
    setPayingRecord(record);
    setPaymentAmount(record.precioMensual);
    setPaymentMethod(record.metodoPago || "transferencia");
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;
    setIsProcessingPayment(true);

    try {
      await new Promise((res) => setTimeout(res, 400));

      const newDueDate = addMonths(new Date(payingRecord.fechaProximoVencimiento), 1);
      const newRef = `FAC-${format(new Date(), "yyyy-MM")}${Math.floor(100 + Math.random() * 900)}`;
      const currentPeriod = format(new Date(), "MMMM yyyy", { locale: es });

      const newPaymentItem: PaymentHistoryItem = {
        id: `pay-${Date.now()}`,
        referenciaFactura: newRef,
        fechaPago: new Date(),
        periodo: currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1),
        monto: paymentAmount,
        moneda: "ARS",
        metodoPago: paymentMethod,
        estado: "APROBADO",
        notas: "Cobro manual registrado por Superadmin",
      };

      const updatedRecords = records.map((r) => {
        if (r.id === payingRecord.id) {
          const currentHistory = r.historialPagos || generatePaymentHistoryForRecord(r);
          return {
            ...r,
            estadoPago: "al_dia",
            fechaProximoVencimiento: newDueDate,
            ultimaFacturaRef: newRef,
            montoUltimoPago: paymentAmount,
            metodoPago: paymentMethod,
            historialPagos: [newPaymentItem, ...currentHistory],
          };
        }
        return r;
      });

      setRecords(updatedRecords);

      // If history sheet is open, update historyRecord as well
      if (historyRecord && historyRecord.id === payingRecord.id) {
        setHistoryRecord({
          ...historyRecord,
          estadoPago: "al_dia",
          fechaProximoVencimiento: newDueDate,
          ultimaFacturaRef: newRef,
          montoUltimoPago: paymentAmount,
          metodoPago: paymentMethod,
          historialPagos: [
            newPaymentItem,
            ...(historyRecord.historialPagos || generatePaymentHistoryForRecord(historyRecord)),
          ],
        });
      }

      appAlert.success(`Pago de $${paymentAmount.toLocaleString("es-AR")} registrado para ${payingRecord.empresaNombre}`);
      setPaymentModalOpen(false);
    } catch {
      appAlert.error("Error al registrar el cobro");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleViewReceiptFromRecord = (record: BillingRecord) => {
    setSelectedReceipt({
      empresaNombre: record.empresaNombre,
      cuit: record.cuit,
      planNombre: record.planNombre,
      precioMensual: record.precioMensual,
      totalVehiculos: record.totalVehiculos,
      ultimaFacturaRef: record.ultimaFacturaRef || "FAC-2026-0801",
      fechaPago: new Date(),
      metodoPago: record.metodoPago,
    });
    setReceiptModalOpen(true);
  };

  const handleViewReceiptFromHistoryItem = (empresa: BillingRecord, item: PaymentHistoryItem) => {
    setSelectedReceipt({
      empresaNombre: empresa.empresaNombre,
      cuit: empresa.cuit,
      planNombre: empresa.planNombre,
      precioMensual: item.monto,
      totalVehiculos: empresa.totalVehiculos,
      ultimaFacturaRef: item.referenciaFactura,
      fechaPago: item.fechaPago,
      metodoPago: item.metodoPago,
    });
    setReceiptModalOpen(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 4 TARJETAS MÉTRICAS KPI FINANCIERAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: MRR */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              MRR (Ingreso Mensual)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-extrabold text-foreground font-mono">
              ${kpis.mrr.toLocaleString("es-AR")}
              <span className="text-xs font-normal text-muted-foreground ml-1">ARS/mes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>{kpis.activeTenants} clientes activos facturando</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: ARR */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              ARR (Proyección Anual)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-extrabold text-foreground font-mono">
              ${kpis.arr.toLocaleString("es-AR")}
              <span className="text-xs font-normal text-muted-foreground ml-1">ARS/año</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              <span>MRR x 12 meses de recurrencia</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: ARPU */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              ARPU (Ticket Promedio)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-extrabold text-foreground font-mono">
              ${kpis.arpu.toLocaleString("es-AR")}
              <span className="text-xs font-normal text-muted-foreground ml-1">ARS/inquilino</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              <span>Promedio por cuenta activa</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Tasa de Cobro al Día */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tasa de Cobro al Día
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-extrabold text-foreground font-mono flex items-baseline gap-2">
              <span>{kpis.collectionRate}%</span>
              <span className="text-xs font-medium text-muted-foreground">
                ({kpis.upToDateTenants}/{kpis.totalTenants})
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              {kpis.overdueTenants > 0 ? (
                <span className="text-rose-600 font-semibold">{kpis.overdueTenants} vencido(s)</span>
              ) : (
                <span className="text-emerald-600 font-medium">Sin cobros vencidos</span>
              )}
              {kpis.warningTenants > 0 && (
                <span className="text-amber-600 font-medium">• {kpis.warningTenants} por vencer</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN TABLA DE COBROS & FACTURACIÓN POR EMPRESA */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              Cobranzas & Suscripciones de Empresas
              <Badge variant="outline" className="font-mono text-xs">
                {filteredRecords.length} inquilinos
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Haz clic en cualquier empresa para ver su historial completo de pagos y recibos
            </p>
          </div>

          {/* FILTROS DE ESTADO */}
          <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("todos")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                statusFilter === "todos" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("al_dia")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                statusFilter === "al_dia" ? "bg-background text-emerald-600 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Al día ({kpis.upToDateTenants})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("por_vencer")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                statusFilter === "por_vencer" ? "bg-background text-amber-600 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Por vencer ({kpis.warningTenants})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("vencido")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                statusFilter === "vencido" ? "bg-background text-rose-600 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Vencidos ({kpis.overdueTenants})
            </button>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por inquilino, CUIT o ref. factura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* TABLA DE INQUILINOS Y COBROS */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Inquilino / Empresa</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Plan SaaS</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Cuota Mensual</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Método de Pago</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Estado Cobro</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Próximo Vencimiento</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                    No se encontraron registros de cobros coincidentes con los filtros.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r) => {
                  const daysInfo = getDaysRemainingInfo(r.fechaProximoVencimiento);

                  return (
                    <TableRow
                      key={r.id}
                      className="hover:bg-muted/50 cursor-pointer transition group"
                      onClick={() => handleOpenHistory(r)}
                      title="Haz clic para ver el historial de pagos de esta empresa"
                    >
                      <TableCell>
                        <div className="font-bold text-sm text-foreground flex items-center gap-1.5 group-hover:text-primary transition">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary" />
                          <span>{r.empresaNombre}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition ml-0.5" />
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          CUIT: {r.cuit || "Sin CUIT"} • {r.totalVehiculos} vehículos activos
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-semibold text-xs">
                          {r.planNombre}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold text-foreground">
                        ${r.precioMensual.toLocaleString("es-AR")}
                        <span className="text-[10px] text-muted-foreground font-normal ml-1">ARS</span>
                      </TableCell>
                      <TableCell className="text-center">{getPaymentMethodBadge(r.metodoPago)}</TableCell>
                      <TableCell className="text-center">{getBillingStatusBadge(r.estadoPago)}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono text-xs font-semibold text-foreground">
                          {formatDate(r.fechaProximoVencimiento)}
                        </div>
                        <div
                          className={`text-[10px] font-medium ${
                            daysInfo.isPast
                              ? "text-rose-600 font-bold"
                              : daysInfo.variant === "warning"
                              ? "text-amber-600 font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {daysInfo.text}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                            onClick={() => handleOpenRegisterPayment(r)}
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Cobrar</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs">Opciones de Cobro</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleOpenHistory(r)} className="cursor-pointer gap-2">
                                <History className="h-4 w-4 text-primary" />
                                <span>Historial de Pagos</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewReceiptFromRecord(r)} className="cursor-pointer gap-2">
                                <Receipt className="h-4 w-4 text-primary" />
                                <span>Ver Último Comprobante</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenRegisterPayment(r)} className="cursor-pointer gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                <span>Registrar Pago</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => appAlert.info(`Recordatorio de cobro enviado a ${r.empresaNombre}`)}
                                className="cursor-pointer gap-2"
                              >
                                <Send className="h-4 w-4 text-muted-foreground" />
                                <span>Enviar Recordatorio</span>
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
        </div>
      </div>

      {/* MODAL CENTRADO: HISTORIAL DE PAGOS DE LA EMPRESA */}
      <Dialog open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[88vh] overflow-hidden p-0 flex flex-col">
          {historyRecord && (
            <>
              <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
                        {historyRecord.empresaNombre}
                      </DialogTitle>
                      <DialogDescription className="text-xs font-mono mt-0.5">
                        CUIT: {historyRecord.cuit || "Sin CUIT"} • ID #{historyRecord.empresaId} • {historyRecord.totalVehiculos} vehículos activos
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                      onClick={() => handleOpenRegisterPayment(historyRecord)}
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Registrar Cobro</span>
                    </Button>
                  </div>
                </div>

                {/* RESUMEN DE SUSCRIPCIÓN EN TARJETAS COMPACTAS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
                  <div className="p-3 rounded-lg bg-card border text-xs shadow-2xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Plan Contratado</span>
                    <span className="font-bold text-foreground text-sm">{historyRecord.planNombre}</span>
                    <span className="block text-[11px] text-muted-foreground font-mono">
                      ${historyRecord.precioMensual.toLocaleString("es-AR")} ARS/mes
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border text-xs shadow-2xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Estado de Cuenta</span>
                    <div className="mt-1">{getBillingStatusBadge(historyRecord.estadoPago)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-card border text-xs shadow-2xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Método Activo</span>
                    <div className="mt-1">{getPaymentMethodBadge(historyRecord.metodoPago)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-card border text-xs shadow-2xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Próx. Vencimiento</span>
                    <span className="font-bold text-foreground font-mono text-sm block">
                      {formatDate(historyRecord.fechaProximoVencimiento)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {getDaysRemainingInfo(historyRecord.fechaProximoVencimiento).text}
                    </span>
                  </div>
                </div>
              </DialogHeader>

              {/* LISTA / TABLA COMPLETA DE PAGOS HISTÓRICOS */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      Historial Completo de Pagos & Comprobantes Fiscales
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Registro cronológico de cuotas mensuales abonadas y pendientes de la empresa
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {(historyRecord.historialPagos || []).length} comprobantes
                  </Badge>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-xs uppercase tracking-wider font-semibold">N° Comprobante</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider font-semibold">Período Fiscal</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider font-semibold">Fecha de Pago</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Monto</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Método</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Estado</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider font-semibold text-right pr-4">Recibo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(historyRecord.historialPagos || []).map((pay) => (
                        <TableRow key={pay.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="font-mono text-xs font-bold text-foreground">
                              {pay.referenciaFactura}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {pay.notas || "Abono de suscripción mensual"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-xs text-foreground">{pay.periodo}</span>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-mono text-foreground">
                              {formatDate(pay.fechaPago)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                            ${pay.monto.toLocaleString("es-AR")}
                            <span className="text-[10px] text-muted-foreground font-normal ml-0.5">ARS</span>
                          </TableCell>
                          <TableCell className="text-center">{getPaymentMethodBadge(pay.metodoPago)}</TableCell>
                          <TableCell className="text-center">
                            {pay.estado === "APROBADO" ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] gap-1 font-semibold">
                                <CheckCircle2 className="h-3 w-3" />
                                Aprobado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] gap-1 font-semibold">
                                Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10 font-semibold"
                              onClick={() => handleViewReceiptFromHistoryItem(historyRecord, pay)}
                              title="Ver Comprobante de Pago"
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              <span>Ver Recibo</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHistorySheetOpen(false)}
                >
                  Cerrar
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      if (historyRecord) {
                        handleViewReceiptFromRecord(historyRecord);
                      }
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Última Factura</span>
                  </Button>
                  <Button
                    type="button"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                    onClick={() => handleOpenRegisterPayment(historyRecord)}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Registrar Nuevo Cobro</span>
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL REGISTRAR COBRO / PAGO MANUAL */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleConfirmPayment}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Registrar Cobro de Suscripción
              </DialogTitle>
              <DialogDescription>
                Registra la recepción del pago para renovar el período mensual de la empresa cliente.
              </DialogDescription>
            </DialogHeader>

            {payingRecord && (
              <div className="space-y-4 py-4">
                <div className="p-3 rounded-lg bg-muted/40 border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inquilino:</span>
                    <span className="font-bold text-foreground">{payingRecord.empresaNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan asignado:</span>
                    <span className="font-semibold text-foreground">{payingRecord.planNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vencimiento previo:</span>
                    <span className="font-mono text-foreground">{formatDate(payingRecord.fechaProximoVencimiento)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Monto Percibido ($ ARS) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Método de Pago *
                  </label>
                  <NativeSelect
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    sizeVariant="lg"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="mercadopago">MercadoPago</option>
                    <option value="tarjeta">Tarjeta de Crédito / Débito</option>
                    <option value="efectivo">Efectivo / Cheque</option>
                  </NativeSelect>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isProcessingPayment} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                {isProcessingPayment ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Confirmar Cobro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL VISOR DE COMPROBANTE / FACTURA */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Comprobante de Servicio SaaS
            </DialogTitle>
            <DialogDescription>
              Detalle fiscal y operativo de la suscripción TrackOps Flota.
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4 py-3 text-xs font-sans">
              <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">TRACKOPS LOGISTICS PLATFORM</h3>
                    <p className="text-[11px] text-muted-foreground">Superadmin SaaS Billing Hub</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">CUIT: 30-99887766-1 • IVA Responsable Inscripto</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedReceipt.ultimaFacturaRef || "FAC-2026-0801"}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">Fecha: {formatDate(selectedReceipt.fechaPago)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-1">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">CLIENTE FACTURADO:</span>
                    <span className="font-bold text-foreground">{selectedReceipt.empresaNombre}</span>
                    <span className="block text-muted-foreground text-[11px] font-mono">CUIT: {selectedReceipt.cuit || "—"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[10px]">MÉTODO DE PAGO:</span>
                    <span className="font-semibold text-foreground uppercase text-[11px]">{selectedReceipt.metodoPago}</span>
                    <span className="block text-muted-foreground text-[11px]">Servicio Activo</span>
                  </div>
                </div>

                <div className="border rounded bg-background p-2.5 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span>Abono Mensual Plan {selectedReceipt.planNombre}</span>
                    <span className="font-mono">${selectedReceipt.precioMensual.toLocaleString("es-AR")} ARS</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex justify-between">
                    <span>Flota monitoreada: {selectedReceipt.totalVehiculos} unidades activas</span>
                    <span>Incluido</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t font-bold text-sm">
                  <span>Total Período</span>
                  <span className="font-mono text-base text-emerald-600">${selectedReceipt.precioMensual.toLocaleString("es-AR")} ARS</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handlePrintReceipt} className="gap-1.5">
              <Download className="h-4 w-4" />
              <span>Imprimir / PDF</span>
            </Button>
            <Button onClick={() => setReceiptModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
