"use client";

import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { assignSubscription } from "@/lib/admin-actions";

type Plan = { id: number; nombre: string; precioMensual: number; };
type Empresa = { id: number; nombre: string; };

export function AssignSuscripcionDialog({ planes, empresas }: { planes: Plan[], empresas: Empresa[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link2 className="mr-2 h-4 w-4" />
          Asignar Plan a Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Suscripción</DialogTitle>
          <DialogDescription>
            Asigna un plan de suscripción activo a una empresa.
          </DialogDescription>
        </DialogHeader>
        <form action={assignSubscription} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="empresaId">Empresa</Label>
            <select 
              id="empresaId" 
              name="empresaId" 
              required 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecciona una empresa</option>
              {empresas.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="planId">Plan de Suscripción</Label>
            <select 
              id="planId" 
              name="planId" 
              required 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecciona un plan</option>
              {planes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} (${p.precioMensual}/mes)</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit">Asignar Suscripción</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
