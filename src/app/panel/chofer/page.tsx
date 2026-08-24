import { auth } from "@/auth";
import { db } from "@/db";
import { choferes, vehicles } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { getViajes, getSitios } from "@/lib/flota-actions";
import { isDemoSession } from "@/lib/demo-mode";
import { ChoferDashboard } from "@/components/chofer/chofer-dashboard";
import type { ViajeRow, SitioRow, ChoferRow } from "@/types/flota-viajes";

export const dynamic = "force-dynamic";

const mockChoferDemo: ChoferRow = {
  id: 1,
  empresaId: 1,
  userId: "user-chofer-1",
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
};

const mockSitiosFallback: SitioRow[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Planta Zárate (Central)",
    tipo: "PLANTA",
    direccion: "Ruta Panamericana Km 85.5",
    ciudad: "Zárate",
    provincia: "Buenos Aires",
    lat: -34.0987,
    lng: -59.0284,
    radioMetros: 250,
    contactoNombre: "Carlos Gómez",
    contactoTelefono: "+54 9 3487 112233",
    activo: 1,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Depósito Logístico Rosario",
    tipo: "DEPOSITO",
    direccion: "Av. Circunvalación 1200",
    ciudad: "Rosario",
    provincia: "Santa Fe",
    lat: -32.9511,
    lng: -60.6664,
    radioMetros: 150,
    contactoNombre: "Mariana López",
    contactoTelefono: "+54 9 341 5566778",
    activo: 1,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
];

const mockViajesFallback: ViajeRow[] = [
  {
    id: 1,
    empresaId: 1,
    codigo: "VIA-1001",
    choferId: 1,
    choferNombre: "Juan Carlos Pérez",
    vehiculoId: 1,
    vehiculoPatente: "AB 123 CD",
    origenTipo: "SITIO",
    origenSitioId: 1,
    origenNombre: "Planta Zárate (Central)",
    origenDireccion: "Ruta Panamericana Km 85.5",
    origenLat: -34.0987,
    origenLng: -59.0284,
    destinoTipo: "SITIO",
    destinoSitioId: 2,
    destinoNombre: "Depósito Logístico Rosario",
    destinoDireccion: "Av. Circunvalación 1200",
    destinoLat: -32.9511,
    destinoLng: -60.6664,
    distanciaEstimadaKm: 235,
    fechaSalidaProgramada: new Date("2026-08-25T08:00:00Z"),
    fechaLlegadaEstimada: new Date("2026-08-25T12:30:00Z"),
    fechaInicioReal: null,
    fechaFinReal: null,
    kmInicio: null,
    kmFin: null,
    estado: "PLANIFICADO",
    notas: "Carga de repuestos industriales",
    creadoPor: "admin",
    createdAt: new Date("2026-08-20T10:00:00Z"),
    updatedAt: new Date("2026-08-20T10:00:00Z"),
  },
  {
    id: 2,
    empresaId: 1,
    codigo: "VIA-1002",
    choferId: 1,
    choferNombre: "Juan Carlos Pérez",
    vehiculoId: 1,
    vehiculoPatente: "AB 123 CD",
    origenTipo: "SITIO",
    origenSitioId: 2,
    origenNombre: "Depósito Logístico Rosario",
    origenDireccion: "Av. Circunvalación 1200",
    origenLat: -32.9511,
    origenLng: -60.6664,
    destinoTipo: "GOOGLE_PLACES",
    destinoSitioId: null,
    destinoNombre: "Puerto Buenos Aires",
    destinoDireccion: "Av. Ramón S. Castillo, Retiro, CABA",
    destinoLat: -34.5822,
    destinoLng: -58.3712,
    distanciaEstimadaKm: 310,
    fechaSalidaProgramada: new Date("2026-08-21T06:00:00Z"),
    fechaLlegadaEstimada: new Date("2026-08-21T11:00:00Z"),
    fechaInicioReal: new Date("2026-08-21T06:05:00Z"),
    fechaFinReal: null,
    kmInicio: 145200,
    kmFin: null,
    estado: "EN_CURSO",
    notas: "Entrega urgente de contenedores",
    creadoPor: "admin",
    createdAt: new Date("2026-08-19T14:00:00Z"),
    updatedAt: new Date("2026-08-21T06:05:00Z"),
  },
  {
    id: 3,
    empresaId: 1,
    codigo: "VIA-1003",
    choferId: 1,
    choferNombre: "Juan Carlos Pérez",
    vehiculoId: 1,
    vehiculoPatente: "AB 123 CD",
    origenTipo: "SITIO",
    origenSitioId: 1,
    origenNombre: "Planta Zárate (Central)",
    origenDireccion: "Ruta Panamericana Km 85.5",
    origenLat: -34.0987,
    origenLng: -59.0284,
    destinoTipo: "GOOGLE_PLACES",
    destinoSitioId: null,
    destinoNombre: "Mercado Central",
    destinoDireccion: "Autopista Ricchieri y Boulogne Sur Mer, Tapiales",
    destinoLat: -34.7119,
    destinoLng: -58.4875,
    distanciaEstimadaKm: 98,
    fechaSalidaProgramada: new Date("2026-08-18T07:00:00Z"),
    fechaLlegadaEstimada: new Date("2026-08-18T09:30:00Z"),
    fechaInicioReal: new Date("2026-08-18T07:02:00Z"),
    fechaFinReal: new Date("2026-08-18T09:25:00Z"),
    kmInicio: 144800,
    kmFin: 144905,
    estado: "COMPLETADO",
    notas: "Completado sin novedades",
    creadoPor: "admin",
    createdAt: new Date("2026-08-17T09:00:00Z"),
    updatedAt: new Date("2026-08-18T09:25:00Z"),
  },
];

const mockVehiclesFallback = [
  { id: 1, patente: "AB 123 CD", marca: "Ford", modelo: "Ranger" },
  { id: 2, patente: "EF 456 GH", marca: "Scania", modelo: "R450" },
];

export default async function ChoferPage() {
  let driverRecord: ChoferRow | null = null;
  let driverTrips: ViajeRow[] = [];
  let siteList: SitioRow[] = [];
  let vehicleList: { id: number; patente: string; marca?: string; modelo?: string }[] = [];

  const demo = await isDemoSession();

  try {
    const session = await auth();
    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const empresaId = !isSuperAdmin ? session?.user?.empresaId : null;
    const userId = session?.user?.id;

    // 1. Fetch Chofer record for current logged-in user
    try {
      const conditions = [];
      if (empresaId) {
        conditions.push(eq(choferes.empresaId, empresaId));
      }
      if (userId) {
        conditions.push(eq(choferes.userId, userId));
      }

      const foundChoferes = await db
        .select({
          id: choferes.id,
          empresaId: choferes.empresaId,
          userId: choferes.userId,
          nombre: choferes.nombre,
          apellido: choferes.apellido,
          dni: choferes.dni,
          telefono: choferes.telefono,
          email: choferes.email,
          licenciaNumero: choferes.licenciaNumero,
          licenciaCategoria: choferes.licenciaCategoria,
          licenciaVencimiento: choferes.licenciaVencimiento,
          estado: choferes.estado,
          vehiculoHabitualId: choferes.vehiculoHabitualId,
          notas: choferes.notas,
          createdAt: choferes.createdAt,
          updatedAt: choferes.updatedAt,
          vehiculoHabitualPatente: vehicles.patente,
          vehiculoHabitualModelo: vehicles.modelo,
        })
        .from(choferes)
        .leftJoin(vehicles, eq(choferes.vehiculoHabitualId, vehicles.id))
        .where(conditions.length > 0 ? or(...conditions) : undefined)
        .limit(1);

      if (foundChoferes && foundChoferes.length > 0) {
        driverRecord = foundChoferes[0] as ChoferRow;
      } else if (demo) {
        driverRecord = mockChoferDemo;
      }
    } catch (driverErr) {
      console.warn("ChoferPage driver fetch fallback:", driverErr);
      if (demo) {
        driverRecord = mockChoferDemo;
      }
    }

    // 2. Fetch Trips for this driver
    try {
      const viajesRes = await getViajes(
        driverRecord?.id ? { choferId: driverRecord.id } : undefined
      );
      if (viajesRes.success && viajesRes.data && viajesRes.data.length > 0) {
        driverTrips = viajesRes.data;
      } else if (demo && !driverRecord) {
        // Sin chofer real asociado, la demo muestra su agenda simulada
        driverTrips = mockViajesFallback;
      }
    } catch (tripsErr) {
      console.warn("ChoferPage trips fetch fallback:", tripsErr);
      if (demo && !driverRecord) {
        driverTrips = mockViajesFallback;
      }
    }

    // 3. Fetch Sites
    try {
      const sitiosRes = await getSitios(empresaId ? { empresaId } : undefined);
      if (sitiosRes.success && sitiosRes.data && sitiosRes.data.length > 0) {
        siteList = sitiosRes.data;
      } else if (demo) {
        siteList = mockSitiosFallback;
      }
    } catch (sitesErr) {
      console.warn("ChoferPage sites fetch fallback:", sitesErr);
      if (demo) {
        siteList = mockSitiosFallback;
      }
    }

    // 4. Fetch Vehicles
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
        vehicleList = vList;
      } else if (demo) {
        vehicleList = mockVehiclesFallback;
      }
    } catch (vErr) {
      console.warn("ChoferPage vehicles DB fallback:", vErr);
      if (demo) {
        vehicleList = mockVehiclesFallback;
      }
    }
  } catch (err) {
    console.warn("ChoferPage global error fallback:", err);
    if (demo) {
      driverRecord = mockChoferDemo;
      driverTrips = mockViajesFallback;
      siteList = mockSitiosFallback;
      vehicleList = mockVehiclesFallback;
    }
  }

  return (
    <ChoferDashboard
      driver={driverRecord}
      trips={driverTrips}
      sites={siteList}
      vehicles={vehicleList}
    />
  );
}
