import { describe, it, expect } from "vitest";
import {
  formatFileSize,
  getFileIconType,
  getStorageKey,
} from "@/lib/storage";
import {
  CATEGORY_COLORS,
  getCategoryColor,
  DocumentCategory,
  VehicleDocumentItem,
} from "@/components/dashboard/vehiculos/documentos/types";

describe("Document Management End-to-End Flow & Logic", () => {
  describe("1. Storage Key Path Structure & Tenant Isolation", () => {
    it("generates isolated file keys strictly adhering to empresa and vehicle hierarchy", () => {
      const empresaId = 42;
      const vehicleId = 108;
      const fileName = "poliza_seguro_2026.pdf";

      const key = getStorageKey(empresaId, vehicleId, fileName);

      // Must start with empresa_${empresaId}/vehiculos/vehiculo_${vehicleId}/
      expect(key.startsWith(`empresa_${empresaId}/vehiculos/vehiculo_${vehicleId}/`)).toBe(true);
      // Must preserve the file extension
      expect(key.endsWith(".pdf")).toBe(true);
      // Regex validation for format: empresa_{id}/vehiculos/vehiculo_{id}/{timestamp}-{hash}.ext
      expect(key).toMatch(/^empresa_42\/vehiculos\/vehiculo_108\/\d+-[a-z0-9]+\.pdf$/);
    });

    it("handles filenames without extensions or special characters safely", () => {
      const keyNoExt = getStorageKey(1, 2, "archivoinfoconstancia");
      expect(keyNoExt).toMatch(/^empresa_1\/vehiculos\/vehiculo_2\/\d+-[a-z0-9]+\.bin$/);

      const keyComplex = getStorageKey(9, 99, "VTV - Inspección Técnica_2026.final.PDF");
      expect(keyComplex).toMatch(/^empresa_9\/vehiculos\/vehiculo_99\/\d+-[a-z0-9]+\.PDF$/);
    });

    it("ensures different empresas or vehicles do not collide in storage pathing", () => {
      const keyTenantA = getStorageKey(1, 10, "doc.pdf");
      const keyTenantB = getStorageKey(2, 10, "doc.pdf");
      const keyVehicleB = getStorageKey(1, 11, "doc.pdf");

      expect(keyTenantA).not.toEqual(keyTenantB);
      expect(keyTenantA).not.toEqual(keyVehicleB);
      expect(keyTenantA).toContain("empresa_1/vehiculos/vehiculo_10/");
      expect(keyTenantB).toContain("empresa_2/vehiculos/vehiculo_10/");
      expect(keyVehicleB).toContain("empresa_1/vehiculos/vehiculo_11/");
    });
  });

  describe("2. File Type Resolution and Size Formatters", () => {
    it("resolves correct icon types for supported extensions and MIME types", () => {
      // PDF
      expect(getFileIconType("application/pdf", "poliza.pdf")).toBe("pdf");
      expect(getFileIconType("", "DOCUMENTO.PDF")).toBe("pdf");

      // Images
      expect(getFileIconType("image/png", "foto.png")).toBe("image");
      expect(getFileIconType("image/jpeg", "cedula.jpg")).toBe("image");
      expect(getFileIconType("image/webp", "inspeccion.webp")).toBe("image");
      expect(getFileIconType("", "foto_auto.PNG")).toBe("image");

      // Word documents
      expect(
        getFileIconType(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "contrato.docx"
        )
      ).toBe("word");
      expect(getFileIconType("application/msword", "nota.doc")).toBe("word");

      // Excel spreadsheets
      expect(
        getFileIconType(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "mantenimiento.xlsx"
        )
      ).toBe("excel");
      expect(getFileIconType("application/vnd.ms-excel", "gastos.xls")).toBe("excel");
      expect(getFileIconType("text/csv", "telemetria.csv")).toBe("excel");

      // Generic files and archives (zip, tar, bin, etc.)
      expect(getFileIconType("application/zip", "backup.zip")).toBe("file");
      expect(getFileIconType("application/octet-stream", "firmware.bin")).toBe("file");
      expect(getFileIconType("", "desconocido")).toBe("file");
    });

    it("formats human-readable file sizes accurately across byte thresholds", () => {
      expect(formatFileSize(0)).toBe("0 B");
      expect(formatFileSize(512)).toBe("512 B");
      expect(formatFileSize(1023)).toBe("1023 B");
      expect(formatFileSize(1024)).toBe("1.0 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
      expect(formatFileSize(1024 * 1024 * 4.75)).toBe("4.8 MB");
      expect(formatFileSize(1024 * 1024 * 25)).toBe("25.0 MB");
    });
  });

  describe("3. Document Lifecycle State Transitions", () => {
    it("simulates full lifecycle: upload -> uncategorized -> categorized -> metadata update -> deletion", () => {
      // 1. Initial categories
      const categories: DocumentCategory[] = [
        { id: 1, nombre: "Seguro", color: "blue", empresaId: 10 },
        { id: 2, nombre: "RTO / VTV", color: "amber", empresaId: 10 },
      ];

      // 2. Upload state (starts uncategorized, categoryId = null)
      let doc: VehicleDocumentItem = {
        id: 101,
        vehicleId: 5,
        empresaId: 10,
        categoryId: null,
        title: "poliza_seguro_2026.pdf",
        fileName: "poliza_seguro_2026.pdf",
        fileKey: getStorageKey(10, 5, "poliza_seguro_2026.pdf"),
        fileSize: 1024 * 500, // 500 KB
        mimeType: "application/pdf",
        fechaVencimiento: null,
        notas: null,
        createdAt: new Date().toISOString(),
        category: null,
      };

      expect(doc.categoryId).toBeNull();
      expect(doc.category).toBeNull();

      // State store representation
      let docsList: VehicleDocumentItem[] = [doc];
      expect(docsList.filter((d) => d.categoryId === null)).toHaveLength(1);

      // 3. Move to category (e.g. Drag & Drop or Dropdown action to "Seguro")
      const targetCategory = categories.find((c) => c.id === 1)!;
      doc = {
        ...doc,
        categoryId: targetCategory.id,
        category: targetCategory,
      };
      docsList = docsList.map((d) => (d.id === doc.id ? doc : d));

      expect(doc.categoryId).toBe(1);
      expect(doc.category?.nombre).toBe("Seguro");
      expect(docsList.filter((d) => d.categoryId === 1)).toHaveLength(1);
      expect(docsList.filter((d) => d.categoryId === null)).toHaveLength(0);

      // 4. Update metadata (renaming title, adding expiration date and notes)
      const expirationDate = "2026-12-31T23:59:59.000Z";
      doc = {
        ...doc,
        title: "Póliza Todo Riesgo - La Segunda 2026",
        fechaVencimiento: expirationDate,
        notas: "Póliza vigente renovada automáticamente",
      };
      docsList = docsList.map((d) => (d.id === doc.id ? doc : d));

      expect(doc.title).toBe("Póliza Todo Riesgo - La Segunda 2026");
      expect(doc.fechaVencimiento).toBe(expirationDate);
      expect(doc.notas).toContain("renovada");

      // 5. Re-categorize to "RTO / VTV"
      const rtoCategory = categories.find((c) => c.id === 2)!;
      doc = {
        ...doc,
        categoryId: rtoCategory.id,
        category: rtoCategory,
      };
      docsList = docsList.map((d) => (d.id === doc.id ? doc : d));

      expect(doc.categoryId).toBe(2);
      expect(doc.category?.nombre).toBe("RTO / VTV");

      // 6. Delete document
      docsList = docsList.filter((d) => d.id !== doc.id);
      expect(docsList).toHaveLength(0);
    });
  });

  describe("4. Category Palette Integrity & Styling Options", () => {
    const requiredColors = [
      "blue",
      "emerald",
      "amber",
      "purple",
      "rose",
      "indigo",
      "cyan",
      "slate",
    ];

    it("contains all required brand colors with complete CSS token mappings", () => {
      for (const colorKey of requiredColors) {
        expect(CATEGORY_COLORS).toHaveProperty(colorKey);
        const palette = CATEGORY_COLORS[colorKey];
        expect(palette.value).toBe(colorKey);
        expect(palette.label).toBeTruthy();
        expect(palette.bg).toContain("bg-");
        expect(palette.text).toContain("text-");
        expect(palette.border).toContain("border-");
        expect(palette.dot).toContain("bg-");
        expect(palette.ring).toContain("ring-");
        expect(palette.activeBg).toContain("bg-");
      }
    });

    it("correctly handles getCategoryColor fallback", () => {
      expect(getCategoryColor("emerald").value).toBe("emerald");
      expect(getCategoryColor("nonexistent").value).toBe("blue");
      expect(getCategoryColor(null).value).toBe("blue");
      expect(getCategoryColor(undefined).value).toBe("blue");
    });
  });
});
