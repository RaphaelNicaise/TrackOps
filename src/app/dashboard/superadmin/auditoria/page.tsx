import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { RequireRole } from "@/components/auth/RequireRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/auth";

export default async function AuditoriaPage() {
  const session = await auth();
  const role = session?.user?.role as any;

  const logs = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return (
    <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro de Auditoría</h1>
          <p className="text-muted-foreground mt-2">
            Visualiza los últimos 100 eventos de actividad en el sistema.
          </p>
        </div>

        <Card className="rounded-xl shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle>Eventos de Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>ID Entidad</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      {log.userName || log.userId || "Sistema"}
                    </TableCell>
                    <TableCell>
                      {log.action === "CREATE" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">CREATE</Badge>
                      ) : log.action === "UPDATE" ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">UPDATE</Badge>
                      ) : log.action === "DELETE" ? (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">DELETE</Badge>
                      ) : (
                        <Badge variant="outline">{log.action}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{log.entityType}</TableCell>
                    <TableCell>{log.entityId || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground" title={log.details || ""}>
                      {log.details || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No hay registros de auditoría
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
}
