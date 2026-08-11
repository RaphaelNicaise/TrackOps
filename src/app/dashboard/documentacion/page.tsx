import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { db } from "@/db";
import { documents, vehicles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { DocumentFormModal } from "./DocumentFormModal";

export default async function DocumentacionPage() {
  const session = await auth();
  const role = session?.user?.role;
  const empresaId = session?.user?.empresaId;

  let docs: any[] = [];
  let myVehicles: any[] = [];
  
  if (empresaId) {
    myVehicles = await db.select().from(vehicles).where(eq(vehicles.empresaId, empresaId));
    docs = await db.select({
      id: documents.id,
      tipoDocumento: documents.tipoDocumento,
      fileUrl: documents.fileUrl,
      fechaVencimiento: documents.fechaVencimiento,
      vehicle: { patente: vehicles.patente }
    }).from(documents)
      .leftJoin(vehicles, eq(documents.vehicleId, vehicles.id))
      .where(eq(vehicles.empresaId, empresaId))
      .orderBy(desc(documents.createdAt));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Documentación</h1>
          <p className="text-muted-foreground mt-2">Gestión de documentos.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN", "ADMIN_EMPRESA"]}>
            <DocumentFormModal vehicles={myVehicles} />
          </RequireRole>
        </div>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Vehículo</TableHead><TableHead>Tipo</TableHead><TableHead>Vencimiento</TableHead><TableHead>Archivo</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                  <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <span>No hay documentos.</span>
                </TableCell>
              </TableRow>
            ) : (
              docs.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.vehicle?.patente}</TableCell>
                  <TableCell className="capitalize">{doc.tipoDocumento}</TableCell>
                  <TableCell>{doc.fechaVencimiento ? new Date(doc.fechaVencimiento).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{doc.fileUrl ? <a href={doc.fileUrl} className="text-blue-500">Ver</a> : "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
