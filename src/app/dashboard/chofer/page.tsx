import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";
import { db } from "@/db";
import { shiftLogs, vehicles } from "@/db/schema";
import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { startShift, endShift } from "@/lib/actions";

export default async function ChoferPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const empresaId = session?.user?.empresaId;

  if (!userId || !empresaId) return <div>No autorizado.</div>;

  const myVehicles = await db.select().from(vehicles).where(eq(vehicles.empresaId, empresaId));
  
  const activeShift = await db.select().from(shiftLogs)
    .where(and(eq(shiftLogs.userId, userId), isNull(shiftLogs.endTime))).limit(1);

  const pastShifts = await db.select({
    id: shiftLogs.id, startTime: shiftLogs.startTime, endTime: shiftLogs.endTime,
    startKm: shiftLogs.startKm, endKm: shiftLogs.endKm,
    vehicle: { patente: vehicles.patente, marca: vehicles.marca }
  }).from(shiftLogs)
    .leftJoin(vehicles, eq(shiftLogs.vehicleId, vehicles.id))
    .where(and(eq(shiftLogs.userId, userId), isNotNull(shiftLogs.endTime)))
    .orderBy(desc(shiftLogs.endTime)).limit(10);

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonthShifts = pastShifts.filter(s => new Date(s.endTime!) >= startOfMonth);
  const kmRecorridosEsteMes = thisMonthShifts.reduce((acc, shift) => acc + ((shift.endKm || 0) - (shift.startKm || 0)), 0);

  return (
    <div className="flex flex-col gap-8">
      <div><h1 className="text-3xl font-semibold tracking-tight">Panel de Chofer</h1></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 border rounded-lg bg-card text-center">
          <h3 className="text-lg font-medium">Km Recorridos (Mes)</h3><p className="text-3xl font-bold">{kmRecorridosEsteMes} km</p>
        </div>
        <div className="p-6 border rounded-lg bg-card text-center">
          <h3 className="text-lg font-medium">Estado del Turno</h3>
          {activeShift.length > 0 ? <p className="text-green-500 font-bold">Activo</p> : <p className="text-muted-foreground">Inactivo</p>}
        </div>
      </div>

      <div className="p-6 border rounded-lg bg-card">
        {activeShift.length === 0 ? (
          <form action={startShift} className="flex flex-col gap-4 max-w-sm">
            <h2 className="text-xl font-semibold">Iniciar Turno</h2>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Vehículo</label>
              <select name="vehicleId" required className="border p-2 rounded-md"><option value="">Seleccionar...</option>{myVehicles.map(v => <option key={v.id} value={v.id}>{v.patente}</option>)}</select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Km Inicial</label><input type="number" name="startKm" required className="border p-2 rounded-md" />
            </div>
            <Button type="submit" className="w-full">Iniciar</Button>
          </form>
        ) : (
          <form action={endShift} className="flex flex-col gap-4 max-w-sm">
            <h2 className="text-xl font-semibold">Finalizar Turno</h2>
            <input type="hidden" name="shiftId" value={activeShift[0].id} />
            <input type="hidden" name="vehicleId" value={activeShift[0].vehicleId} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Km Final</label><input type="number" name="endKm" required className="border p-2 rounded-md" />
            </div>
            <Button type="submit" variant="destructive" className="w-full">Finalizar</Button>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Historial de Turnos Anteriores</h2>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Inicio</TableHead><TableHead>Fin</TableHead><TableHead>Vehículo</TableHead><TableHead>Recorrido</TableHead></TableRow></TableHeader>
            <TableBody>
              {pastShifts.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.startTime).toLocaleString()}</TableCell>
                  <TableCell>{s.endTime ? new Date(s.endTime).toLocaleString() : '-'}</TableCell>
                  <TableCell>{s.vehicle?.patente}</TableCell>
                  <TableCell>{((s.endKm || 0) - (s.startKm || 0))} km</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
