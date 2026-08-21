export type ChoferEstado = "ACTIVO" | "INACTIVO" | "LICENCIA_SUSPENDIDA";

export type SitioTipo =
  | "PLANTA"
  | "DEPOSITO"
  | "CLIENTE"
  | "SUCURSAL"
  | "PROVEEDOR"
  | "TALLER"
  | "OTRO";

export type ViajeEstado =
  | "PLANIFICADO"
  | "EN_CURSO"
  | "COMPLETADO"
  | "CANCELADO";

export type UbicacionTipo = "SITIO" | "GOOGLE_PLACES";

export interface ChoferRow {
  id: number;
  empresaId: number;
  userId?: string | null;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string | null;
  email?: string | null;
  licenciaNumero?: string | null;
  licenciaCategoria?: string | null;
  licenciaVencimiento?: Date | null;
  estado: ChoferEstado;
  vehiculoHabitualId?: number | null;
  notas?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joins opcionales para vistas
  vehiculoHabitualPatente?: string | null;
  vehiculoHabitualModelo?: string | null;
  userEmail?: string | null;
}

export interface CreateChoferInput {
  empresaId?: number;
  userId?: string | null;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string | null;
  email?: string | null;
  licenciaNumero?: string | null;
  licenciaCategoria?: string | null;
  licenciaVencimiento?: Date | string | null;
  estado?: ChoferEstado;
  vehiculoHabitualId?: number | null;
  notas?: string | null;
}

export interface UpdateChoferInput extends Partial<CreateChoferInput> {
  id: number;
}

export interface SitioRow {
  id: number;
  empresaId: number;
  nombre: string;
  tipo: SitioTipo;
  direccion: string;
  ciudad?: string | null;
  provincia?: string | null;
  lat: number;
  lng: number;
  radioMetros: number;
  contactoNombre?: string | null;
  contactoTelefono?: string | null;
  activo: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSitioInput {
  empresaId?: number;
  nombre: string;
  tipo?: SitioTipo;
  direccion: string;
  ciudad?: string | null;
  provincia?: string | null;
  lat: number;
  lng: number;
  radioMetros?: number;
  contactoNombre?: string | null;
  contactoTelefono?: string | null;
  activo?: number;
}

export interface UpdateSitioInput extends Partial<CreateSitioInput> {
  id: number;
}

export interface ViajeRow {
  id: number;
  empresaId: number;
  codigo: string;
  choferId?: number | null;
  choferNombre?: string | null;
  vehiculoId?: number | null;
  vehiculoPatente?: string | null;
  origenTipo: UbicacionTipo;
  origenSitioId?: number | null;
  origenNombre: string;
  origenDireccion: string;
  origenLat: number;
  origenLng: number;
  destinoTipo: UbicacionTipo;
  destinoSitioId?: number | null;
  destinoNombre: string;
  destinoDireccion: string;
  destinoLat: number;
  destinoLng: number;
  distanciaEstimadaKm?: number | null;
  fechaSalidaProgramada: Date;
  fechaLlegadaEstimada?: Date | null;
  fechaInicioReal?: Date | null;
  fechaFinReal?: Date | null;
  kmInicio?: number | null;
  kmFin?: number | null;
  estado: ViajeEstado;
  notas?: string | null;
  creadoPor?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateViajeInput {
  empresaId?: number;
  codigo?: string;
  choferId?: number | null;
  vehiculoId?: number | null;
  origenTipo?: UbicacionTipo;
  origenSitioId?: number | null;
  origenNombre: string;
  origenDireccion: string;
  origenLat: number;
  origenLng: number;
  destinoTipo?: UbicacionTipo;
  destinoSitioId?: number | null;
  destinoNombre: string;
  destinoDireccion: string;
  destinoLat: number;
  destinoLng: number;
  distanciaEstimadaKm?: number | null;
  fechaSalidaProgramada: Date | string;
  fechaLlegadaEstimada?: Date | string | null;
  estado?: ViajeEstado;
  notas?: string | null;
  creadoPor?: string | null;
}

export interface UpdateViajeInput extends Partial<CreateViajeInput> {
  id: number;
  fechaInicioReal?: Date | string | null;
  fechaFinReal?: Date | string | null;
  kmInicio?: number | null;
  kmFin?: number | null;
}

export interface ViajeFilters {
  empresaId?: number;
  choferId?: number;
  vehiculoId?: number;
  estado?: ViajeEstado | "TODOS";
  search?: string;
  fechaDesde?: Date | string;
  fechaHasta?: Date | string;
}

export interface ChoferFilters {
  empresaId?: number;
  estado?: ChoferEstado | "TODOS";
  search?: string;
}

export interface SitioFilters {
  empresaId?: number;
  tipo?: SitioTipo | "TODOS";
  search?: string;
  activo?: number;
}
