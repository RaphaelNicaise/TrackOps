"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createUser } from '@/lib/admin-actions';

import { useState } from 'react';

export function ChoferFormModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary"><Plus className="mr-1 h-4 w-4"/> Añadir Chofer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Añadir Nuevo Chofer</DialogTitle></DialogHeader>
        <form action={async (formData) => {
          await createUser(formData);
          setOpen(false);
        }} className="flex flex-col gap-4 mt-4">
          <input type="hidden" name="role" value="CHOFER" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nombre</label>
            <input type="text" name="name" required className="border p-2 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Email</label>
            <input type="email" name="email" required className="border p-2 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Contraseña</label>
            <input type="password" name="password" required className="border p-2 rounded-md" />
          </div>
          <Button type="submit" className="w-full mt-2">Crear Chofer</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
