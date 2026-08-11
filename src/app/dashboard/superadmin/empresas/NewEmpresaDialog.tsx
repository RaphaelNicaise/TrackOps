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
import { createEmpresa } from "@/lib/admin-actions";

export function NewEmpresaDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Empresa</DialogTitle>
          <DialogDescription>
            Ingresa los datos para registrar una nueva empresa.
          </DialogDescription>
        </DialogHeader>
        <form action={createEmpresa} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre o Razón Social</Label>
            <Input id="nombre" name="nombre" required placeholder="Ej: Transportes del Norte S.A." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT</Label>
            <Input id="cuit" name="cuit" placeholder="Ej: 30-12345678-9" />
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit">Crear Empresa</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
