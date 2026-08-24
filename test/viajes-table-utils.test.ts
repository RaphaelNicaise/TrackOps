import { describe, it, expect } from "vitest";
import {
  DEFAULT_SORT,
  filterViajes,
  paginate,
  sortViajes,
  toggleSort,
  type ViajeSort,
} from "@/components/control-flota/viajes/viajes-table-utils";
import type { ViajeRow } from "@/types/flota-viajes";

function makeViaje(partial: Partial<ViajeRow> = {}): ViajeRow {
  return {
    id: 1,
    empresaId: 1,
    codigo: "VIA-0001",
    choferId: null,
    choferNombre: null,
    origenTipo: "SITIO",
    origenSitioId: null,
    origenNombre: "Origen",
    origenDireccion: "Calle 1",
    origenLat: 0,
    origenLng: 0,
    destinoTipo: "SITIO",
    destinoSitioId: null,
    destinoNombre: "Destino",
    destinoDireccion: "Calle 2",
    destinoLat: 0,
    destinoLng: 0,
    distanciaEstimadaKm: null,
    fechaSalidaProgramada: new Date("2026-08-10T08:00:00"),
    estado: "PLANIFICADO",
    kmInicio: null,
    kmFin: null,
    createdAt: new Date("2026-08-01T00:00:00"),
    updatedAt: new Date("2026-08-01T00:00:00"),
    ...partial,
  };
}

const baseViajes: ViajeRow[] = [
  makeViaje({
    id: 1,
    codigo: "VIA-0001",
    choferId: 10,
    choferNombre: "Juan Pérez",
    estado: "PLANIFICADO",
    distanciaEstimadaKm: 200,
    fechaSalidaProgramada: new Date("2026-08-10T08:00:00"),
    vehiculoPatente: "AB 123 CD",
  }),
  makeViaje({
    id: 2,
    codigo: "VIA-0002",
    choferId: null,
    choferNombre: null,
    estado: "EN_CURSO",
    distanciaEstimadaKm: 50,
    fechaSalidaProgramada: new Date("2026-08-12T23:59:00"),
  }),
  makeViaje({
    id: 3,
    codigo: "VIA-0003",
    choferId: 20,
    choferNombre: "Ana López",
    estado: "COMPLETADO",
    distanciaEstimadaKm: null,
    fechaSalidaProgramada: new Date("2026-08-15T12:00:00"),
  }),
];

describe("filterViajes", () => {
  it("filtra por estado", () => {
    const result = filterViajes(baseViajes, { estado: "EN_CURSO", query: "" });
    expect(result.map((v) => v.id)).toEqual([2]);
  });

  it("no filtra por estado cuando es TODOS", () => {
    const result = filterViajes(baseViajes, { estado: "TODOS", query: "" });
    expect(result).toHaveLength(3);
  });

  it("busca por código sin distinguir mayúsculas", () => {
    const result = filterViajes(baseViajes, { estado: "TODOS", query: "via-0003" });
    expect(result.map((v) => v.id)).toEqual([3]);
  });

  it("busca por patente", () => {
    const result = filterViajes(baseViajes, { estado: "TODOS", query: "ab 123" });
    expect(result.map((v) => v.id)).toEqual([1]);
  });

  it("filtra por chofer específico", () => {
    const result = filterViajes(baseViajes, { estado: "TODOS", query: "", choferId: 20 });
    expect(result.map((v) => v.id)).toEqual([3]);
  });

  it('filtra "sin asignar" cuando choferId es null', () => {
    const result = filterViajes(baseViajes, { estado: "TODOS", query: "", choferId: null });
    expect(result.map((v) => v.id)).toEqual([2]);
  });

  it("incluye todo el día para fechaDesde (viaje a las 00:00 del mismo día)", () => {
    const result = filterViajes(baseViajes, {
      estado: "TODOS",
      query: "",
      fechaDesde: new Date(2026, 7, 12),
    });
    expect(result.map((v) => v.id)).toEqual([2, 3]);
  });

  it("incluye todo el día para fechaHasta (viaje a las 23:59 del mismo día)", () => {
    const result = filterViajes(baseViajes, {
      estado: "TODOS",
      query: "",
      fechaHasta: new Date(2026, 7, 12),
    });
    expect(result.map((v) => v.id)).toEqual([1, 2]);
  });

  it("aplica rango de fechas completo", () => {
    const result = filterViajes(baseViajes, {
      estado: "TODOS",
      query: "",
      fechaDesde: new Date(2026, 7, 11),
      fechaHasta: new Date(2026, 7, 14),
    });
    expect(result.map((v) => v.id)).toEqual([2]);
  });

  it("combina múltiples filtros", () => {
    const result = filterViajes(baseViajes, {
      estado: "TODOS",
      query: "",
      choferId: 10,
      fechaDesde: new Date(2026, 7, 1),
      fechaHasta: new Date(2026, 7, 31),
    });
    expect(result.map((v) => v.id)).toEqual([1]);
  });
});

describe("sortViajes", () => {
  it("ordena por código ascendente", () => {
    const result = sortViajes(baseViajes, { field: "codigo", direction: "asc" });
    expect(result.map((v) => v.codigo)).toEqual(["VIA-0001", "VIA-0002", "VIA-0003"]);
  });

  it("ordena por fecha descendente", () => {
    const result = sortViajes(baseViajes, {
      field: "fechaSalidaProgramada",
      direction: "desc",
    });
    expect(result.map((v) => v.id)).toEqual([3, 2, 1]);
  });

  it("ordena por distancia numéricamente", () => {
    const result = sortViajes(baseViajes, { field: "distanciaEstimadaKm", direction: "asc" });
    expect(result.map((v) => v.distanciaEstimadaKm)).toEqual([50, 200, null]);
  });

  it("deja los nulos al final también en orden descendente", () => {
    const result = sortViajes(baseViajes, { field: "distanciaEstimadaKm", direction: "desc" });
    expect(result.map((v) => v.distanciaEstimadaKm)).toEqual([200, 50, null]);
  });

  it("deja los viajes sin chofer al final ordenando por chofer", () => {
    const result = sortViajes(baseViajes, { field: "choferNombre", direction: "asc" });
    expect(result[result.length - 1].choferNombre).toBeNull();
  });

  it("no muta el array original", () => {
    const original = [...baseViajes];
    sortViajes(baseViajes, { field: "codigo", direction: "desc" });
    expect(baseViajes).toEqual(original);
  });
});

describe("toggleSort", () => {
  it("empieza ascendente en una columna nueva", () => {
    const result = toggleSort(DEFAULT_SORT, "codigo");
    expect(result).toEqual({ field: "codigo", direction: "asc" });
  });

  it("alterna a descendente si se repite la columna", () => {
    const current: ViajeSort = { field: "codigo", direction: "asc" };
    expect(toggleSort(current, "codigo")).toEqual({ field: "codigo", direction: "desc" });
  });

  it("alterna de vuelta a ascendente", () => {
    const current: ViajeSort = { field: "codigo", direction: "desc" };
    expect(toggleSort(current, "codigo")).toEqual({ field: "codigo", direction: "asc" });
  });
});

describe("paginate", () => {
  const rows = Array.from({ length: 25 }, (_, i) => i);

  it("devuelve la primera página con el tamaño indicado", () => {
    const result = paginate(rows, 1, 10);
    expect(result.items).toHaveLength(10);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });

  it("devuelve la última página parcial", () => {
    const result = paginate(rows, 3, 10);
    expect(result.items).toHaveLength(5);
    expect(result.items[0]).toBe(20);
  });

  it("limita la página al rango válido", () => {
    const result = paginate(rows, 99, 10);
    expect(result.page).toBe(3);
    expect(result.items).toHaveLength(5);
  });

  it("maneja listas vacías con al menos una página", () => {
    const result = paginate([], 1, 10);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
  });

  it("cambia el total de páginas según el tamaño", () => {
    expect(paginate(rows, 1, 20).totalPages).toBe(2);
    expect(paginate(rows, 1, 50).totalPages).toBe(1);
  });
});
