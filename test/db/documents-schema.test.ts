import { describe, it, expect } from "vitest";
import { documentCategories, vehicleDocuments } from "@/db/schema";

describe("Documents Schema", () => {
  it("should have correct column definitions for documentCategories", () => {
    expect(documentCategories.id).toBeDefined();
    expect(documentCategories.empresaId).toBeDefined();
    expect(documentCategories.nombre).toBeDefined();
    expect(documentCategories.color).toBeDefined();
  });

  it("should have correct column definitions for vehicleDocuments", () => {
    expect(vehicleDocuments.id).toBeDefined();
    expect(vehicleDocuments.vehicleId).toBeDefined();
    expect(vehicleDocuments.empresaId).toBeDefined();
    expect(vehicleDocuments.categoryId).toBeDefined();
    expect(vehicleDocuments.fileName).toBeDefined();
    expect(vehicleDocuments.fileKey).toBeDefined();
    expect(vehicleDocuments.fileSize).toBeDefined();
    expect(vehicleDocuments.mimeType).toBeDefined();
  });
});
