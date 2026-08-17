import { describe, it, expect } from "vitest";
import { formatFileSize, getFileIconType, getStorageKey } from "@/lib/storage";

describe("Storage Utilities", () => {
  it("formats file sizes accurately", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });

  it("determines file icon type based on mime or extension", () => {
    expect(getFileIconType("application/pdf", "poliza.pdf")).toBe("pdf");
    expect(getFileIconType("image/png", "foto.png")).toBe("image");
    expect(getFileIconType("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "nota.docx")).toBe("word");
    expect(getFileIconType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "datos.xlsx")).toBe("excel");
    expect(getFileIconType("application/octet-stream", "archivo.bin")).toBe("file");
  });

  it("generates correct storage key path", () => {
    const key = getStorageKey(1, 4, "cedula.pdf");
    expect(key).toMatch(/^empresa_1\/vehiculos\/vehiculo_4\/\d+-[a-z0-9]+\.pdf$/);
  });
});
