"use client";

import { useState, useTransition } from "react";
import { KeyRound, ShieldCheck, UserCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
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
import { appAlert } from "@/lib/alerts";
import { updateChoferCredentials } from "@/lib/flota-actions";
import type { ChoferRow } from "@/types/flota-viajes";

interface ChoferCredentialsDialogProps {
  chofer: ChoferRow;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ChoferCredentialsDialog({
  chofer,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: ChoferCredentialsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasLinkedUser = !!chofer.userId;

  const handleGeneratePassword = () => {
    // Generate a secure 6-digit numeric PIN or memorable password
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setPassword(pin);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.trim().length < 4) {
      appAlert.error("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    startTransition(async () => {
      const res = await updateChoferCredentials(chofer.id, password.trim());
      if (res.success) {
        appAlert.success(
          hasLinkedUser
            ? "Contraseña actualizada exitosamente"
            : "Cuenta de acceso para chofer creada exitosamente"
        );
        setPassword("");
        setOpen(false);
        onSuccess?.();
      } else {
        appAlert.error(res.error || "Error al actualizar credenciales");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Gestión de Credenciales
              </DialogTitle>
              <DialogDescription className="text-xs">
                Acceso al panel y login por DNI para {chofer.nombre} {chofer.apellido}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Account status card */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Estado de la cuenta:</span>
              {hasLinkedUser ? (
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Cuenta activa
                </span>
              ) : (
                <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" /> Sin cuenta vinculada
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Usuario / DNI:</span>
                <span className="font-mono font-bold text-foreground">{chofer.dni}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Email de acceso:</span>
                <span className="font-medium text-foreground truncate block">
                  {chofer.email || `${chofer.dni}@flota.local`}
                </span>
              </div>
            </div>
          </div>

          {/* New password input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="chofer-new-password" className="text-xs font-semibold">
                {hasLinkedUser ? "Nueva Contraseña o PIN" : "Asignar Contraseña o PIN Inicial"}
              </Label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Generar PIN aleatorio (6 dígitos)
              </button>
            </div>

            <div className="relative">
              <Input
                id="chofer-new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres (ej: 123456)"
                className="bg-background pr-10 font-mono text-sm"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              El chofer podrá ingresar a <span className="font-mono font-semibold">/auth/login</span> utilizando su DNI (<span className="font-mono">{chofer.dni}</span>) o correo y esta clave.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              <UserCheck className="w-4 h-4" />
              {isPending
                ? "Guardando..."
                : hasLinkedUser
                ? "Actualizar Contraseña"
                : "Crear Cuenta de Acceso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
