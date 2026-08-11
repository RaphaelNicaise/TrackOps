import { db } from "@/db";
import { vehicles, fuelTickets, maintenanceLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import Papa from "papaparse";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.empresaId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // 'flota', 'gastos', etc.

  let csvString = "";

  if (type === "flota") {
    const myVehicles = await db.select().from(vehicles).where(eq(vehicles.empresaId, session.user.empresaId));
    csvString = Papa.unparse(myVehicles);
  } else {
    return new Response("Invalid export type", { status: 400 });
  }

  return new Response(csvString, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="export_${type}_${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
}
