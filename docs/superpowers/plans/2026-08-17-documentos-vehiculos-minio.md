# Sistema de Documentación de Vehículos con MinIO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el sistema completo de gestión de documentos para vehículos en TrackOps con almacenamiento en MinIO (jerarquía multi-tenant por empresa/vehículo), categorización dinámica con tablero interactivo Drag & Drop, previsualización en pestaña nueva, descarga, eliminación, navegación mejorada desde la tabla de vehículos y diseño responsive con fallback móvil.

**Architecture:** 
- Almacenamiento de archivos físicos en MinIO (`trackops/empresa_{id}/vehiculos/vehiculo_{id}/...`) a través del SDK S3.
- Base de datos en PostgreSQL con Drizzle ORM (`document_categories` y `vehicle_documents`).
- API Routes en Next.js App Router para subida multipart, proxy streaming con headers `inline`/`attachment`, y actualización de categorías.
- Tablero Drag & Drop en React con `framer-motion` y eventos HTML5/Pointer con actualización optimista de estado y fallback táctil mediante selectores rápidos.

**Tech Stack:** Next.js 14 App Router, TypeScript, Drizzle ORM, PostgreSQL, MinIO (@aws-sdk/client-s3), Framer Motion, Tailwind CSS, Radix UI / shadcn, Lucide React, date-fns, Vitest.

## Global Constraints
- TypeScript estricto sin `any` innecesarios.
- No romper datos existentes ni rutas de la flota.
- MinIO: bucket `trackops`, prefijos `empresa_{empresaId}/vehiculos/vehiculo_{vehicleId}/`.
- Mobile first & responsive: soporte para pantallas táctiles y desktop.

---

### Task 1: Schema de Base de Datos y Migración Drizzle

**Files:**
- Modify: `src/db/schema.ts`
- Test: `test/db/documents-schema.test.ts`

**Interfaces:**
- Produces: `documentCategories`, `vehicleDocuments` Drizzle table objects.

- [ ] **Step 1: Write test for database schema definitions**

```typescript
// test/db/documents-schema.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/db/documents-schema.test.ts`
Expected: FAIL with "documentCategories is not defined" or similar.

- [ ] **Step 3: Update `src/db/schema.ts` with `documentCategories` and `vehicleDocuments`**

```typescript
// Add to src/db/schema.ts:
export const documentCategories = pgTable("document_categories", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  nombre: text("nombre").notNull(),
  color: varchar("color", { length: 30 }).default("blue").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicleDocuments = pgTable("vehicle_documents", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  categoryId: integer("category_id").references(() => documentCategories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  fileKey: text("file_key").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fechaVencimiento: timestamp("fecha_vencimiento"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/db/documents-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit schema changes**

```bash
git add src/db/schema.ts test/db/documents-schema.test.ts
git commit -m "feat(db): add documentCategories and vehicleDocuments tables"
```

---

### Task 2: Servicio y Utilidades de MinIO / S3 Storage

**Files:**
- Create: `src/lib/storage.ts`
- Modify: `src/lib/minio.ts`
- Test: `test/lib/storage.test.ts`

**Interfaces:**
- Consumes: S3Client de `@aws-sdk/client-s3`.
- Produces:
  - `ensureBucketExists(): Promise<void>`
  - `uploadVehicleDocument(params: { empresaId: number; vehicleId: number; file: Buffer | Uint8Array; fileName: string; mimeType: string }): Promise<{ fileKey: string; fileSize: number }>`
  - `getDocumentStream(fileKey: string): Promise<{ stream: ReadableStream | NodeJS.ReadableStream; contentType: string; contentLength?: number }>`
  - `deleteVehicleDocument(fileKey: string): Promise<void>`
  - `formatFileSize(bytes: number): string`
  - `getFileIconType(mimeType: string, fileName: string): "pdf" | "image" | "word" | "excel" | "file"`

- [ ] **Step 1: Write tests for storage utility helpers**

```typescript
// test/lib/storage.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/lib/storage.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/lib/storage.ts` and ensure MinIO client robustness**

```typescript
// src/lib/storage.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

export const BUCKET_NAME = process.env.MINIO_BUCKET || "trackops";

const minioEndpoint = process.env.MINIO_ENDPOINT || "localhost";
const minioPort = process.env.MINIO_PORT || "9002";
const useSSL = process.env.MINIO_USE_SSL === "true";

export const s3Client = new S3Client({
  endpoint: process.env.NODE_ENV === "production" && process.env.S3_ENDPOINT
    ? process.env.S3_ENDPOINT
    : `${useSSL ? "https" : "http"}://${minioEndpoint}:${minioPort}`,
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || "minioadmin",
  },
  forcePathStyle: true,
});

let bucketChecked = false;
export async function ensureBucketExists(): Promise<void> {
  if (bucketChecked) return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    bucketChecked = true;
  } catch {
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      bucketChecked = true;
    } catch (e) {
      console.warn("Could not create bucket (it may already exist):", e);
    }
  }
}

export function getStorageKey(empresaId: number, vehicleId: number, originalName: string): string {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return `empresa_${empresaId}/vehiculos/vehiculo_${vehicleId}/${uniqueId}.${ext}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIconType(mimeType: string, fileName: string): "pdf" | "image" | "word" | "excel" | "file" {
  const lowerName = fileName.toLowerCase();
  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf";
  if (mimeType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(lowerName)) return "image";
  if (mimeType.includes("word") || /\.(doc|docx)$/i.test(lowerName)) return "word";
  if (mimeType.includes("sheet") || mimeType.includes("excel") || /\.(xls|xlsx|csv)$/i.test(lowerName)) return "excel";
  return "file";
}

export async function uploadVehicleDocument(params: {
  empresaId: number;
  vehicleId: number;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<{ fileKey: string; fileSize: number }> {
  await ensureBucketExists();
  const fileKey = getStorageKey(params.empresaId, params.vehicleId, params.fileName);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: params.fileBuffer,
      ContentType: params.mimeType,
    })
  );
  return { fileKey, fileSize: params.fileBuffer.length };
}

export async function getDocumentStream(fileKey: string) {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    })
  );
  return {
    stream: response.Body,
    contentType: response.ContentType || "application/octet-stream",
    contentLength: response.ContentLength,
  };
}

export async function deleteVehicleDocument(fileKey: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    })
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/lib/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit storage utilities**

```bash
git add src/lib/storage.ts src/lib/minio.ts test/lib/storage.test.ts
git commit -m "feat(storage): MinIO bucket management and storage utilities"
```

---

### Task 3: API Endpoints para Documentos y Categorías

**Files:**
- Create: `src/app/api/vehicles/[id]/documents/route.ts`
- Create: `src/app/api/vehicles/[id]/categories/route.ts`
- Create: `src/app/api/documents/[id]/route.ts`
- Create: `src/app/api/documents/[id]/view/route.ts`
- Create: `src/app/api/documents/[id]/download/route.ts`

**Interfaces:**
- Produces:
  - `GET /api/vehicles/[id]/documents`: Listado de documentos y categorías del vehículo.
  - `POST /api/vehicles/[id]/documents`: Subida multipart de 1 o N archivos.
  - `GET /api/vehicles/[id]/categories` & `POST /api/vehicles/[id]/categories`: Gestión de categorías.
  - `PATCH /api/documents/[id]`: Modificar categoría o metadatos.
  - `DELETE /api/documents/[id]`: Borrado en MinIO y DB.
  - `GET /api/documents/[id]/view`: Stream inline para abrir en pestaña.
  - `GET /api/documents/[id]/download`: Stream attachment para descarga.

- [ ] **Step 1: Implement `src/app/api/vehicles/[id]/categories/route.ts`**
  - Manejo de GET (trae categorías de la empresa, si no hay ninguna crea por defecto: Seguro, Cédula, RTO / VTV, Service).
  - Manejo de POST (crea nueva categoría con nombre y color).

- [ ] **Step 2: Implement `src/app/api/vehicles/[id]/documents/route.ts`**
  - GET: Retorna documentos del vehículo ordenados por `createdAt DESC` con join de categoría.
  - POST: Procesa `FormData`, itera sobre `files`, sube cada uno a MinIO mediante `uploadVehicleDocument`, guarda en `vehicleDocuments` con `categoryId = null` (o el provisto) y responde con los documentos insertados.

- [ ] **Step 3: Implement `src/app/api/documents/[id]/route.ts`**
  - PATCH: Actualiza `categoryId`, `title`, `fechaVencimiento`, `notas`.
  - DELETE: Busca el documento, borra de MinIO (`deleteVehicleDocument`) y elimina de la tabla `vehicleDocuments`.

- [ ] **Step 4: Implement `src/app/api/documents/[id]/view/route.ts` & `download/route.ts`**
  - Validar sesión y pertenencia a la empresa.
  - Obtener el stream desde MinIO con `getDocumentStream`.
  - Para `view`: `Content-Disposition: inline; filename="..."`.
  - Para `download`: `Content-Disposition: attachment; filename="..."`.
  - Convertir el stream de AWS SDK a Web `ReadableStream` para `NextResponse`.

- [ ] **Step 5: Commit API endpoints**

```bash
git add src/app/api/vehicles/[id]/documents/route.ts src/app/api/vehicles/[id]/categories/route.ts src/app/api/documents/[id]/route.ts src/app/api/documents/[id]/view/route.ts src/app/api/documents/[id]/download/route.ts
git commit -m "feat(api): endpoints for vehicle documents upload, categories, view/download proxy"
```

---

### Task 4: Componentes de UI — Tarjeta de Documento y Dropzones de Categoría

**Files:**
- Create: `src/components/dashboard/vehiculos/documentos/documento-card.tsx`
- Create: `src/components/dashboard/vehiculos/documentos/categoria-dropzone.tsx`
- Create: `src/components/dashboard/vehiculos/documentos/upload-dropzone.tsx`
- Create: `src/components/dashboard/vehiculos/documentos/nueva-categoria-dialog.tsx`

**Interfaces:**
- Produces:
  - `<DocumentoCard doc={doc} categories={categories} onMoveCategory={...} onDelete={...} />`
  - `<CategoriaDropzone category={cat} docs={docs} onDropDoc={...} ... />`
  - `<UploadDropzone onUpload={...} isUploading={...} />`
  - `<NuevaCategoriaDialog open={...} onOpenChange={...} onCreate={...} />`

- [ ] **Step 1: Implement `DocumentoCard`**
  - Ícono según extensión/MIME (PDF en rojo, Imagen en violeta/azul, Word en azul, Excel en verde).
  - Título / nombre de archivo legible con truncate.
  - Peso formateado y fecha de carga.
  - Botón Ver (abre `/api/documents/${doc.id}/view` en `_blank`).
  - Botón Descargar (descarga `/api/documents/${doc.id}/download`).
  - Botón Eliminar (con AlertDialog / confirmación).
  - Selector móvil / menú desplegable "Mover a..." para cambios rápidos con 1 tap.
  - Atributos `draggable` y `onDragStart` para arrastrar fluidamente.

- [ ] **Step 2: Implement `UploadDropzone`**
  - Dropzone visual amplia con ícono de nube/subida, feedback de dragover (`border-primary bg-primary/5`), botón para seleccionar archivos locales múltiples.
  - Barra de progreso o estado de subida mientras sube a MinIO.

- [ ] **Step 3: Implement `CategoriaDropzone`**
  - Contenedor de categoría con título, badge de color, contador de archivos.
  - Eventos `onDragOver`, `onDragLeave`, `onDrop` con animación de recepción (`scale: 1.02` y ring border).
  - Lista de `DocumentoCard` pertenecientes a la categoría.
  - Estado vacío visual elegante ("Soltá un archivo aquí").

- [ ] **Step 4: Implement `NuevaCategoriaDialog`**
  - Diálogo modal con input de nombre y selección de paleta de color (Azul, Esmeralda, Ámbar, Violeta, Rosa, Índigo).
  - Validación de nombre no vacío y llamada a API para crear.

- [ ] **Step 5: Commit UI subcomponents**

```bash
git add src/components/dashboard/vehiculos/documentos/
git commit -m "feat(ui): DocumentoCard, CategoriaDropzone, UploadDropzone, and NuevaCategoriaDialog"
```

---

### Task 5: Componente Principal `VehiculoDocumentos` con Drag & Drop y Tablero Fluido

**Files:**
- Create: `src/components/dashboard/vehiculos/documentos/vehiculo-documentos.tsx`
- Modify: `src/components/dashboard/vehiculos/vehiculo-detail.tsx`

**Interfaces:**
- Produces: `<VehiculoDocumentos vehicleId={vehicle.id} empresaId={vehicle.empresaId} />`
- Updates: Pestaña "Documentación" de `VehiculoDetail`.

- [ ] **Step 1: Implement `VehiculoDocumentos`**
  - Fetch de documentos y categorías del vehículo (`useQuery` o `useEffect` + `useState`).
  - Manejo de Drag & Drop:
    - `handleDragStart(docId: number)`
    - `handleDropOnCategory(categoryId: number | null)`
    - Actualización optimista del estado local (`setDocuments(prev => ...)`) para respuesta instantánea.
    - Llamada en segundo plano a `PATCH /api/documents/${docId}` con reversión si falla.
  - Manejo de subida: múltiples archivos con feedback visual y aparición inmediata en la bandeja "Sin categoría".
  - Layout responsivo:
    - Desktop: Split panel con Panel Izquierdo (Dropzone + Bandeja "Sin categoría") y Panel Derecho (Grilla de Categorías + Botón Nueva Categoría).
    - Mobile: Apilado vertical con botones táctiles y selectores "Mover a..." accesibles.
  - Animaciones fluidas con `framer-motion` (`AnimatePresence`, `layout`).

- [ ] **Step 2: Integrate `VehiculoDocumentos` into `VehiculoDetail`**
  - Importar `VehiculoDocumentos` y reemplazar el placeholder de `TabsContent value="documentacion"`.
  - Soportar lectura del parámetro `tab` de la URL para activar automáticamente la pestaña de documentación si se llega desde un link directo.

- [ ] **Step 3: Commit integration**

```bash
git add src/components/dashboard/vehiculos/documentos/vehiculo-documentos.tsx src/components/dashboard/vehiculos/vehiculo-detail.tsx
git commit -m "feat: complete VehiculoDocumentos board with drag-and-drop and detail tab integration"
```

---

### Task 6: Navegación por Click en Toda la Fila de la Tabla de Vehículos

**Files:**
- Modify: `src/components/dashboard/vehiculos/vehiculos-table.tsx`

- [ ] **Step 1: Make entire `<TableRow>` clickable and preserve nested interactions**
  - Usar `useRouter` de `next/navigation` o envolver en fila interactiva (`onClick={() => router.push(`/dashboard/control-flota/vehiculos/${v.id}`)}`).
  - Configurar link del badge `docCount` para apuntar a `/dashboard/control-flota/vehiculos/${v.id}?tab=documentacion`.
  - Añadir estilos de cursor pointer y hover suaves.
  - Evitar dobles navegaciones al clickear botones o links internos (`e.stopPropagation()`).

- [ ] **Step 2: Commit table row click improvements**

```bash
git add src/components/dashboard/vehiculos/vehiculos-table.tsx
git commit -m "feat(vehiculos): make full table row clickable and direct link to docs tab"
```

---

### Task 7: Verificación Integral, Tests y Validaciones

**Files:**
- Test: `test/documents/documents-flow.test.ts`

- [ ] **Step 1: Write integration verification tests**
  - Validar lógica de subida, categorización, generación de claves MinIO y filtrado por empresa/vehículo.
- [ ] **Step 2: Run all tests with Vitest**
  - Run: `npm run test`
  - Expected: All tests pass.
- [ ] **Step 3: Run TypeScript compiler check**
  - Run: `npx tsc --noEmit`
  - Expected: Clean compilation without errors.
- [ ] **Step 4: Commit all final changes**

```bash
git add .
git commit -m "feat(documentos): full vehicle documentation system with MinIO and drag-and-drop"
```
