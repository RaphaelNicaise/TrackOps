"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
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
import { updateVehicle, deleteVehicle } from "@/lib/vehicle-actions";

export type VehiculoEditable = {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  tipo: string | null;
  chasis: string | null;
  kilometrajeActual: number;
  rto: Date | null;
};

const TIPOS = ["Camión", "Camioneta", "Utilitario", "Auto"];

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

export function EditVehicleDialog({ vehicle }: { vehicle: VehiculoEditable }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("id", String(vehicle.id));
    startTransition(async () => {
      await updateVehicle(fd);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar vehículo {vehicle.patente}</DialogTitle>
          <DialogDescription>
            Modificá los datos del vehículo y guardá los cambios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patente">Patente</Label>
              <Input id="patente" name="patente" defaultValue={vehicle.patente} required className="font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                name="tipo"
                defaultValue={vehicle.tipo ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
              >
                <option value="">—</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" name="marca" defaultValue={vehicle.marca} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" name="modelo" defaultValue={vehicle.modelo} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Input id="anio" name="anio" type="number" defaultValue={vehicle.anio ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chasis">Chasis</Label>
              <Input id="chasis" name="chasis" defaultValue={vehicle.chasis ?? ""} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kilometrajeActual">Km actual</Label>
              <Input id="kilometrajeActual" name="kilometrajeActual" type="number" defaultValue={vehicle.kilometrajeActual} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rto">RTO (vencimiento)</Label>
              <Input id="rto" name="rto" type="date" defaultValue={toDateInputValue(vehicle.rto)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteVehicleButton({ id, patente }: { id: number; patente: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      await deleteVehicle(fd);
      setOpen(false);
      router.replace("/dashboard/control-flota/vehiculos");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar vehículo {patente}?</DialogTitle>
          <DialogDescription>
            Esta acción elimina el vehículo de forma definitiva y no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={onDelete}>
            {isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}