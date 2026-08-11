import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { db } from "@/db";
import { users, shiftLogs, vehicles } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { ChoferFormModal } from "./ChoferFormModal";

export default async function PersonalPage() {
  const session = await auth();
  const role = session?.user?.role;
  const empresaId = session?.user?.empresaId;

  let choferes: any[] = [];
  if (empresaId) {
    choferes = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      activeShiftVehicle: { patente: vehicles.patente }
    }).from(users)
      .leftJoin(shiftLogs, and(eq(users.id, shiftLogs.userId), isNull(shiftLogs.endTime)))
      .leftJoin(vehicles, eq(shiftLogs.vehicleId, vehicles.id))
      .where(and(eq(users.empresaId, empresaId), eq(users.role, "CHOFER")));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-semibold tracking-tight">Personal / Choferes</h1></div>
        <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN", "ADMIN_EMPRESA"]}>
          <ChoferFormModal />
        </RequireRole>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead><TableHead>Unidad Asignada</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {choferes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                  <Search className="mx-auto mb-2" />
                  <span>No hay choferes.</span>
                </TableCell>
              </TableRow>
            ) : (
              choferes.map(ch => (
                <TableRow key={ch.id}>
                  <TableCell>{ch.name}</TableCell>
                  <TableCell>{ch.email}</TableCell>
                  <TableCell>{ch.role?.toLowerCase()}</TableCell>
                  <TableCell>{ch.activeShiftVehicle?.patente || "Ninguna"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
