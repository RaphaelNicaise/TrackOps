"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Sparkles,
  Zap,
  Truck,
  Users,
  Bell,
  Key,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Power,
  PowerOff,
  Edit2,
  Loader2,
  ExternalLink,
  Gauge,
  Sliders,
  ShieldAlert,
  Search,
  Car,
  Bus,
  Wrench,
} from "lucide-react";
import {
  getEmpresaDetail360,
  resetTenantUserPassword,
  toggleEmpresaStatus,
  enterTenantAsSuperadmin,
} from "@/lib/admin-actions";
import { EmpresaDetail360Data } from "@/types/admin";
import { EmpresaFormData } from "./empresa-form-dialog";
import { appAlert } from "@/lib/alerts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmpresaDetailSheetProps {
  empresaId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditEmpresa?: (empresa: EmpresaFormData) => void;
  onStatusChanged?: (empresaId: number, newStatus: string) => void;
}

export function EmpresaDetailSheet({
  empresaId,
  open,
  onOpenChange,
  onEditEmpresa,
  onStatusChanged,
}: EmpresaDetailSheetProps) {
  const [data, setData] = useState<EmpresaDetail360Data | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");

  // Loading states for actions
  const [isEnteringTenant, setIsEnteringTenant] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Search in Fleet
  const [fleetSearch, setFleetSearch] = useState("");

  // Password Reset Modal State
  const [resettingUser, setResettingUser] = useState<{
    id: string;
    name: string | null;
    email: string | null;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Reset Success Credentials Dialog
  const [resetSuccessData, setResetSuccessData] = useState<{
    user: { name: string | null; email: string | null };
    password: string;
  } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Load 360 data when opened
  const loadDetail = async (id: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getEmpresaDetail360(id);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setErrorMsg("No se pudieron cargar los datos de la empresa.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al obtener la ficha 360°.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && empresaId) {
      loadDetail(empresaId);
      setActiveTab("general");
    } else {
      setData(null);
      setErrorMsg(null);
    }
  }, [open, empresaId]);

  // Formatter helper
  const formatDate = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return "Sin fecha";
    try {
      const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
      if (isNaN(d.getTime())) return "Sin fecha";
      return format(d, "dd MMM yyyy", { locale: es });
    } catch {
      return "Sin fecha";
    }
  };

  // Avatar color generator
  const getAvatarBg = (name: string) => {
    const colors = [
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  // Launch Superpoderes
  const handleLaunchSuperpoderes = async () => {
    if (!data?.empresa.id) return;
    setIsEnteringTenant(true);
    try {
      await enterTenantAsSuperadmin(data.empresa.id);
      appAlert.success(
        `Ingresando a "${data.empresa.nombre}" en Modo Superpoderes...`,
        "⚡ Superpoderes Activados"
      );
      window.location.href = "/dashboard/monitoreo/dashboard";
    } catch (err: any) {
      appAlert.error(err?.message || "Error al acceder como empresa.");
      setIsEnteringTenant(false);
    }
  };

  // Toggle company status
  const handleToggleCompanyStatus = async () => {
    if (!data?.empresa.id) return;
    const currentStatus = (data.subscription?.estado || "activa") as
      | "activa"
      | "suspendida";
    const newStatus = currentStatus === "activa" ? "suspendida" : "activa";

    setIsTogglingStatus(true);
    try {
      const formData = new FormData();
      formData.append("empresaId", data.empresa.id.toString());
      formData.append("estado", newStatus);

      await toggleEmpresaStatus(formData);

      setData((prev) =>
        prev
          ? {
              ...prev,
              subscription: prev.subscription
                ? { ...prev.subscription, estado: newStatus }
                : null,
            }
          : null
      );

      onStatusChanged?.(data.empresa.id, newStatus);

      if (newStatus === "activa") {
        appAlert.success(
          `La empresa "${data.empresa.nombre}" fue reactivada exitosamente.`,
          "Empresa Reactivada"
        );
      } else {
        appAlert.warning(
          `La empresa "${data.empresa.nombre}" ha sido suspendida.`,
          "Empresa Suspendida"
        );
      }
    } catch (err: any) {
      appAlert.error(err?.message || "Error al modificar estado de la empresa.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Open password reset modal for user
  const handleOpenPasswordReset = (user: {
    id: string;
    name: string | null;
    email: string | null;
  }) => {
    setResettingUser(user);
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setShowPassword(true);
    setResetError(null);
  };

  const handleGenerateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setShowPassword(true);
  };

  // Submit Password Reset
  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (!newPassword || newPassword.length < 8) {
      setResetError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Las contraseñas no coinciden.");
      return;
    }

    setIsResettingPassword(true);
    setResetError(null);

    try {
      const formData = new FormData();
      formData.append("userId", resettingUser.id);
      formData.append("newPassword", newPassword);

      const res = await resetTenantUserPassword(formData);
      if (res.success) {
        // Update user state locally to reflect mustChangePassword = 1
        setData((prev) =>
          prev
            ? {
                ...prev,
                users: prev.users.map((u) =>
                  u.id === resettingUser.id
                    ? { ...u, mustChangePassword: 1 }
                    : u
                ),
              }
            : null
        );

        setResetSuccessData({
          user: resettingUser,
          password: newPassword,
        });
        setResettingUser(null);
        appAlert.success(
          `Contraseña restablecida correctamente para ${resettingUser.email}`,
          "Contraseña Actualizada"
        );
      }
    } catch (err: any) {
      setResetError(
        err?.message || "Error al intentar restablecer la contraseña."
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Copy credentials helper
  const handleCopyCredentials = () => {
    if (!resetSuccessData) return;
    const text = [
      `===========================================`,
      `TrackOps - Credenciales de Acceso`,
      `Empresa: ${data?.empresa.nombre || "TrackOps"}`,
      `Usuario: ${resetSuccessData.user.name || "Usuario"}`,
      `Email: ${resetSuccessData.user.email}`,
      `Nueva Contraseña: ${resetSuccessData.password}`,
      `===========================================`,
      `* Nota: Deberás cambiar esta contraseña en tu primer inicio de sesión.`,
      `Acceso: ${typeof window !== "undefined" ? window.location.origin : ""}/login`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setHasCopied(true);
    appAlert.success(
      "Credenciales copiadas al portapapeles.",
      "Copiado Exitoso"
    );
    setTimeout(() => setHasCopied(false), 3000);
  };

  // Fleet stats breakdown
  const fleetBreakdown = useMemo(() => {
    if (!data?.vehicles) return { total: 0, camiones: 0, buses: 0, utilitarios: 0, autos: 0, otros: 0 };
    const total = data.vehicles.length;
    let camiones = 0;
    let buses = 0;
    let utilitarios = 0;
    let autos = 0;
    let otros = 0;

    data.vehicles.forEach((v) => {
      const tipo = (v.tipo || "camion").toLowerCase();
      if (tipo.includes("camion") || tipo.includes("camión")) camiones++;
      else if (tipo.includes("bus") || tipo.includes("colectivo")) buses++;
      else if (tipo.includes("util") || tipo.includes("furgon")) utilitarios++;
      else if (tipo.includes("auto")) autos++;
      else otros++;
    });

    return { total, camiones, buses, utilitarios, autos, otros };
  }, [data?.vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    if (!data?.vehicles) return [];
    if (!fleetSearch.trim()) return data.vehicles;
    const q = fleetSearch.toLowerCase();
    return data.vehicles.filter(
      (v) =>
        v.patente.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        (v.tipo && v.tipo.toLowerCase().includes(q))
    );
  }, [data?.vehicles, fleetSearch]);

  // Initials
  const empresaInitials =
    ((data?.empresa?.nombre || "")
      .split(" ")
      .filter(Boolean)
      .map((w) => (w ? w[0] : ""))
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()) || "EM";

  const isActiva = (data?.subscription?.estado || "activa") === "activa";

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px]">
            <Sparkles className="h-3 w-3" />
            Super Admin
          </Badge>
        );
      case "ADMIN_EMPRESA":
        return (
          <Badge className="bg-primary/15 text-primary border-primary/30 gap-1 text-[11px]">
            <ShieldCheck className="h-3 w-3" />
            Admin Empresa
          </Badge>
        );
      case "VENDEDOR_INSTALADOR":
        return (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 gap-1 text-[11px]">
            <Wrench className="h-3 w-3" />
            Instalador / GPS
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1 text-[11px]">
            <Truck className="h-3 w-3" />
            Chofer
          </Badge>
        );
    }
  };

  const getVehicleTypeBadge = (tipo?: string | null) => {
    const t = (tipo || "camion").toLowerCase();
    if (t.includes("bus")) {
      return (
        <Badge variant="outline" className="text-[11px] gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
          <Bus className="h-3 w-3" />
          Bus
        </Badge>
      );
    }
    if (t.includes("util") || t.includes("furgon")) {
      return (
        <Badge variant="outline" className="text-[11px] gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
          <Car className="h-3 w-3" />
          Utilitario
        </Badge>
      );
    }
    if (t.includes("auto")) {
      return (
        <Badge variant="outline" className="text-[11px] gap-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
          <Car className="h-3 w-3" />
          Auto
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[11px] gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
        <Truck className="h-3 w-3" />
        Camión
      </Badge>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl md:max-w-3xl p-0 flex flex-col h-full bg-background border-l border-border shadow-2xl overflow-hidden"
        >
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 p-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Cargando Ficha 360° del Tenant...
              </p>
              <p className="text-xs text-muted-foreground">
                Consultando base de datos, flota, suscripción y credenciales
              </p>
            </div>
          ) : errorMsg || !data ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive/80" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Error al cargar información
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {errorMsg || "No se encontró el registro solicitado."}
                </p>
              </div>
              {empresaId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadDetail(empresaId)}
                  className="text-xs gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reintentar
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* ═══════════ TOP BANNER ═══════════ */}
              <div className="bg-card border-b border-border p-6 pb-5 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Avatar + Title + Badges */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 shadow-xs ${getAvatarBg(
                        data.empresa.nombre
                      )}`}
                    >
                      {empresaInitials}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-foreground truncate tracking-tight">
                          {data.empresa.nombre}
                        </h2>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] bg-muted/60"
                        >
                          #{data.empresa.id}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                        <span className="font-mono">
                          CUIT: {data.empresa.cuit || "Sin CUIT"}
                        </span>
                        <span>•</span>
                        {isActiva ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30 gap-1 text-[10px] px-2 py-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Activa
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border-rose-500/30 gap-1 text-[10px] px-2 py-0"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                            Suspendida
                          </Badge>
                        )}
                        <span>•</span>
                        <span className="text-[11px]">
                          Plan:{" "}
                          <strong className="text-foreground font-semibold">
                            {data.subscription?.planNombre || "Starter"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Superpoderes Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={handleLaunchSuperpoderes}
                      disabled={isEnteringTenant}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs gap-1.5 shadow-sm border border-amber-400/30 transition-all hover:scale-[1.02]"
                    >
                      {isEnteringTenant ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Conectando...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5 fill-current" />
                          <span>⚡ Superpoderes</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* ═══════════ TABS NAVIGATION ═══════════ */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="px-6 border-b border-border bg-muted/20 shrink-0">
                  <TabsList className="h-11 bg-transparent p-0 gap-4 border-none">
                    <TabsTrigger
                      value="general"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-semibold text-xs px-1 pb-3 pt-3 flex items-center gap-1.5"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      General
                    </TabsTrigger>
                    <TabsTrigger
                      value="flota"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-semibold text-xs px-1 pb-3 pt-3 flex items-center gap-1.5"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      Flota ({data.vehicles.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="usuarios"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-semibold text-xs px-1 pb-3 pt-3 flex items-center gap-1.5"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Usuarios ({data.users.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="alertas"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-semibold text-xs px-1 pb-3 pt-3 flex items-center gap-1.5"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Alertas
                    </TabsTrigger>
                    <TabsTrigger
                      value="control"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-semibold text-xs px-1 pb-3 pt-3 flex items-center gap-1.5"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      Control
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* ═══════════ TAB CONTENTS (SCROLLABLE) ═══════════ */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* TAB 1: GENERAL */}
                  <TabsContent value="general" className="m-0 space-y-5">
                    {/* Setup Status Banner */}
                    <div className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <span>Estado del Setup & Onboarding</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Indica si la empresa completó el asistente de bienvenida y carga inicial.
                        </p>
                      </div>
                      <div>
                        {data.empresa.setupCompletado === 1 ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 text-xs font-semibold py-1 px-3">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completado
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 text-xs font-semibold py-1 px-3"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            Pendiente
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Grid: Company Details & Subscription Plan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Card 1: Contact & Location */}
                      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                          <Building2 className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Información de Contacto
                          </h4>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" /> Email
                            </span>
                            <span className="font-medium text-foreground">
                              {data.empresa.email || "No registrado"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" /> Teléfono
                            </span>
                            <span className="font-medium text-foreground">
                              {data.empresa.telefono || "No registrado"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" /> Dirección
                            </span>
                            <span className="font-medium text-foreground text-right max-w-[200px] truncate">
                              {data.empresa.direccion || "No registrada"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5" /> Ciudad / Prov.
                            </span>
                            <span className="font-medium text-foreground">
                              {[data.empresa.ciudad, data.empresa.provincia]
                                .filter(Boolean)
                                .join(", ") || "No especificada"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/40">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" /> Fecha Registro
                            </span>
                            <span className="font-mono text-muted-foreground">
                              {formatDate(data.empresa.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Subscription & Limits */}
                      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Plan & Facturación
                          </h4>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Plan Contratado</span>
                            <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold text-xs">
                              {data.subscription?.planNombre || "Starter"}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Capacidad Máxima</span>
                            <span className="font-semibold text-foreground">
                              {data.subscription?.maxVehiculos
                                ? `${data.subscription.maxVehiculos} vehículos`
                                : "Ilimitados"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Uso de Flota</span>
                            <span className="font-semibold text-foreground">
                              {data.vehicles.length} / {data.subscription?.maxVehiculos || "∞"} unidades
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Precio Mensual</span>
                            <span className="font-semibold text-foreground">
                              {data.subscription?.precioMensual != null
                                ? `$${data.subscription.precioMensual} USD/mes`
                                : "A medida"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/40">
                            <span className="text-muted-foreground">Inicio Suscripción</span>
                            <span className="font-mono text-muted-foreground">
                              {formatDate(data.subscription?.fechaInicio)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 2: FLOTA */}
                  <TabsContent value="flota" className="m-0 space-y-4">
                    {/* Fleet KPI Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                          Total Unidades
                        </span>
                        <div className="text-xl font-bold text-foreground flex items-center gap-2">
                          <Truck className="h-4 w-4 text-primary" />
                          {fleetBreakdown.total}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                          Camiones
                        </span>
                        <div className="text-xl font-bold text-foreground">
                          {fleetBreakdown.camiones}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                          Utilitarios / Autos
                        </span>
                        <div className="text-xl font-bold text-foreground">
                          {fleetBreakdown.utilitarios + fleetBreakdown.autos}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                          Buses / Otros
                        </span>
                        <div className="text-xl font-bold text-foreground">
                          {fleetBreakdown.buses + fleetBreakdown.otros}
                        </div>
                      </div>
                    </div>

                    {/* Fleet Search Toolbar */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Buscar por patente, marca o modelo..."
                          value={fleetSearch}
                          onChange={(e) => setFleetSearch(e.target.value)}
                          className="pl-8 h-8 text-xs"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {filteredVehicles.length} de {data.vehicles.length} vehículos
                      </div>
                    </div>

                    {/* Vehicles Table */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      {filteredVehicles.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <Truck className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                          <p className="text-xs font-semibold text-foreground">
                            {fleetSearch
                              ? "No hay vehículos que coincidan con la búsqueda"
                              : "No hay vehículos registrados en este tenant"}
                          </p>
                          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                            {fleetSearch
                              ? "Prueba con otra patente o limpia el filtro de búsqueda."
                              : "La empresa aún no ha cargado unidades en su flota."}
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-xs font-semibold uppercase">
                                Patente
                              </TableHead>
                              <TableHead className="text-xs font-semibold uppercase">
                                Vehículo / Marca
                              </TableHead>
                              <TableHead className="text-xs font-semibold uppercase">
                                Tipo
                              </TableHead>
                              <TableHead className="text-xs font-semibold uppercase">
                                Kilometraje
                              </TableHead>
                              <TableHead className="text-xs font-semibold uppercase">
                                Venc. RTO
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredVehicles.map((veh) => (
                              <TableRow key={veh.id} className="hover:bg-muted/20 text-xs">
                                <TableCell className="font-mono font-bold text-foreground">
                                  <span className="bg-muted/60 px-2 py-0.5 rounded border border-border/80">
                                    {veh.patente}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-foreground">
                                    {veh.marca} {veh.modelo}
                                  </div>
                                  {veh.anio && (
                                    <div className="text-[11px] text-muted-foreground">
                                      Año {veh.anio}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{getVehicleTypeBadge(veh.tipo)}</TableCell>
                                <TableCell className="font-medium font-mono">
                                  {veh.kilometrajeActual.toLocaleString("es-AR")} km
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatDate(veh.rto)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 3: USUARIOS & PASSWORD RESET */}
                  <TabsContent value="usuarios" className="m-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Usuarios del Tenant
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Gestión de accesos, roles y restablecimiento de emergencia de credenciales.
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {data.users.length} {data.users.length === 1 ? "usuario" : "usuarios"}
                      </Badge>
                    </div>

                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      {data.users.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                          <p className="text-xs font-semibold text-foreground">
                            No hay usuarios asignados a esta empresa
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-xs font-semibold uppercase">
                                Usuario / Nombre
                              </TableHead>
                              <TableHead className="text-xs font-semibold uppercase">
                                Rol
                              </TableHead>
                              <TableHead className="text-xs font-semibold uppercase">
                                Seguridad
                              </TableHead>
                              <TableHead className="text-right text-xs font-semibold uppercase pr-4">
                                Acciones
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.users.map((user) => (
                              <TableRow key={user.id} className="hover:bg-muted/20 text-xs">
                                <TableCell>
                                  <div className="font-semibold text-foreground">
                                    {user.name || "Sin nombre"}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground font-mono">
                                    {user.email}
                                  </div>
                                </TableCell>
                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                <TableCell>
                                  {user.mustChangePassword === 1 ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1"
                                    >
                                      <ShieldAlert className="h-3 w-3" />
                                      Cambio Clave Pendiente
                                    </Badge>
                                  ) : (
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Activo
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right pr-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenPasswordReset(user)}
                                    className="h-7 text-[11px] font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
                                  >
                                    <Key className="h-3 w-3" />
                                    Resetear Clave
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 4: ALERTAS */}
                  <TabsContent value="alertas" className="m-0 space-y-4">
                    <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Configuración de Despacho de Notificaciones
                          </h4>
                        </div>
                        {data.alertConfig?.activo === 1 ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                            Motor de Alertas Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Alertas Inactivas
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Canales */}
                        <div className="space-y-2.5 p-3.5 rounded-lg bg-muted/30 border border-border/60">
                          <span className="font-semibold text-foreground block">
                            Canales de Comunicación
                          </span>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" /> Email
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-mono text-[11px]">
                                {data.alertConfig?.emailDestino || data.empresa.email || "Sin email"}
                              </span>
                              {data.alertConfig?.canalEmail === 1 ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0">
                                  Habilitado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
                                  Desactivado
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" /> WhatsApp
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-mono text-[11px]">
                                {data.alertConfig?.telefonoWhatsapp || data.empresa.telefono || "Sin teléfono"}
                              </span>
                              {data.alertConfig?.canalWhatsapp === 1 ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0">
                                  Habilitado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
                                  Desactivado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Umbrales de Tolerancia */}
                        <div className="space-y-2.5 p-3.5 rounded-lg bg-muted/30 border border-border/60">
                          <span className="font-semibold text-foreground block">
                            Umbrales Preventivos de Alerta
                          </span>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Gauge className="h-3.5 w-3.5" /> Tolerancia Kilometraje
                            </span>
                            <span className="font-semibold font-mono text-foreground">
                              {data.alertConfig?.toleranciaKm || 500} km
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" /> Tolerancia Vencimientos
                            </span>
                            <span className="font-semibold font-mono text-foreground">
                              {data.alertConfig?.toleranciaDias || 15} días
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Módulos Habilitados */}
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-semibold text-foreground">
                          Módulos Supervisados
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS", "HORARIOS"].map(
                            (mod) => (
                              <Badge
                                key={mod}
                                variant="outline"
                                className="bg-primary/5 text-primary border-primary/20 text-[11px] font-medium"
                              >
                                ✓ {mod}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 5: CONTROL */}
                  <TabsContent value="control" className="m-0 space-y-4">
                    <div className="space-y-3">
                      {/* Action 1: Superpoderes */}
                      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-amber-500" />
                            Acceso como Tenant (Superpoderes)
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Inicia una sesión de impersonación administrativa para operar el tenant exactamente como su administrador.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleLaunchSuperpoderes}
                          disabled={isEnteringTenant}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs gap-1.5 shrink-0"
                        >
                          {isEnteringTenant ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5" />
                          )}
                          Lanzar Sesión
                        </Button>
                      </div>

                      {/* Action 2: Edit Empresa */}
                      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Edit2 className="h-4 w-4 text-primary" />
                            Modificar Datos Institucionales y Plan
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Edita la razón social, CUIT, teléfonos, direcciones y actualiza el plan SaaS asignado.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onEditEmpresa?.({
                              id: data.empresa.id,
                              nombre: data.empresa.nombre,
                              cuit: data.empresa.cuit,
                              email: data.empresa.email,
                              telefono: data.empresa.telefono,
                              direccion: data.empresa.direccion,
                              ciudad: data.empresa.ciudad,
                              provincia: data.empresa.provincia,
                              planId: data.subscription?.planId,
                              planNombre: data.subscription?.planNombre,
                            });
                          }}
                          className="text-xs gap-1.5 shrink-0"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Editar Empresa
                        </Button>
                      </div>

                      {/* Action 3: Suspend / Reactivate */}
                      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            {isActiva ? (
                              <PowerOff className="h-4 w-4 text-rose-500" />
                            ) : (
                              <Power className="h-4 w-4 text-emerald-500" />
                            )}
                            {isActiva ? "Suspender Suscripción" : "Reactivar Suscripción"}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isActiva
                              ? "Bloquea el acceso al panel para todos los usuarios de la empresa y pausa los envíos de alerta."
                              : "Restaura los accesos completos de la empresa a su plataforma TrackOps."}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isActiva ? "destructive" : "default"}
                          onClick={handleToggleCompanyStatus}
                          disabled={isTogglingStatus}
                          className={`text-xs gap-1.5 shrink-0 ${
                            !isActiva ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                          }`}
                        >
                          {isTogglingStatus ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isActiva ? (
                            <PowerOff className="h-3.5 w-3.5" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                          {isActiva ? "Suspender Empresa" : "Reactivar Empresa"}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══════════ MODAL: RESET PASSWORD FORM ═══════════ */}
      <Dialog
        open={!!resettingUser}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setResettingUser(null);
            setResetError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-border bg-card">
          <form onSubmit={handleExecutePasswordReset}>
            <div className="bg-muted/40 p-5 border-b border-border">
              <DialogHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs bg-background/80">
                    SEGURIDAD TENANT
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Key className="h-5 w-5 text-primary" />
                  Resetear Contraseña de Usuario
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ingresa una nueva contraseña provisoria para{" "}
                  <strong className="text-foreground">
                    {resettingUser?.email}
                  </strong>
                  .
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-5 space-y-4">
              {resetError && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-lg font-medium">
                  {resetError}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Nueva Contraseña</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateRandomPassword}
                  className="h-6 text-[11px] text-primary hover:text-primary gap-1 px-1.5"
                >
                  <RefreshCw className="h-3 w-3" />
                  Generar Segura
                </Button>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-9 font-mono text-xs h-9"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Confirmar Contraseña</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="font-mono text-xs h-9"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Al restablecer la contraseña, se forzará al usuario a cambiarla en su primer inicio de sesión por motivos de seguridad.
                </span>
              </div>
            </div>

            <DialogFooter className="bg-muted/30 px-5 py-3.5 border-t border-border flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResettingUser(null)}
                disabled={isResettingPassword}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isResettingPassword}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-xs"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Guardar Contraseña
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════ MODAL: SUCCESS CREDENTIALS DIALOG ═══════════ */}
      <Dialog
        open={!!resetSuccessData}
        onOpenChange={(isOpen) => {
          if (!isOpen) setResetSuccessData(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border bg-card">
          <div className="bg-emerald-500/10 p-6 border-b border-emerald-500/20 text-center space-y-1.5">
            <div className="h-11 w-11 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              ¡Contraseña Restablecida!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Copia las credenciales provisorias y envíaselas al usuario de forma segura.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2.5 bg-muted/40 p-4 rounded-xl border border-border font-mono text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                <span className="text-muted-foreground font-sans">Empresa:</span>
                <span className="font-bold text-foreground">
                  {data?.empresa.nombre}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                <span className="text-muted-foreground font-sans">Usuario:</span>
                <span className="text-foreground">
                  {resetSuccessData?.user.name || "Usuario"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                <span className="text-muted-foreground font-sans">Email:</span>
                <span className="text-primary font-semibold">
                  {resetSuccessData?.user.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-sans">
                  Nueva Contraseña:
                </span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold border border-primary/20">
                  {resetSuccessData?.password}
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleCopyCredentials}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-2 h-9"
            >
              {hasCopied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  ¡Credenciales Copiadas!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar Credenciales
                </>
              )}
            </Button>
          </div>

          <DialogFooter className="bg-muted/30 px-6 py-3 border-t border-border flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetSuccessData(null)}
              className="text-xs"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
