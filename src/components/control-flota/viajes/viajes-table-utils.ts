import { endOfDay, startOfDay } from "date-fns";
import type { ViajeEstado, ViajeRow } from "@/types/flota-viajes";

export type EstadoTab = ViajeEstado | "TODOS";

export type SortableField =
  | "codigo"
  | "choferNombre"
  | "fechaSalidaProgramada"
  | "distanciaEstimadaKm";

export type SortDirection = "asc" | "desc";

export interface ViajeSort {
  field: SortableField;
  direction: SortDirection;
}

export interface ViajesFilterState {
  estado: EstadoTab;
  query: string;
  /** undefined = todos los choferes; null = solo viajes sin chofer asignado */
  choferId?: number | null;
  fechaDesde?: Date | null;
  fechaHasta?: Date | null;
}

export const DEFAULT_SORT: ViajeSort = {
  field: "fechaSalidaProgramada",
  direction: "desc",
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export const DEFAULT_PAGE_SIZE: number = PAGE_SIZE_OPTIONS[0];

function toTime(value?: Date | string | null): number | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d.getTime();
}

function getComparable(viaje: ViajeRow, field: SortableField): string | number | null {
  switch (field) {
    case "codigo":
      return viaje.codigo ?? null;
    case "choferNombre":
      return viaje.choferNombre ?? null;
    case "fechaSalidaProgramada":
      return toTime(viaje.fechaSalidaProgramada);
    case "distanciaEstimadaKm":
      return viaje.distanciaEstimadaKm ?? null;
  }
}

export function filterViajes(
  viajes: ViajeRow[],
  filters: ViajesFilterState
): ViajeRow[] {
  let result = viajes;

  if (filters.estado !== "TODOS") {
    result = result.filter((v) => v.estado === filters.estado);
  }

  const q = filters.query.trim().toLowerCase();
  if (q) {
    result = result.filter((v) =>
      [
        v.codigo,
        v.origenNombre,
        v.origenDireccion,
        v.destinoNombre,
        v.destinoDireccion,
        v.choferNombre ?? "",
        v.vehiculoPatente ?? "",
        v.notas ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  if (filters.choferId !== undefined) {
    result = result.filter((v) => v.choferId === filters.choferId);
  }

  const desdeTime = filters.fechaDesde ? startOfDay(filters.fechaDesde).getTime() : null;
  const hastaTime = filters.fechaHasta ? endOfDay(filters.fechaHasta).getTime() : null;

  if (desdeTime !== null || hastaTime !== null) {
    result = result.filter((v) => {
      const salida = toTime(v.fechaSalidaProgramada);
      if (salida === null) return false;
      if (desdeTime !== null && salida < desdeTime) return false;
      if (hastaTime !== null && salida > hastaTime) return false;
      return true;
    });
  }

  return result;
}

/**
 * Ordena sin mutar el array original. Los valores nulos van siempre al final,
 * independientemente de la dirección del ordenamiento.
 */
export function sortViajes(viajes: ViajeRow[], sort: ViajeSort): ViajeRow[] {
  const dir = sort.direction === "asc" ? 1 : -1;

  return [...viajes].sort((a, b) => {
    const av = getComparable(a, sort.field);
    const bv = getComparable(b, sort.field);

    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (typeof av === "string" || typeof bv === "string") {
      return dir * String(av).localeCompare(String(bv), "es");
    }

    return dir * (av - bv);
  });
}

/** Alterna la dirección si es la misma columna; si es nueva, empieza ascendente. */
export function toggleSort(current: ViajeSort, field: SortableField): ViajeSort {
  if (current.field === field) {
    return { field, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { field, direction: "asc" };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginate<T>(rows: T[], page: number, pageSize: number): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: rows.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalPages,
  };
}
