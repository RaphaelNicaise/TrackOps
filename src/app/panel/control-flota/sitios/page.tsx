import { auth } from "@/auth";
import { getSitios } from "@/lib/flota-actions";
import { SitiosTable } from "@/components/control-flota/sitios/sitios-table";
import type { SitioRow } from "@/types/flota-viajes";

export const dynamic = "force-dynamic";

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
  {
    id: 3,
    empresaId: 1,
    nombre: "Cliente Cervecería Quilmes",
    tipo: "CLIENTE",
    direccion: "12 de Octubre 100",
    ciudad: "Quilmes",
    provincia: "Buenos Aires",
    lat: -34.7242,
    lng: -58.2608,
    radioMetros: 100,
    contactoNombre: "Esteban Rossi (Recepción)",
    contactoTelefono: "+54 9 11 4433 2211",
    activo: 1,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: 4,
    empresaId: 1,
    nombre: "Sucursal Córdoba Capital",
    tipo: "SUCURSAL",
    direccion: "Av. Colón 4500",
    ciudad: "Córdoba",
    provincia: "Córdoba",
    lat: -31.4135,
    lng: -64.181,
    radioMetros: 100,
    contactoNombre: "Laura Medina",
    contactoTelefono: "+54 9 351 9887766",
    activo: 1,
    createdAt: new Date("2024-04-10"),
    updatedAt: new Date("2024-04-10"),
  },
  {
    id: 5,
    empresaId: 1,
    nombre: "Taller Mecánico Central",
    tipo: "TALLER",
    direccion: "Av. Gaona 3400",
    ciudad: "Ciudadela",
    provincia: "Buenos Aires",
    lat: -34.6315,
    lng: -58.5412,
    radioMetros: 80,
    contactoNombre: "Horacio Martínez",
    contactoTelefono: "+54 9 11 6543 2100",
    activo: 1,
    createdAt: new Date("2024-04-20"),
    updatedAt: new Date("2024-04-20"),
  },
];

export default async function SitiosPage() {
  let siteRows: SitioRow[] = [];

  try {
    const session = await auth();
    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const empresaId = !isSuperAdmin ? session?.user?.empresaId : null;

    const res = await getSitios(empresaId ? { empresaId } : undefined);
    if (res.success && res.data && res.data.length > 0) {
      siteRows = res.data;
    } else {
      siteRows = mockSitiosFallback;
    }
  } catch (error) {
    console.warn("SitiosPage DB fallback:", error);
    siteRows = mockSitiosFallback;
  }

  return <SitiosTable initialSitios={siteRows} />;
}
