"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createFuelTicket } from '@/lib/actions';

import { useState } from 'react';

export function FuelFormModal({ vehicles }: { vehicles: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1"/> Cargar Combustible
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Cargar Combustible</DialogTitle></DialogHeader>
        <form action={async (formData) => {
          await createFuelTicket(formData);
          setOpen(false);
        }} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Vehículo</label>
            <select name="vehicleId" required className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-primary/50">
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.patente} - {v.marca}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Fecha</label>
            <input type="date" name="fecha" required className="border p-2 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Kilometraje</label>
            <input type="number" name="kilometraje" required className="border p-2 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Litros</label>
            <input type="number" step="0.01" name="litros" required className="border p-2 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Costo Total</label>
            <input type="number" step="0.01" name="costoTotal" required className="border p-2 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Ticket (Opcional)</label>
            <input type="file" name="ticketFile" accept=".pdf,.doc,.docx,image/*" className="border p-2 rounded-md" />
          </div>
          <Button type="submit" className="w-full mt-2">Registrar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
