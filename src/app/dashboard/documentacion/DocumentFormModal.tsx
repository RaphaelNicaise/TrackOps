"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createDocument } from '@/lib/actions';

import { useState } from 'react';

export function DocumentFormModal({ vehicles }: { vehicles: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1"/> Subir Documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Subir Documento</DialogTitle></DialogHeader>
        <form action={async (formData) => {
          await createDocument(formData);
          setOpen(false);
        }} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Vehículo</label>
            <select name="vehicleId" required className="border p-2 rounded-md outline-none">
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.patente}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tipo</label>
            <select name="tipoDocumento" required className="border p-2 rounded-md outline-none">
              <option value="seguro">Seguro</option><option value="vtv">VTV / RTO</option>
              <option value="cedula">Cédula</option><option value="otro">Otro</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Vencimiento</label>
            <input type="date" name="fechaVencimiento" className="border p-2 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Archivo</label>
            <input type="file" name="documentFile" accept=".pdf,.doc,.docx,image/*" required className="border p-2 rounded-md" />
          </div>
          <Button type="submit" className="w-full mt-2">Guardar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
