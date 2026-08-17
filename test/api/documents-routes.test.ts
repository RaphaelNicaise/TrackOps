import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getCategories, POST as postCategories } from "@/app/api/vehicles/[id]/categories/route";
import { GET as getDocuments, POST as postDocuments } from "@/app/api/vehicles/[id]/documents/route";
import { PATCH as patchDocument, DELETE as deleteDocument } from "@/app/api/documents/[id]/route";
import { GET as viewDocument } from "@/app/api/documents/[id]/view/route";
import { GET as downloadDocument } from "@/app/api/documents/[id]/download/route";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  uploadVehicleDocument,
  getDocumentStream,
  deleteVehicleDocument,
} from "@/lib/storage";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  uploadVehicleDocument: vi.fn(),
  getDocumentStream: vi.fn(),
  deleteVehicleDocument: vi.fn(),
  formatFileSize: vi.fn((bytes) => `${bytes} B`),
  getFileIconType: vi.fn(() => "pdf"),
  getStorageKey: vi.fn(() => "mock-key"),
}));

vi.mock("@/db", () => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  return {
    db: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    },
  };
});

describe("Documents & Categories API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Categories Route (`/api/vehicles/[id]/categories`)", () => {
    it("returns 401 if unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);
      const res = await getCategories(new Request("http://localhost/api/vehicles/1/categories"), {
        params: { id: "1" },
      });
      expect(res.status).toBe(401);
    });

    it("returns 400 if vehicle ID is invalid", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);
      const res = await getCategories(new Request("http://localhost/api/vehicles/abc/categories"), {
        params: { id: "abc" },
      });
      expect(res.status).toBe(400);
    });

    it("seeds and returns default categories if none exist", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      // vehicle check
      const mockVehicleWhere = vi.fn().mockResolvedValueOnce([{ id: 1, empresaId: 1 }]);
      // category query (empty)
      const mockCatOrderBy = vi.fn().mockResolvedValueOnce([]);
      const mockCatWhere = vi.fn().mockReturnValue({ orderBy: mockCatOrderBy });

      // category insert defaults
      const seededCategories = [
        { id: 1, nombre: "Seguro", color: "blue", empresaId: 1 },
        { id: 2, nombre: "Cédula", color: "emerald", empresaId: 1 },
      ];
      const mockReturning = vi.fn().mockResolvedValueOnce(seededCategories);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });

      (db.select as any)
        .mockReturnValueOnce({ from: () => ({ where: mockVehicleWhere }) })
        .mockReturnValueOnce({ from: () => ({ where: mockCatWhere }) });

      (db.insert as any).mockReturnValueOnce({ values: mockValues });

      const res = await getCategories(new Request("http://localhost/api/vehicles/1/categories"), {
        params: { id: "1" },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(2);
      expect(data[0].nombre).toBe("Seguro");
    });

    it("creates a new category on POST", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const mockVehicleWhere = vi.fn().mockResolvedValueOnce([{ id: 1, empresaId: 1 }]);
      (db.select as any).mockReturnValueOnce({ from: () => ({ where: mockVehicleWhere }) });

      const createdCat = { id: 10, nombre: "Patente", color: "amber", empresaId: 1 };
      const mockReturning = vi.fn().mockResolvedValueOnce([createdCat]);
      (db.insert as any).mockReturnValueOnce({ values: () => ({ returning: mockReturning }) });

      const req = new Request("http://localhost/api/vehicles/1/categories", {
        method: "POST",
        body: JSON.stringify({ nombre: "Patente", color: "amber" }),
      });

      const res = await postCategories(req, { params: { id: "1" } });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.nombre).toBe("Patente");
    });
  });

  describe("Vehicle Documents Route (`/api/vehicles/[id]/documents`)", () => {
    it("returns formatted documents with category join on GET", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const mockVehicleWhere = vi.fn().mockResolvedValueOnce([{ id: 1, empresaId: 1 }]);
      const mockDocs = [
        {
          id: 100,
          vehicleId: 1,
          empresaId: 1,
          categoryId: 2,
          title: "Poliza Seguro",
          fileName: "poliza.pdf",
          fileKey: "key-1",
          fileSize: 1024,
          mimeType: "application/pdf",
          fechaVencimiento: null,
          notas: null,
          createdAt: new Date(),
          category: { id: 2, nombre: "Seguro", color: "blue" },
        },
      ];
      const mockDocsOrderBy = vi.fn().mockResolvedValueOnce(mockDocs);
      const mockDocsWhere = vi.fn().mockReturnValue({ orderBy: mockDocsOrderBy });
      const mockDocsLeftJoin = vi.fn().mockReturnValue({ where: mockDocsWhere });

      (db.select as any)
        .mockReturnValueOnce({ from: () => ({ where: mockVehicleWhere }) })
        .mockReturnValueOnce({
          from: () => ({
            leftJoin: mockDocsLeftJoin,
          }),
        });

      const res = await getDocuments(new Request("http://localhost/api/vehicles/1/documents"), {
        params: { id: "1" },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].category.nombre).toBe("Seguro");
    });

    it("uploads documents on multipart POST", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const mockVehicleWhere = vi.fn().mockResolvedValueOnce([{ id: 1, empresaId: 1 }]);
      (db.select as any).mockReturnValueOnce({ from: () => ({ where: mockVehicleWhere }) });

      vi.mocked(uploadVehicleDocument).mockResolvedValueOnce({
        fileKey: "uploaded-file-key",
        fileSize: 1234,
      });

      const mockReturning = vi.fn().mockResolvedValueOnce([
        {
          id: 200,
          vehicleId: 1,
          empresaId: 1,
          categoryId: 1,
          title: "test.pdf",
          fileName: "test.pdf",
          fileKey: "uploaded-file-key",
          fileSize: 1234,
          mimeType: "application/pdf",
        },
      ]);
      (db.insert as any).mockReturnValueOnce({ values: () => ({ returning: mockReturning }) });

      const formData = new FormData();
      const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
      formData.append("files", file);
      formData.append("categoryId", "1");

      const req = new Request("http://localhost/api/vehicles/1/documents", {
        method: "POST",
        body: formData,
      });

      const res = await postDocuments(req, { params: { id: "1" } });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].fileKey).toBe("uploaded-file-key");
    });
  });

  describe("Single Document Route (`/api/documents/[id]`)", () => {
    it("updates document metadata on PATCH", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const existingDoc = { id: 50, empresaId: 1, title: "Old Title" };
      (db.select as any).mockReturnValueOnce({
        from: () => ({ where: vi.fn().mockResolvedValueOnce([existingDoc]) }),
      });

      const updatedDoc = { ...existingDoc, title: "New Title", categoryId: 3 };
      (db.update as any).mockReturnValueOnce({
        set: () => ({ where: () => ({ returning: vi.fn().mockResolvedValueOnce([updatedDoc]) }) }),
      });

      const req = new Request("http://localhost/api/documents/50", {
        method: "PATCH",
        body: JSON.stringify({ title: "New Title", categoryId: 3 }),
      });

      const res = await patchDocument(req, { params: { id: "50" } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.title).toBe("New Title");
    });

    it("deletes file from storage and database on DELETE", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const existingDoc = { id: 50, empresaId: 1, fileKey: "doc-to-delete.pdf" };
      (db.select as any).mockReturnValueOnce({
        from: () => ({ where: vi.fn().mockResolvedValueOnce([existingDoc]) }),
      });

      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce([]),
      });

      const req = new Request("http://localhost/api/documents/50", { method: "DELETE" });
      const res = await deleteDocument(req, { params: { id: "50" } });

      expect(res.status).toBe(200);
      expect(deleteVehicleDocument).toHaveBeenCalledWith("doc-to-delete.pdf");
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe("Document Streaming Routes (`view` and `download`)", () => {
    it("streams inline document on view GET", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const doc = {
        id: 75,
        empresaId: 1,
        fileName: "poliza.pdf",
        fileKey: "path/poliza.pdf",
        mimeType: "application/pdf",
      };
      (db.select as any).mockReturnValueOnce({
        from: () => ({ where: vi.fn().mockResolvedValueOnce([doc]) }),
      });

      const mockWebStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("file content"));
          controller.close();
        },
      });

      vi.mocked(getDocumentStream).mockResolvedValueOnce({
        stream: mockWebStream as any,
        contentType: "application/pdf",
        contentLength: 12,
      });

      const res = await viewDocument(new Request("http://localhost/api/documents/75/view"), {
        params: { id: "75" },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(res.headers.get("Content-Disposition")).toContain("inline; filename=");
    });

    it("streams attachment document on download GET", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "u1", role: "ADMIN_EMPRESA", empresaId: 1 },
      } as any);

      const doc = {
        id: 75,
        empresaId: 1,
        fileName: "informe.xlsx",
        fileKey: "path/informe.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
      (db.select as any).mockReturnValueOnce({
        from: () => ({ where: vi.fn().mockResolvedValueOnce([doc]) }),
      });

      const mockWebStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("excel data"));
          controller.close();
        },
      });

      vi.mocked(getDocumentStream).mockResolvedValueOnce({
        stream: mockWebStream as any,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        contentLength: 10,
      });

      const res = await downloadDocument(new Request("http://localhost/api/documents/75/download"), {
        params: { id: "75" },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");
    });
  });
});
