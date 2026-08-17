import { describe, it, expect } from "vitest";
import {
  CATEGORY_COLORS,
  getCategoryColor,
  DocumentCategory,
  VehicleDocumentItem,
} from "@/components/dashboard/vehiculos/documentos/types";

describe("Documentos Types & Color Utilities", () => {
  const mockCategories: DocumentCategory[] = [
    { id: 1, nombre: "Seguro", color: "blue", empresaId: 1 },
    { id: 2, nombre: "Cédula", color: "emerald", empresaId: 1 },
    { id: 3, nombre: "RTO / VTV", color: "amber", empresaId: 1 },
  ];

  const mockDoc: VehicleDocumentItem = {
    id: 10,
    vehicleId: 5,
    empresaId: 1,
    categoryId: 1,
    title: "Póliza La Segunda 2026",
    fileName: "poliza_seguro.pdf",
    fileKey: "empresa_1/vehiculos/vehiculo_5/123-poliza.pdf",
    fileSize: 1024 * 1024 * 2.5,
    mimeType: "application/pdf",
    fechaVencimiento: "2026-12-31T00:00:00.000Z",
    notas: "Vigente anual",
    createdAt: "2026-08-01T10:00:00.000Z",
    category: mockCategories[0],
  };

  it("returns correct color configuration for known color keys", () => {
    const blue = getCategoryColor("blue");
    expect(blue.value).toBe("blue");
    expect(blue.label).toBe("Azul");
    expect(blue.dot).toContain("bg-blue-500");

    const emerald = getCategoryColor("emerald");
    expect(emerald.value).toBe("emerald");
    expect(emerald.label).toBe("Esmeralda");

    const amber = getCategoryColor("amber");
    expect(amber.value).toBe("amber");
    expect(amber.label).toBe("Ámbar");

    const purple = getCategoryColor("purple");
    expect(purple.value).toBe("purple");
  });

  it("falls back to blue for unknown or null color keys", () => {
    const fallback = getCategoryColor("unknown_color");
    expect(fallback.value).toBe("blue");

    const nullFallback = getCategoryColor(null);
    expect(nullFallback.value).toBe("blue");
  });

  it("contains all expected color palette definitions", () => {
    const keys = Object.keys(CATEGORY_COLORS);
    expect(keys).toContain("blue");
    expect(keys).toContain("emerald");
    expect(keys).toContain("amber");
    expect(keys).toContain("purple");
    expect(keys).toContain("rose");
    expect(keys).toContain("indigo");
    expect(keys).toContain("cyan");
    expect(keys).toContain("slate");
  });

  it("validates VehicleDocumentItem structure", () => {
    expect(mockDoc.id).toBe(10);
    expect(mockDoc.fileName).toBe("poliza_seguro.pdf");
    expect(mockDoc.category?.nombre).toBe("Seguro");
  });
});
