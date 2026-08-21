import { auth } from "@/auth";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getMockVehiculo } from "@/lib/mock-vehicles";
import { VehiculoDetail } from "@/components/dashboard/vehiculos/vehiculo-detail";

export const dynamic = "force-dynamic";

export default async function VehiculoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);

  try {
    const session = await auth();

    const conditions = [
      eq(vehicles.id, id),
      ...(session?.user?.empresaId
        ? [eq(vehicles.empresaId, session.user.empresaId)]
        : []),
    ];

    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(...conditions));

    if (vehicle) return <VehiculoDetail vehicle={vehicle} />;
  } catch {
    // BD no disponible → fallback a datos mock
  }

  const mock = getMockVehiculo(id);
  if (!mock) notFound();

  return <VehiculoDetail vehicle={mock} />;
}