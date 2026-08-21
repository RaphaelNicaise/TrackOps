"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { changeInitialPassword } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

interface ForcePasswordChangeModalProps {
  mustChangePassword?: number;
  userName?: string | null;
}

export function ForcePasswordChangeModal({
  mustChangePassword,
  userName,
}: ForcePasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If user doesn't need to change password, do not render modal
  if (mustChangePassword !== 1) {
    return null;
  }

  // Password rules validation
  const rules = useMemo(() => {
    return [
      {
        id: "length",
        label: "Mínimo 8 caracteres",
        valid: newPassword.length >= 8,
      },
      {
        id: "uppercase",
        label: "Al menos una letra mayúscula (A-Z)",
        valid: /[A-Z]/.test(newPassword),
      },
      {
        id: "number",
        label: "Al menos un número (0-9)",
        valid: /[0-9]/.test(newPassword),
      },
      {
        id: "special",
        label: "Al menos un símbolo o carácter especial (!@#$%)",
        valid: /[^A-Za-z0-9]/.test(newPassword),
      },
    ];
  }, [newPassword]);

  const strengthScore = useMemo(() => {
    if (!newPassword) return 0;
    return rules.filter((r) => r.valid).length;
  }, [rules, newPassword]);

  const strengthMeta = useMemo(() => {
    switch (strengthScore) {
      case 1:
        return { label: "Débil", color: "bg-red-500", text: "text-red-500" };
      case 2:
        return { label: "Regular", color: "bg-amber-500", text: "text-amber-500" };
      case 3:
        return { label: "Buena", color: "bg-blue-500", text: "text-blue-500" };
      case 4:
        return { label: "Excelente", color: "bg-emerald-500", text: "text-emerald-500" };
      default:
        return { label: "Muy débil", color: "bg-muted-foreground/20", text: "text-muted-foreground" };
    }
  }, [strengthScore]);

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isFormValid = newPassword.length >= 8 && passwordsMatch && strengthScore >= 2;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    try {
      const res = await changeInitialPassword(formData);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setErrorMessage(res.error || "No se pudo actualizar la contraseña. Revisa los datos.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMessage("Ocurrió un error inesperado al procesar la solicitud.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="force-password-change-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-background/85 backdrop-blur-md animate-in fade-in-0 duration-300 select-none overflow-y-auto"
      onKeyDown={(e) => {
        // Prevent closing or bubbling escape key
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-card border border-border/80 shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-xl overflow-hidden transition-all my-auto">
        {/* Subtle accent glow top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/40" />

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="h-9 w-9 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                ¡Contraseña establecida con éxito!
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Tu cuenta ha sido asegurada. Actualizando tu sesión de trabajo...
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-primary pt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Iniciando panel principal...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm">
                <KeyRound className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <ShieldAlert className="h-3 w-3" />
                    Seguridad Obligatoria
                  </span>
                </div>
                <h1
                  id="force-password-change-title"
                  className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
                >
                  Actualización de Contraseña
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {userName ? (
                    <>
                      Hola <strong className="text-foreground">{userName}</strong>, por
                      seguridad en tu primer ingreso debes definir una nueva contraseña personal.
                    </>
                  ) : (
                    "Por seguridad en tu primer ingreso debes definir una nueva contraseña personal."
                  )}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2.5 text-xs sm:text-sm animate-in fade-in-50">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="new-password"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider"
                >
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="new-password"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Escribe tu nueva clave..."
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2.5 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Fortaleza:
                    </span>
                    <span className={cn("font-bold", strengthMeta.text)}>
                      {strengthMeta.label}
                    </span>
                  </div>

                  {/* 4 segments progress bar */}
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          strengthScore >= step
                            ? strengthMeta.color
                            : "bg-muted-foreground/15"
                        )}
                      />
                    ))}
                  </div>

                  {/* Rules Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className={cn(
                          "flex items-center gap-1.5 transition-colors",
                          rule.valid ? "text-emerald-500 font-medium" : "text-muted-foreground"
                        )}
                      >
                        {rule.valid ? (
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0 ml-1 mr-1" />
                        )}
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider"
                >
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Repite la contraseña..."
                    className={cn(
                      "w-full pl-9 pr-10 py-2.5 text-sm bg-background border rounded-xl focus:outline-none transition-all placeholder:text-muted-foreground/60",
                      passwordsMismatch &&
                        "border-destructive focus:ring-2 focus:ring-destructive",
                      passwordsMatch &&
                        "border-emerald-500 focus:ring-2 focus:ring-emerald-500",
                      !confirmPassword &&
                        "border-input focus:ring-2 focus:ring-primary focus:border-transparent"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs pt-0.5">
                    {passwordsMatch ? (
                      <span className="text-emerald-500 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Las contraseñas coinciden
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-1 font-medium">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Las contraseñas no coinciden
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold shadow-md transition-all duration-200",
                    isFormValid && !isSubmitting
                      ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.99] cursor-pointer"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando nueva contraseña...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Establecer Contraseña y Continuar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
