import { auth } from "@/auth";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getViajes, getChoferes, getSitios } from "@/lib/flota-actions";
import { isDemoSession } from "@/lib/demo-mode";
import { ViajesTable } from "@/components/control-flota/viajes/viajes-table";
import type { ViajeRow, SitioRow, ChoferRow } from "@/types/flota-viajes";

export const dynamic = "force-dynamic";

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
    origenDireccion: "Ruta Panamericana Km 85.5, Zárate",
    origenLat: -34.0987,
    origenLng: -59.0284,
    destinoTipo: "SITIO",
    destinoSitioId: 2,
    destinoNombre: "Depósito Logístico Rosario",
    destinoDireccion: "Av. Circunvalación 1200, Rosario",
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
    notas: "Carga de autopartes y repuestos industriales",
    creadoPor: "admin",
    createdAt: new Date("2026-08-20T10:00:00Z"),
    updatedAt: new Date("2026-08-20T10:00:00Z"),
  },
  {
    id: 2,
    empresaId: 1,
    codigo: "VIA-1002",
    choferId: 2,
    choferNombre: "Roberto González",
    vehiculoId: 2,
    vehiculoPatente: "EF 456 GH",
    origenTipo: "SITIO",
    origenSitioId: 2,
    origenNombre: "Depósito Logístico Rosario",
    origenDireccion: "Av. Circunvalación 1200, Rosario",
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
    notas: "Despacho prioritario de contenedores de exportación",
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
    origenDireccion: "Ruta Panamericana Km 85.5, Zárate",
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
    notas: "Entrega completada en tiempo y forma sin observaciones",
    creadoPor: "admin",
    createdAt: new Date("2026-08-17T09:00:00Z"),
    updatedAt: new Date("2026-08-18T09:25:00Z"),
  },
  {
    id: 4,
    empresaId: 1,
    codigo: "VIA-1004",
    choferId: null,
    choferNombre: null,
    vehiculoId: null,
    vehiculoPatente: null,
    origenTipo: "SITIO",
    origenSitioId: 1,
    origenNombre: "Planta Zárate (Central)",
    origenDireccion: "Ruta Panamericana Km 85.5, Zárate",
    origenLat: -34.0987,
    origenLng: -59.0284,
    destinoTipo: "SITIO",
    destinoSitioId: 2,
    destinoNombre: "Depósito Logístico Rosario",
    destinoDireccion: "Av. Circunvalación 1200, Rosario",
    destinoLat: -32.9511,
    destinoLng: -60.6664,
    distanciaEstimadaKm: 235,
    fechaSalidaProgramada: new Date("2026-08-19T10:00:00Z"),
    fechaLlegadaEstimada: new Date("2026-08-19T14:00:00Z"),
    fechaInicioReal: null,
    fechaFinReal: null,
    kmInicio: null,
    kmFin: null,
    estado: "CANCELADO",
    notas: "Cancelado por paro de actividades programado en planta receptora",
    creadoPor: "admin",
    createdAt: new Date("2026-08-18T11:00:00Z"),
    updatedAt: new Date("2026-08-19T08:00:00Z"),
  },
];

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
    contactoNombre: "Ing. Carlos Gómez",
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
    licenciaVencimiento: new Date("2026-09-10"),
    estado: "ACTIVO",
    vehiculoHabitualId: 2,
    vehiculoHabitualPatente: "EF 456 GH",
    vehiculoHabitualModelo: "Volkswagen Gol",
    notas: "Especialista en transporte de carga pesada",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
];

export default async function ViajesPage() {
  let tripRows: ViajeRow[] = [];
  let driverRows: ChoferRow[] = [];
  let siteRows: SitioRow[] = [];
  let vehicleRows: { id: number; patente: string; marca?: string; modelo?: string }[] = [];

  const demo = await isDemoSession();

  try {
    const session = await auth();
    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const empresaId = !isSuperAdmin ? session?.user?.empresaId : null;

    // 1. Fetch Viajes
    const viajesRes = await getViajes(empresaId ? { empresaId } : undefined);
    if (viajesRes.success && viajesRes.data && viajesRes.data.length > 0) {
      tripRows = viajesRes.data;
    } else if (demo) {
      tripRows = mockViajesFallback;
    }

    // 2. Fetch Choferes
    const choferesRes = await getChoferes(empresaId ? { empresaId } : undefined);
    if (choferesRes.success && choferesRes.data && choferesRes.data.length > 0) {
      driverRows = choferesRes.data;
    } else if (demo) {
      driverRows = mockChoferesFallback;
    }

    // 3. Fetch Sitios
    const sitiosRes = await getSitios(empresaId ? { empresaId } : undefined);
    if (sitiosRes.success && sitiosRes.data && sitiosRes.data.length > 0) {
      siteRows = sitiosRes.data;
    } else if (demo) {
      siteRows = mockSitiosFallback;
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
        vehicleRows = vList;
      } else if (demo) {
        vehicleRows = [
          { id: 1, patente: "AB 123 CD", marca: "Ford", modelo: "Ranger" },
          { id: 2, patente: "EF 456 GH", marca: "Volkswagen", modelo: "Gol" },
        ];
      }
    } catch (vErr) {
      console.warn("ViajesPage vehicles DB fallback:", vErr);
      if (demo) {
        vehicleRows = [
          { id: 1, patente: "AB 123 CD", marca: "Ford", modelo: "Ranger" },
          { id: 2, patente: "EF 456 GH", marca: "Volkswagen", modelo: "Gol" },
        ];
      }
    }
  } catch (error) {
    console.warn("ViajesPage DB fallback:", error);
    if (demo) {
      tripRows = mockViajesFallback;
      driverRows = mockChoferesFallback;
      siteRows = mockSitiosFallback;
      vehicleRows = [
        { id: 1, patente: "AB 123 CD", marca: "Ford", modelo: "Ranger" },
        { id: 2, patente: "EF 456 GH", marca: "Volkswagen", modelo: "Gol" },
      ];
    }
  }

  return (
    <ViajesTable
      initialViajes={tripRows}
      choferes={driverRows}
      sitios={siteRows}
      vehicles={vehicleRows}
    />
  );
}
