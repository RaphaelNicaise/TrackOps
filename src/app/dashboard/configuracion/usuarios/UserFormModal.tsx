"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createUser } from '@/lib/admin-actions';

import { useState } from 'react';

export function UserFormModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary"><Plus className="mr-1 h-4 w-4"/> Añadir Usuario</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Invitar Usuario</DialogTitle></DialogHeader>
        <form action={async (formData) => {
          await createUser(formData);
          setOpen(false);
        }} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">Nombre</label><input type="text" name="name" required className="border p-2 rounded-md" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">Email</label><input type="email" name="email" required className="border p-2 rounded-md" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">Contraseña</label><input type="password" name="password" required className="border p-2 rounded-md" /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">Rol</label>
            <select name="role" required className="border p-2 rounded-md outline-none">
              <option value="CHOFER">Chofer</option>
              <option value="ADMIN_EMPRESA">Admin Empresa</option>
            </select>
          </div>
          <Button type="submit" className="w-full mt-2">Crear</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
