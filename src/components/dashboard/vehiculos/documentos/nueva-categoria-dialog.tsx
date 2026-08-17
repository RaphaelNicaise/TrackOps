"use client";

import React, { useState } from "react";
import { Loader2, Check, Palette, Tag, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_COLORS } from "./types";
import { cn } from "@/lib/utils";

export interface NuevaCategoriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (nombre: string, color: string) => Promise<void> | void;
}

export function NuevaCategoriaDialog({
  open,
  onOpenChange,
  onCreate,
}: NuevaCategoriaDialogProps) {
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("blue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate(trimmed, color);
      setNombre("");
      setColor("blue");
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear la categoría.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNombre("");
      setColor("blue");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-primary" />
              Nueva Categoría de Documentos
            </DialogTitle>
            <DialogDescription className="text-sm">
              Crea una categoría para clasificar y organizar los documentos de la flota (ej: Seguro, Cédula, RTO, Service, Habilitaciones).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Category Name Input */}
            <div className="space-y-2">
              <Label htmlFor="category-name" className="text-sm font-medium">
                Nombre de la categoría <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category-name"
                placeholder="ej: Seguro, Cédula, RTO, Service..."
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                autoFocus
                maxLength={60}
              />
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                Color identificador
              </Label>
              <div className="grid grid-cols-4 gap-2 pt-1 sm:grid-cols-8">
                {Object.values(CATEGORY_COLORS).map((c) => {
                  const isSelected = color === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      disabled={isSubmitting}
                      className={cn(
                        "group relative flex h-10 w-full items-center justify-center rounded-lg border text-xs font-medium transition-all",
                        c.bg,
                        c.border,
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-xs font-semibold"
                          : "hover:scale-102 hover:shadow-xs opacity-80 hover:opacity-100"
                      )}
                      title={c.label}
                    >
                      <span
                        className={cn("h-3.5 w-3.5 rounded-full", c.dot)}
                      />
                      {isSelected && (
                        <Check className="absolute top-1 right-1 h-3 w-3 text-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Seleccionado:{" "}
                <span className="font-medium text-foreground">
                  {CATEGORY_COLORS[color]?.label || color}
                </span>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !nombre.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear categoría"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NuevaCategoriaDialog;
