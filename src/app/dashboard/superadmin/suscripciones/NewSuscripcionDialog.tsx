"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSubscriptionPlan } from "@/lib/admin-actions";

export function NewSuscripcionDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Plan de Suscripción</DialogTitle>
          <DialogDescription>
            Configura los detalles del nuevo plan.
          </DialogDescription>
        </DialogHeader>
        <form action={createSubscriptionPlan} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Plan</Label>
            <Input id="nombre" name="nombre" required placeholder="Ej: Plan Básico" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxVehiculos">Máximo de Vehículos</Label>
            <Input id="maxVehiculos" name="maxVehiculos" type="number" required placeholder="Ej: 10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="precioMensual">Precio Mensual ($)</Label>
            <Input id="precioMensual" name="precioMensual" type="number" step="0.01" required placeholder="Ej: 5000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="precioAnual">Precio Anual ($) (Opcional)</Label>
            <Input id="precioAnual" name="precioAnual" type="number" step="0.01" placeholder="Ej: 50000" />
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit">Crear Plan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
