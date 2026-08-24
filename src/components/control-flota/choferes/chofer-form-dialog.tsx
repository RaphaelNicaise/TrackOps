"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, UserPlus, UserCheck, ShieldCheck, Upload, Image as ImageIcon, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appAlert } from "@/lib/alerts";
import { createChofer, updateChofer, deleteChofer } from "@/lib/flota-actions";
import type { ChoferRow, ChoferEstado, CreateChoferInput, UpdateChoferInput } from "@/types/flota-viajes";

export interface VehicleOption {
  id: number;
  patente: string;
  marca?: string;
  modelo?: string;
}

export interface ChoferFormDialogProps {
  chofer?: ChoferRow | null;
  vehicles?: VehicleOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: (chofer: ChoferRow) => void;
}

const LICENCIA_CATEGORIAS = [
  "A1", "A2", "A3",
  "B1", "B2",
  "C1", "C2", "C3",
  "D1", "D2", "D3", "D4",
  "E1", "E2",
  "F", "G1", "G2",
];

function toDateInputValue(date?: Date | string | null): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return format(d, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export function ChoferFormDialog({
  chofer,
  vehicles = [],
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: ChoferFormDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;

  const [isPending, startTransition] = useTransition();

  // Form State
  const [nombre, setNombre] = useState(chofer?.nombre || "");
  const [apellido, setApellido] = useState(chofer?.apellido || "");
  const [dni, setDni] = useState(chofer?.dni || "");
  const [telefono, setTelefono] = useState(chofer?.telefono || "");
  const [email, setEmail] = useState(chofer?.email || "");
  const [licenciaNumero, setLicenciaNumero] = useState(chofer?.licenciaNumero || "");
  const [licenciaCategoria, setLicenciaCategoria] = useState(chofer?.licenciaCategoria || "B1");
  const [licenciaVencimiento, setLicenciaVencimiento] = useState(toDateInputValue(chofer?.licenciaVencimiento));
  const [vehiculoHabitualId, setVehiculoHabitualId] = useState<string>(
    chofer?.vehiculoHabitualId ? String(chofer.vehiculoHabitualId) : ""
  );
  const [estado, setEstado] = useState<ChoferEstado>(chofer?.estado || "ACTIVO");
  const [notas, setNotas] = useState(chofer?.notas || "");
  const [fotoDniFrente, setFotoDniFrente] = useState(chofer?.fotoDniFrente || "");
  const [fotoDniDorso, setFotoDniDorso] = useState(chofer?.fotoDniDorso || "");

  // User credentials generation
  const [createCredentials, setCreateCredentials] = useState(false);
  const [userPassword, setUserPassword] = useState("");

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      appAlert.error("La imagen no debe superar los 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) setter(result);
    };
    reader.readAsDataURL(file);
  };

  // Sync state when chofer prop changes
  useEffect(() => {
    if (chofer) {
      setNombre(chofer.nombre || "");
      setApellido(chofer.apellido || "");
      setDni(chofer.dni || "");
      setTelefono(chofer.telefono || "");
      setEmail(chofer.email || "");
      setLicenciaNumero(chofer.licenciaNumero || "");
      setLicenciaCategoria(chofer.licenciaCategoria || "B1");
      setLicenciaVencimiento(toDateInputValue(chofer.licenciaVencimiento));
      setVehiculoHabitualId(chofer.vehiculoHabitualId ? String(chofer.vehiculoHabitualId) : "");
      setEstado(chofer.estado || "ACTIVO");
      setNotas(chofer.notas || "");
      setFotoDniFrente(chofer.fotoDniFrente || "");
      setFotoDniDorso(chofer.fotoDniDorso || "");
      setCreateCredentials(false);
      setUserPassword("");
    } else {
      setNombre("");
      setApellido("");
      setDni("");
      setTelefono("");
      setEmail("");
      setLicenciaNumero("");
      setLicenciaCategoria("B1");
      setLicenciaVencimiento("");
      setVehiculoHabitualId("");
      setEstado("ACTIVO");
      setNotas("");
      setFotoDniFrente("");
      setFotoDniDorso("");
      setCreateCredentials(false);
      setUserPassword("");
    }
  }, [chofer, open]);

  const isEdit = !!chofer?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nombre.trim() || !apellido.trim() || !dni.trim()) {
      appAlert.error("Nombre, Apellido y DNI son campos obligatorios.");
      return;
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          const payload: UpdateChoferInput = {
            id: chofer.id,
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            dni: dni.trim(),
            telefono: telefono.trim() || null,
            email: email.trim() || null,
            licenciaNumero: licenciaNumero.trim() || null,
            licenciaCategoria: licenciaCategoria.trim() || null,
            licenciaVencimiento: licenciaVencimiento ? new Date(licenciaVencimiento) : null,
            estado,
            vehiculoHabitualId: vehiculoHabitualId ? Number(vehiculoHabitualId) : null,
            notas: notas.trim() || null,
            fotoDniFrente: fotoDniFrente || null,
            fotoDniDorso: fotoDniDorso || null,
          };

          const res = await updateChofer(chofer.id, payload);
          if (res.success && res.data) {
            appAlert.success("Chofer actualizado correctamente.");
            setOpen(false);
            onSuccess?.(res.data);
            router.refresh();
          } else {
            appAlert.error(res.error || "No se pudo actualizar el chofer.");
          }
        } else {
          const payload: CreateChoferInput = {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            dni: dni.trim(),
            telefono: telefono.trim() || null,
            email: email.trim() || null,
            licenciaNumero: licenciaNumero.trim() || null,
            licenciaCategoria: licenciaCategoria.trim() || null,
            licenciaVencimiento: licenciaVencimiento ? new Date(licenciaVencimiento) : null,
            estado,
            vehiculoHabitualId: vehiculoHabitualId ? Number(vehiculoHabitualId) : null,
            notas: notas.trim() || null,
            fotoDniFrente: fotoDniFrente || null,
            fotoDniDorso: fotoDniDorso || null,
          };

          const res = await createChofer(payload, createCredentials, userPassword || dni.trim());
          if (res.success && res.data) {
            appAlert.success("Chofer registrado exitosamente en la flota.");
            setOpen(false);
            onSuccess?.(res.data);
            router.refresh();
          } else {
            appAlert.error(res.error || "No se pudo registrar el chofer.");
          }
        }
      } catch (err: any) {
        console.error("Error al guardar chofer:", err);
        appAlert.error(err.message || "Ocurrió un error inesperado.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm" className="gap-2 shadow-xs">
              <Plus className="h-4 w-4" />
              Nuevo Chofer
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            {isEdit ? <Pencil className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
            {isEdit ? `Editar Chofer: ${chofer.nombre} ${chofer.apellido}` : "Registrar Nuevo Chofer"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modificá la información laboral, de contacto y licencias del conductor."
              : "Completá los datos personales, licencia y asignación de vehículo para dar de alta al chofer."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Seccion: Datos Personales */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Datos Personales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="chofer-nombre" className="text-xs font-medium">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="chofer-nombre"
                  placeholder="Ej. Juan"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chofer-apellido" className="text-xs font-medium">
                  Apellido <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="chofer-apellido"
                  placeholder="Ej. Pérez"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chofer-dni" className="text-xs font-medium">
                  DNI <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="chofer-dni"
                  placeholder="Ej. 30111222"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  required
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {/* Seccion: Contacto */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Información de Contacto
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="chofer-telefono" className="text-xs font-medium">
                  Teléfono (WhatsApp)
                </Label>
                <Input
                  id="chofer-telefono"
                  type="tel"
                  placeholder="Ej. +54 9 11 2345 6789"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chofer-email" className="text-xs font-medium">
                  Email
                </Label>
                <Input
                  id="chofer-email"
                  type="email"
                  placeholder="Ej. juan.perez@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seccion: Licencia de Conducir */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Licencia de Conducir
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="chofer-licencia-numero" className="text-xs font-medium">
                  Número de Licencia
                </Label>
                <Input
                  id="chofer-licencia-numero"
                  placeholder="Ej. LIC-30111222"
                  value={licenciaNumero}
                  onChange={(e) => setLicenciaNumero(e.target.value)}
                  className="font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chofer-licencia-categoria" className="text-xs font-medium">
                  Categoría
                </Label>
                <Select
                  value={licenciaCategoria}
                  onValueChange={(val) => setLicenciaCategoria(val)}
                >
                  <SelectTrigger id="chofer-licencia-categoria" className="h-10 rounded-xl bg-card border-input">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
                    {LICENCIA_CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chofer-licencia-vencimiento" className="text-xs font-medium">
                  Vencimiento Licencia
                </Label>
                <Input
                  id="chofer-licencia-vencimiento"
                  type="date"
                  value={licenciaVencimiento}
                  onChange={(e) => setLicenciaVencimiento(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seccion: Asignación y Estado */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Operación y Flota
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="chofer-vehiculo" className="text-xs font-medium">
                  Vehículo Habitual
                </Label>
                <Select
                  value={vehiculoHabitualId || "NONE"}
                  onValueChange={(val) => setVehiculoHabitualId(val === "NONE" ? "" : val)}
                >
                  <SelectTrigger id="chofer-vehiculo" className="h-10 rounded-xl bg-card border-input">
                    <SelectValue placeholder="— Sin asignar —" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
                    <SelectItem value="NONE">— Sin asignar —</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.patente} {v.marca ? `- ${v.marca}` : ""} {v.modelo || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chofer-estado" className="text-xs font-medium">
                  Estado Laboral
                </Label>
                <Select
                  value={estado}
                  onValueChange={(val) => setEstado(val as ChoferEstado)}
                >
                  <SelectTrigger id="chofer-estado" className="h-10 rounded-xl bg-card border-input">
                    <SelectValue placeholder="Estado laboral" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover border-border shadow-xl">
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    <SelectItem value="LICENCIA_SUSPENDIDA">Licencia suspendida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="chofer-notas" className="text-xs font-medium">
                Notas / Observaciones
              </Label>
              <Input
                id="chofer-notas"
                placeholder="Observaciones de ingreso, turnos o restricciones..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
          </div>

          {/* Seccion: Digitalización de DNI (Frente / Dorso) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Digitalización de DNI (Frente / Dorso)
              </h4>
              <span className="text-[11px] text-muted-foreground">
                Para validación de identidad y código de barras
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Frente */}
              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>DNI Frente</span>
                  {fotoDniFrente && (
                    <button
                      type="button"
                      onClick={() => setFotoDniFrente("")}
                      className="text-destructive hover:underline text-[11px] flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Quitar
                    </button>
                  )}
                </div>

                {fotoDniFrente ? (
                  <div className="aspect-[1.6/1] rounded-lg overflow-hidden border border-border bg-background relative group">
                    <img
                      src={fotoDniFrente}
                      alt="DNI Frente preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <label className="aspect-[1.6/1] rounded-lg border border-dashed border-border bg-background flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-muted/40 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mb-1.5 opacity-60" />
                    <span className="text-xs font-medium text-foreground">
                      Subir foto del frente
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      PNG, JPG o WEBP (máx. 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setFotoDniFrente)}
                    />
                  </label>
                )}
              </div>

              {/* Dorso */}
              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>DNI Dorso (Código de Barras)</span>
                  {fotoDniDorso && (
                    <button
                      type="button"
                      onClick={() => setFotoDniDorso("")}
                      className="text-destructive hover:underline text-[11px] flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Quitar
                    </button>
                  )}
                </div>

                {fotoDniDorso ? (
                  <div className="aspect-[1.6/1] rounded-lg overflow-hidden border border-border bg-background relative group">
                    <img
                      src={fotoDniDorso}
                      alt="DNI Dorso preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <label className="aspect-[1.6/1] rounded-lg border border-dashed border-border bg-background flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-muted/40 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mb-1.5 opacity-60" />
                    <span className="text-xs font-medium text-foreground">
                      Subir foto del dorso
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Contiene el código PDF417
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setFotoDniDorso)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Seccion: Credenciales de Acceso (Sólo en alta o si no tiene cuenta vinculada) */}
          {!isEdit && (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="create-credentials-switch"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Generar credenciales de acceso al sistema para el Chofer
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Crea un usuario con rol Chofer para ingresar al Panel Móvil (/panel/chofer) con su DNI o Email.
                  </p>
                </div>
                <Switch
                  id="create-credentials-switch"
                  checked={createCredentials}
                  onCheckedChange={setCreateCredentials}
                />
              </div>

              {createCredentials && (
                <div className="pt-2 border-t space-y-2">
                  <Label htmlFor="chofer-password" className="text-xs font-medium">
                    Contraseña Inicial (opcional, por defecto es su número de DNI)
                  </Label>
                  <Input
                    id="chofer-password"
                    type="password"
                    placeholder="Dejar en blanco para usar DNI"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                "Guardando..."
              ) : isEdit ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Registrar Chofer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateChoferDialog(props: ChoferFormDialogProps) {
  return <ChoferFormDialog {...props} chofer={null} />;
}

export function EditChoferDialog({
  chofer,
  ...props
}: ChoferFormDialogProps & { chofer: ChoferRow }) {
  return <ChoferFormDialog {...props} chofer={chofer} />;
}

export function DeleteChoferDialog({
  chofer,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: {
  chofer: ChoferRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        const res = await deleteChofer(chofer.id);
        if (res.success) {
          appAlert.success(`El chofer ${chofer.nombre} ${chofer.apellido} fue eliminado.`);
          setOpen(false);
          onSuccess?.();
          router.refresh();
        } else {
          appAlert.error(res.error || "No se pudo eliminar el chofer.");
        }
      } catch (err: any) {
        appAlert.error(err.message || "Error al eliminar chofer.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="destructive" size="sm" className="gap-1.5">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar chofer {chofer.nombre} {chofer.apellido}?</DialogTitle>
          <DialogDescription>
            Esta acción eliminará el registro del chofer DNI {chofer.dni}. Esta operación no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Eliminando..." : "Eliminar Chofer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
