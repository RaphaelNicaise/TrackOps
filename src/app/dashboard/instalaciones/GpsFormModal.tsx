"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createGpsInstallation } from '@/lib/admin-actions';

export function GpsFormModal({ vehicles }: { vehicles: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nueva Instalación</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Instalación GPS</DialogTitle>
        </DialogHeader>
        <form action={async (formData) => {
          await createGpsInstallation(formData);
          setOpen(false);
        }} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Vehículo</label>
            <select name="vehicleId" className="w-full border rounded-md p-2 mt-1" required>
              <option value="">Seleccione vehículo...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.patente}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Dispositivo / Modelo</label>
            <Input name="dispositivo" required />
          </div>
          <div>
            <label className="text-sm font-medium">Serial</label>
            <Input name="serial" required />
          </div>
          <div>
            <label className="text-sm font-medium">Notas</label>
            <Input name="notas" />
          </div>
          <Button type="submit" className="w-full">Guardar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
