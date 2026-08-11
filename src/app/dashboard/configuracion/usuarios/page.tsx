import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UserFormModal } from "./UserFormModal";

export default async function UsuariosConfigPage() {
  const session = await auth();
  const role = session?.user?.role;
  const empresaId = session?.user?.empresaId;

  let allUsers: any[] = [];
  if (empresaId) {
    allUsers = await db.select().from(users).where(eq(users.empresaId, empresaId));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-semibold tracking-tight">Usuarios</h1></div>
        <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN", "ADMIN_EMPRESA"]}>
          <UserFormModal />
        </RequireRole>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="h-48 text-center">Sin usuarios.</TableCell></TableRow>
            ) : (
              allUsers.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.role}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
