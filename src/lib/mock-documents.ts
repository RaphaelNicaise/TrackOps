export type MockDocumentCategory = {
  id: number;
  empresaId: number;
  nombre: string;
  color: string;
  createdAt?: string | Date;
};

export type MockVehicleDocument = {
  id: number;
  vehicleId: number;
  empresaId: number;
  categoryId: number | null;
  title: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  fechaVencimiento: string | Date | null;
  notas: string | null;
  createdAt: string | Date;
  category?: {
    id: number;
    nombre: string;
    color: string;
  } | null;
};

export const defaultMockCategories: MockDocumentCategory[] = [
  { id: 1, empresaId: 1, nombre: "Seguro", color: "blue", createdAt: new Date("2026-01-01") },
  { id: 2, empresaId: 1, nombre: "Cédula", color: "emerald", createdAt: new Date("2026-01-01") },
  { id: 3, empresaId: 1, nombre: "RTO / VTV", color: "amber", createdAt: new Date("2026-01-01") },
  { id: 4, empresaId: 1, nombre: "Service", color: "purple", createdAt: new Date("2026-01-01") },
];

export let mockCategoriesStore: MockDocumentCategory[] = [...defaultMockCategories];

export let mockDocumentsStore: MockVehicleDocument[] = [
  {
    id: 101,
    vehicleId: 1,
    empresaId: 1,
    categoryId: 1,
    title: "Póliza La Segunda 2026",
    fileName: "poliza_seguro_ford_ranger.pdf",
    fileKey: "empresa_1/vehiculos/vehiculo_1/mock-poliza.pdf",
    fileSize: 1024 * 1024 * 2.4,
    mimeType: "application/pdf",
    fechaVencimiento: new Date("2027-02-28"),
    notas: "Cobertura Todo Riesgo con franquicia",
    createdAt: new Date("2026-02-15"),
    category: defaultMockCategories[0],
  },
  {
    id: 102,
    vehicleId: 1,
    empresaId: 1,
    categoryId: 2,
    title: "Cédula Verde - Titular",
    fileName: "cedula_verde_AB123CD.jpg",
    fileKey: "empresa_1/vehiculos/vehiculo_1/mock-cedula.jpg",
    fileSize: 1024 * 850,
    mimeType: "image/jpeg",
    fechaVencimiento: null,
    notas: "Escaneado legible",
    createdAt: new Date("2026-01-10"),
    category: defaultMockCategories[1],
  },
  {
    id: 103,
    vehicleId: 1,
    empresaId: 1,
    categoryId: 3,
    title: "Certificado RTO Vigente",
    fileName: "informe_tecnico_rto_2026.pdf",
    fileKey: "empresa_1/vehiculos/vehiculo_1/mock-rto.pdf",
    fileSize: 1024 * 1024 * 1.1,
    mimeType: "application/pdf",
    fechaVencimiento: new Date("2027-03-15"),
    notas: "Aprobado sin observaciones",
    createdAt: new Date("2026-03-15"),
    category: defaultMockCategories[2],
  },
  {
    id: 104,
    vehicleId: 2,
    empresaId: 1,
    categoryId: 1,
    title: "Seguro San Cristóbal",
    fileName: "seguro_volkswagen_gol.pdf",
    fileKey: "empresa_1/vehiculos/vehiculo_2/mock-seguro-gol.pdf",
    fileSize: 1024 * 1024 * 1.5,
    mimeType: "application/pdf",
    fechaVencimiento: new Date("2024-11-20"),
    notas: "Requiere renovación",
    createdAt: new Date("2024-05-10"),
    category: defaultMockCategories[0],
  },
  {
    id: 105,
    vehicleId: 3,
    empresaId: 1,
    categoryId: 4,
    title: "Factura Service 40.000km",
    fileName: "service_oficial_renault.pdf",
    fileKey: "empresa_1/vehiculos/vehiculo_3/mock-service.pdf",
    fileSize: 1024 * 450,
    mimeType: "application/pdf",
    fechaVencimiento: null,
    notas: "Cambio aceite y filtros",
    createdAt: new Date("2026-04-20"),
    category: defaultMockCategories[3],
  },
  {
    id: 106,
    vehicleId: 4,
    empresaId: 1,
    categoryId: null,
    title: "Remito de Revisión Mecánica",
    fileName: "remito_taller_mercedes.pdf",
    fileKey: "empresa_1/vehiculos/vehiculo_4/mock-remito.pdf",
    fileSize: 1024 * 320,
    mimeType: "application/pdf",
    fechaVencimiento: null,
    notas: "Pendiente de clasificar",
    createdAt: new Date("2026-08-10"),
    category: null,
  },
];

let nextDocId = 200;
let nextCatId = 10;

export function getMockCategories(empresaId: number = 1): MockDocumentCategory[] {
  return mockCategoriesStore.filter((c) => c.empresaId === empresaId);
}

export function addMockCategory(empresaId: number, nombre: string, color: string): MockDocumentCategory {
  const newCat: MockDocumentCategory = {
    id: nextCatId++,
    empresaId,
    nombre,
    color,
    createdAt: new Date(),
  };
  mockCategoriesStore.push(newCat);
  return newCat;
}

export function getMockDocuments(vehicleId: number): MockVehicleDocument[] {
  return mockDocumentsStore
    .filter((d) => d.vehicleId === vehicleId)
    .map((d) => {
      const cat = mockCategoriesStore.find((c) => c.id === d.categoryId);
      return {
        ...d,
        category: cat ? { id: cat.id, nombre: cat.nombre, color: cat.color } : null,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addMockDocument(data: {
  vehicleId: number;
  empresaId: number;
  categoryId: number | null;
  title: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  fechaVencimiento?: Date | string | null;
  notas?: string | null;
}): MockVehicleDocument {
  const cat = mockCategoriesStore.find((c) => c.id === data.categoryId);
  const newDoc: MockVehicleDocument = {
    id: nextDocId++,
    vehicleId: data.vehicleId,
    empresaId: data.empresaId,
    categoryId: data.categoryId,
    title: data.title,
    fileName: data.fileName,
    fileKey: data.fileKey,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    fechaVencimiento: data.fechaVencimiento || null,
    notas: data.notas || null,
    createdAt: new Date(),
    category: cat ? { id: cat.id, nombre: cat.nombre, color: cat.color } : null,
  };
  mockDocumentsStore.unshift(newDoc);
  return newDoc;
}

export function updateMockDocument(
  docId: number,
  patch: Partial<Pick<MockVehicleDocument, "categoryId" | "title" | "fechaVencimiento" | "notas">>
): MockVehicleDocument | null {
  const doc = mockDocumentsStore.find((d) => d.id === docId);
  if (!doc) return null;
  if (patch.categoryId !== undefined) doc.categoryId = patch.categoryId;
  if (patch.title !== undefined) doc.title = patch.title;
  if (patch.fechaVencimiento !== undefined) doc.fechaVencimiento = patch.fechaVencimiento;
  if (patch.notas !== undefined) doc.notas = patch.notas;
  const cat = mockCategoriesStore.find((c) => c.id === doc.categoryId);
  doc.category = cat ? { id: cat.id, nombre: cat.nombre, color: cat.color } : null;
  return doc;
}

export function deleteMockDocument(docId: number): boolean {
  const idx = mockDocumentsStore.findIndex((d) => d.id === docId);
  if (idx === -1) return false;
  mockDocumentsStore.splice(idx, 1);
  return true;
}
