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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { appAlert } from "@/lib/alerts";
import {
  createEmpresaWithAdmin,
  updateEmpresa,
} from "@/lib/admin-actions";
import {
  EmpresaCreatedDialog,
  CreatedEmpresaInfo,
  CreatedAdminInfo,
} from "./empresa-created-dialog";
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  User,
  Layers,
  CreditCard,
} from "lucide-react";

export interface PlanOption {
  id: number;
  nombre: string;
  minVehiculos?: number;
  maxVehiculos?: number | null;
  precioMensual?: number;
  precioAnual?: number | null;
}

export interface EmpresaFormData {
  id?: number;
  nombre: string;
  cuit?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
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
  onEmpresaCreated?: (result: {
    empresa: CreatedEmpresaInfo;
    adminUser: CreatedAdminInfo;
    initialPassword: string;
    planNombre: string;
  }) => void;
}

const DEFAULT_PLANS: PlanOption[] = [
  { id: 1, nombre: "Inicial", minVehiculos: 1, maxVehiculos: 5, precioMensual: 39990, precioAnual: 399900 },
  { id: 2, nombre: "Crecimiento", minVehiculos: 6, maxVehiculos: 15, precioMensual: 64900, precioAnual: 649000 },
  { id: 3, nombre: "Consolidada", minVehiculos: 16, maxVehiculos: 30, precioMensual: 99900, precioAnual: 999000 },
  { id: 4, nombre: "Masiva", minVehiculos: 31, maxVehiculos: 49, precioMensual: 149900, precioAnual: 1499000 },
  { id: 5, nombre: "Enterprise", minVehiculos: 50, maxVehiculos: null, precioMensual: 199900, precioAnual: 1999000 },
];

export function EmpresaFormDialog({
  empresa,
  plans = DEFAULT_PLANS,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
  onEmpresaCreated,
}: EmpresaFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const isEdit = !!empresa?.id;

  // Available live plans list
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>(
    plans.length > 0 ? plans : DEFAULT_PLANS
  );

  // Fetch live plans when opening dialog to ensure newly created plans appear
  useEffect(() => {
    if (isOpen) {
      fetch("/api/plans")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setAvailablePlans(
              data.map((p: any) => ({
                id: p.id,
                nombre: p.nombre,
                minVehiculos: p.minVehiculos,
                maxVehiculos: p.maxVehiculos,
                precioMensual: p.precioMensual,
                precioAnual: p.precioAnual,
              }))
            );
          }
        })
        .catch(() => {
          // ignore error and keep existing plans
        });
    }
  }, [isOpen]);

  // Section 1: Company details
  const [nombre, setNombre] = useState(empresa?.nombre || "");
  const [cuit, setCuit] = useState(empresa?.cuit || "");
  const [email, setEmail] = useState(empresa?.email || "");
  const [telefono, setTelefono] = useState(empresa?.telefono || "");
  const [direccion, setDireccion] = useState(empresa?.direccion || "");
  const [ciudad, setCiudad] = useState(empresa?.ciudad || "");
  const [provincia, setProvincia] = useState(empresa?.provincia || "");

  // Section 2: Plan
  const [selectedPlanId, setSelectedPlanId] = useState<number>(() => {
    if (empresa?.planId) return empresa.planId;
    if (empresa?.planNombre) {
      const found = (plans.length > 0 ? plans : DEFAULT_PLANS).find(
        (p) => p.nombre.toLowerCase() === empresa.planNombre?.toLowerCase()
      );
      if (found) return found.id;
    }
    return plans[0]?.id || 1;
  });

  // Section 3: Admin credentials (new tenant only)
  const [adminNombre, setAdminNombre] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal for created credentials
  const [createdResult, setCreatedResult] = useState<{
    empresa: CreatedEmpresaInfo;
    adminUser: CreatedAdminInfo;
    initialPassword: string;
    planNombre: string;
  } | null>(null);
  const [isCreatedModalOpen, setIsCreatedModalOpen] = useState(false);

  // Sync state when editing or opening
  useEffect(() => {
    const activeList = availablePlans.length > 0 ? availablePlans : plans.length > 0 ? plans : DEFAULT_PLANS;

    if (empresa) {
      setNombre(empresa.nombre || "");
      setCuit(empresa.cuit || "");
      setEmail(empresa.email || "");
      setTelefono(empresa.telefono || "");
      setDireccion(empresa.direccion || "");
      setCiudad(empresa.ciudad || "");
      setProvincia(empresa.provincia || "");

      if (empresa.planId) {
        setSelectedPlanId(empresa.planId);
      } else if (empresa.planNombre) {
        const found = activeList.find(
          (p) => p.nombre.toLowerCase() === empresa.planNombre?.toLowerCase()
        );
        setSelectedPlanId(found ? found.id : activeList[0]?.id || 1);
      } else {
        setSelectedPlanId(activeList[0]?.id || 1);
      }
    } else {
      setNombre("");
      setCuit("");
      setEmail("");
      setTelefono("");
      setDireccion("");
      setCiudad("");
      setProvincia("");
      setSelectedPlanId(activeList[0]?.id || 1);
      setAdminNombre("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminPasswordConfirm("");
    }
    setErrorMsg(null);
  }, [empresa, availablePlans, isOpen]);

  // Helper to generate a strong random password
  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(pwd);
    setAdminPasswordConfirm(pwd);
    setShowPassword(true);
    appAlert.info("Se ha generado una contraseña segura.", "Contraseña Generada");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setErrorMsg("El nombre de la empresa o razón social es obligatorio.");
      return;
    }

    if (!isEdit) {
      if (!adminNombre.trim()) {
        setErrorMsg("El nombre del administrador es obligatorio.");
        return;
      }
      if (!adminEmail.trim()) {
        setErrorMsg("El email de acceso del administrador es obligatorio.");
        return;
      }
      if (!adminPassword || adminPassword.length < 8) {
        setErrorMsg("La contraseña del administrador debe tener al menos 8 caracteres.");
        return;
      }
      if (adminPassword !== adminPasswordConfirm) {
        setErrorMsg("Las contraseñas no coinciden. Por favor verifica ambos campos.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre.trim());
      if (cuit.trim()) formData.append("cuit", cuit.trim());
      if (email.trim()) formData.append("email", email.trim());
      if (telefono.trim()) formData.append("telefono", telefono.trim());
      if (direccion.trim()) formData.append("direccion", direccion.trim());
      if (ciudad.trim()) formData.append("ciudad", ciudad.trim());
      if (provincia.trim()) formData.append("provincia", provincia.trim());
      formData.append("planId", selectedPlanId.toString());

      if (isEdit && empresa?.id) {
        formData.append("id", empresa.id.toString());
        await updateEmpresa(formData);
        appAlert.success(
          `La empresa "${nombre}" ha sido actualizada correctamente.`,
          "Empresa Actualizada"
        );
        setOpen(false);
        onSuccess?.();
      } else {
        formData.append("adminNombre", adminNombre.trim());
        formData.append("adminEmail", adminEmail.trim());
        formData.append("adminPassword", adminPassword);

        const res = await createEmpresaWithAdmin(formData);
        if (res.success) {
          const activePlansList = availablePlans.length > 0 ? availablePlans : plans.length > 0 ? plans : DEFAULT_PLANS;
          const planObj = activePlansList.find((p) => p.id === selectedPlanId);
          const createdData = {
            empresa: res.empresa,
            adminUser: res.adminUser,
            initialPassword: res.initialPassword,
            planNombre: planObj?.nombre || "Inicial",
          };

          setCreatedResult(createdData);
          setOpen(false);
          setIsCreatedModalOpen(true);
          onSuccess?.();
          onEmpresaCreated?.(createdData);
        }
      }
    } catch (err: any) {
      const message =
        err?.message || "Ocurrió un error inesperado al procesar la solicitud.";
      setErrorMsg(message);
      appAlert.error(message, "Error al guardar empresa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPlans = availablePlans.length > 0 ? availablePlans : plans.length > 0 ? plans : DEFAULT_PLANS;

  return (
    <>
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

        <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden border-border bg-card">
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
                    Aprovisionamiento Multi-Inquilino
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  {isEdit ? "Editar Empresa Cliente" : "Registrar Empresa y Administrador"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isEdit
                    ? "Actualiza los datos institucionales, de contacto y el plan contratado."
                    : "Configura la empresa cliente, su plan de suscripción y las credenciales iniciales de su administrador."}
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Scrollable Form Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              {/* ═══════════ SECTION 1: DATOS DE LA EMPRESA ═══════════ */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    1. Datos de la Empresa
                  </h3>
                </div>

                {/* Field: Nombre */}
                <div className="space-y-1.5">
                  <Label htmlFor="emp-nombre" className="text-xs font-semibold flex items-center gap-1">
                    Razón Social / Nombre Comercial
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="emp-nombre"
                      placeholder="ej. Transportes del Sur S.A."
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      required
                    />
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Row: CUIT & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="emp-cuit" className="text-xs font-semibold">
                      CUIT / Identificación Tributaria
                    </Label>
                    <div className="relative">
                      <Input
                        id="emp-cuit"
                        placeholder="ej. 30-71234567-9"
                        value={cuit}
                        onChange={(e) => setCuit(e.target.value)}
                        className="pl-9 h-9 font-mono text-xs"
                      />
                      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emp-email" className="text-xs font-semibold">
                      Email de Notificaciones
                    </Label>
                    <div className="relative">
                      <Input
                        id="emp-email"
                        type="email"
                        placeholder="contacto@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row: Teléfono & Dirección */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="emp-telefono" className="text-xs font-semibold">
                      Teléfono / WhatsApp
                    </Label>
                    <div className="relative">
                      <Input
                        id="emp-telefono"
                        placeholder="+54 9 11 1234-5678"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emp-direccion" className="text-xs font-semibold">
                      Dirección (Calle y Nro.)
                    </Label>
                    <div className="relative">
                      <Input
                        id="emp-direccion"
                        placeholder="ej. Av. Corrientes 1234"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row: Ciudad & Provincia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="emp-ciudad" className="text-xs font-semibold">
                      Ciudad / Localidad
                    </Label>
                    <Input
                      id="emp-ciudad"
                      placeholder="ej. Rosario"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emp-provincia" className="text-xs font-semibold">
                      Provincia / Estado
                    </Label>
                    <Input
                      id="emp-provincia"
                      placeholder="ej. Santa Fe"
                      value={provincia}
                      onChange={(e) => setProvincia(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ═══════════ SECTION 2: PLAN SAAS ═══════════ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      2. Plan SaaS Inicial
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Selecciona el nivel de cobertura de flota
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {currentPlans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`cursor-pointer rounded-lg border p-3 transition-all flex flex-col justify-between text-left ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-2xs"
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
                          {plan.minVehiculos != null
                            ? `${plan.minVehiculos} - ${plan.maxVehiculos ? plan.maxVehiculos : "∞"} vehículos`
                            : plan.maxVehiculos
                            ? `Hasta ${plan.maxVehiculos} vehículos`
                            : "Flota ilimitada"}
                        </div>

                        <div className="mt-2 text-xs font-bold text-foreground">
                          {plan.precioMensual != null
                            ? `$${plan.precioMensual.toLocaleString("es-AR")} ARS/mes`
                            : "A medida"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ═══════════ SECTION 3: CREDENCIALES ADMIN (ONLY ON CREATE) ═══════════ */}
              {!isEdit && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        3. Credenciales del Administrador
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGeneratePassword}
                      className="h-6 text-[11px] text-primary hover:text-primary gap-1 px-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Generar Contraseña
                    </Button>
                  </div>

                  {/* Row: Admin Name & Admin Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-nombre" className="text-xs font-semibold flex items-center gap-1">
                        Nombre del Administrador
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="admin-nombre"
                          placeholder="ej. Juan Pérez"
                          value={adminNombre}
                          onChange={(e) => setAdminNombre(e.target.value)}
                          className="pl-9 h-9 text-xs"
                          required
                        />
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="admin-email" className="text-xs font-semibold flex items-center gap-1">
                        Email de Acceso (Usuario)
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="admin-email"
                          type="email"
                          placeholder="admin@empresa.com"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="pl-9 h-9 text-xs"
                          required
                        />
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Row: Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-password" className="text-xs font-semibold flex items-center gap-1">
                        Contraseña Inicial (mín. 8 car.)
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="admin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="pl-9 pr-8 h-9 text-xs font-mono"
                          required
                          minLength={8}
                        />
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="admin-password-confirm" className="text-xs font-semibold flex items-center gap-1">
                        Confirmar Contraseña
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="admin-password-confirm"
                          type={showPassword ? "text" : "password"}
                          placeholder="Repite la contraseña"
                          value={adminPasswordConfirm}
                          onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                          className="pl-9 h-9 text-xs font-mono"
                          required
                          minLength={8}
                        />
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      Se creará el usuario con rol <strong>ADMIN_EMPRESA</strong> y se solicitará cambio de contraseña en su primer acceso.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="bg-muted/30 px-6 py-4 border-t border-border flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 min-w-[140px] text-xs shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {isEdit ? "Guardando..." : "Creando Empresa..."}
                  </>
                ) : isEdit ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Actualizar Empresa
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Aprovisionar Empresa
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credentials Created Dialog */}
      <EmpresaCreatedDialog
        open={isCreatedModalOpen}
        onOpenChange={setIsCreatedModalOpen}
        empresa={createdResult?.empresa || null}
        adminUser={createdResult?.adminUser || null}
        initialPassword={createdResult?.initialPassword || ""}
        planNombre={createdResult?.planNombre || "Inicial"}
      />
    </>
  );
}
