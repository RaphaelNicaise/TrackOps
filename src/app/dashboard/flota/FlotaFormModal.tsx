"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createVehicle } from '@/lib/actions';

import { useState } from 'react';

export function FlotaFormModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1"/> Añadir vehículo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Añadir nuevo vehículo</DialogTitle></DialogHeader>
        <form action={async (formData) => {
          await createVehicle(formData);
          setOpen(false);
        }} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Patente</label><input type="text" name="patente" required className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Chasis (VIN)</label><input type="text" name="chasis" required className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Marca</label><input type="text" name="marca" required className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Modelo</label><input type="text" name="modelo" required className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Año</label><input type="number" name="anio" required className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Kilometraje Actual</label><input type="number" name="kilometrajeActual" required className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tipo</label>
            <select name="tipo" required className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary/50">
              <option value="auto">Auto</option><option value="utilitario">Utilitario</option><option value="camion">Camión</option><option value="bus">Bus</option>
            </select>
          </div>
          <Button type="submit" className="w-full mt-2">Guardar Vehículo</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
