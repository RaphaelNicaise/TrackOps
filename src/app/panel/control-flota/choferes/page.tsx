import { auth } from "@/auth";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getChoferes } from "@/lib/flota-actions";
import { ChoferesTable } from "@/components/control-flota/choferes/choferes-table";
import type { ChoferRow } from "@/types/flota-viajes";

export const dynamic = "force-dynamic";

const mockChoferesFallback: ChoferRow[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Juan Carlos",
    apellido: "Pérez",
    dni: "30111222",
    telefono: "+54 9 11 2345 6789",
    email: "juan.perez@flota.local",
    licenciaNumero: "LIC-B1-30111222",
    licenciaCategoria: "B1",
    licenciaVencimiento: new Date("2027-08-15"),
    estado: "ACTIVO",
    vehiculoHabitualId: 1,
    vehiculoHabitualPatente: "AB 123 CD",
    vehiculoHabitualModelo: "Ford Ranger",
    notas: "Chofer asignado a rutas regionales",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Roberto",
    apellido: "González",
    dni: "28444555",
    telefono: "+54 9 11 9876 5432",
    email: "roberto.gonzalez@flota.local",
    licenciaNumero: "LIC-E1-28444555",
    licenciaCategoria: "E1",
    licenciaVencimiento: new Date("2026-09-10"), // Por vencer
    estado: "ACTIVO",
    vehiculoHabitualId: 2,
    vehiculoHabitualPatente: "EF 456 GH",
    vehiculoHabitualModelo: "Volkswagen Gol",
    notas: "Especialista en transporte de carga pesada",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: 3,
    empresaId: 1,
    nombre: "Marcelo",
    apellido: "Rodríguez",
    dni: "33777888",
    telefono: "+54 9 11 5566 7788",
    email: "marcelo.rodriguez@flota.local",
    licenciaNumero: "LIC-C1-33777888",
    licenciaCategoria: "C1",
    licenciaVencimiento: new Date("2024-12-01"), // Vencida
    estado: "LICENCIA_SUSPENDIDA",
    vehiculoHabitualId: null,
    vehiculoHabitualPatente: null,
    vehiculoHabitualModelo: null,
    notas: "Licencia en trámite de renovación médica",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: 4,
    empresaId: 1,
    nombre: "Esteban",
    apellido: "Benítez",
    dni: "35999000",
    telefono: "+54 9 11 3344 5566",
    email: "esteban.benitez@flota.local",
    licenciaNumero: "LIC-D2-35999000",
    licenciaCategoria: "D2",
    licenciaVencimiento: new Date("2028-04-20"),
    estado: "INACTIVO",
    vehiculoHabitualId: null,
    vehiculoHabitualPatente: null,
    vehiculoHabitualModelo: null,
    notas: "Licencia por período de descanso",
    createdAt: new Date("2024-04-10"),
    updatedAt: new Date("2024-04-10"),
  },
];

export default async function ChoferesPage() {
  let driverRows: ChoferRow[] = [];
  let vehicleRows: { id: number; patente: string; marca?: string; modelo?: string }[] = [];

  try {
    const session = await auth();
    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const empresaId = !isSuperAdmin ? session?.user?.empresaId : null;

    // 1. Fetch Choferes via Server Action
    const choferesRes = await getChoferes();
    if (choferesRes.success && choferesRes.data && choferesRes.data.length > 0) {
      driverRows = choferesRes.data;
    } else {
      driverRows = mockChoferesFallback;
    }

    // 2. Fetch Vehicles for Assignment Dropdown
    try {
      const vList = await db
        .select({
          id: vehicles.id,
          patente: vehicles.patente,
          marca: vehicles.marca,
          modelo: vehicles.modelo,
        })
        .from(vehicles)
        .where(empresaId ? eq(vehicles.empresaId, empresaId) : undefined)
        .orderBy(vehicles.patente);

      if (vList && vList.length > 0) {
        vehicleRows = vList;
      } else {
        vehicleRows = [
          { id: 1, patente: "AB 123 CD", marca: "Ford", modelo: "Ranger" },
          { id: 2, patente: "EF 456 GH", marca: "Volkswagen", modelo: "Gol" },
        ];
      }
    } catch (vErr) {
      console.warn("ChoferesPage vehicles DB fallback:", vErr);
      vehicleRows = [
        { id: 1, patente: "AB 123 CD", marca: "Ford", modelo: "Ranger" },
        { id: 2, patente: "EF 456 GH", marca: "Volkswagen", modelo: "Gol" },
      ];
    }
  } catch (error) {
    console.warn("ChoferesPage DB fallback:", error);
    driverRows = mockChoferesFallback;
    vehicleRows = [
      { id: 1, patente: "AB 123 CD", marca: "Ford", modelo: "Ranger" },
      { id: 2, patente: "EF 456 GH", marca: "Volkswagen", modelo: "Gol" },
    ];
  }

  return <ChoferesTable initialChoferes={driverRows} vehicles={vehicleRows} />;
}
