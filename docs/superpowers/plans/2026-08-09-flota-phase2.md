# Flota Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Fuel Management, Document/Expiration Tracking, Fines Management, and S3 file uploads using local MinIO.

**Architecture:** Extend Drizzle schema with `fuelTickets`, `documents`, and `fines`. Implement an S3 client in `src/lib/s3.ts`. Create UI forms that accept files (tickets/docs) and use Server Actions to upload them to MinIO before inserting records into Postgres. 

**Tech Stack:** Next.js (App Router), Drizzle ORM, PostgreSQL, MinIO, @aws-sdk/client-s3.

## Global Constraints

- File uploads must go to the `trackops-archivos` bucket in MinIO.
- Ensure strict Row-Level isolation by explicitly checking `empresaId` on all queries.
- Read MinIO credentials from environment variables (`MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`).

---

### Task 1: Update Drizzle Schema

**Files:**
- Modify: `src/db/schema.ts:107-107`

**Interfaces:**
- Produces: `fuelTickets`, `documents`, `fines` tables.

- [ ] **Step 1: Add new tables to schema.ts**
Open `src/db/schema.ts` and append the following tables after `maintenanceLogs`. Note that they all reference `vehicles.id`.

```typescript
export const fuelTickets = pgTable("fuel_tickets", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  fecha: timestamp("fecha").notNull(),
  litros: doublePrecision("litros").notNull(),
  costoTotal: doublePrecision("costo_total").notNull(),
  kilometraje: integer("kilometraje").notNull(),
  ticketUrl: text("ticket_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  tipoDocumento: varchar("tipo_documento", { length: 50 }).notNull(), // vtv, seguro, ruta
  fechaVencimiento: timestamp("fecha_vencimiento").notNull(),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fines = pgTable("fines", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  fecha: timestamp("fecha").notNull(),
  jurisdiccion: text("jurisdiccion").notNull(),
  motivo: text("motivo").notNull(),
  monto: doublePrecision("monto").notNull(),
  estado: varchar("estado", { length: 20 }).default("pendiente").notNull(), // pendiente, pagada
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

### Task 2: Implement S3 Client

**Files:**
- Create: `src/lib/s3.ts`

**Interfaces:**
- Produces: `uploadFile(file: File): Promise<string>`

- [ ] **Step 1: Write S3 upload utility**
Create `src/lib/s3.ts` using `@aws-sdk/client-s3`.

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT ? `http://${process.env.MINIO_ENDPOINT}:9000` : "http://localhost:9002",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true,
});

export async function uploadFile(file: File, folder: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split('.').pop();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: "trackops",
    Key: filename,
    Body: buffer,
    ContentType: file.type,
  }));

  return filename;
}
```

---

### Task 3: Combustible Module

**Files:**
- Create: `src/app/dashboard/combustible/page.tsx`
- Modify: `src/lib/actions.ts`

**Interfaces:**
- Produces: Fuel ticket list and upload action.

- [ ] **Step 1: Add createFuelTicket Server Action**
Update `src/lib/actions.ts` to include `createFuelTicket`.

```typescript
import { fuelTickets } from "@/db/schema";
import { uploadFile } from "./s3";

export async function createFuelTicket(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresaId) throw new Error("No empresa ID");

  const vId = parseInt(formData.get("vehicleId") as string);
  const file = formData.get("ticketFile") as File;
  
  let ticketUrl = null;
  if (file && file.size > 0) {
    ticketUrl = await uploadFile(file, `empresa-${session.user.empresaId}/tickets`);
  }

  const km = parseInt(formData.get("kilometraje") as string);

  await db.insert(fuelTickets).values({
    vehicleId: vId,
    fecha: new Date(formData.get("fecha") as string),
    litros: parseFloat(formData.get("litros") as string),
    costoTotal: parseFloat(formData.get("costoTotal") as string),
    kilometraje: km,
    ticketUrl,
  });

  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vId));
  if (vehicle && km > vehicle.kilometrajeActual) {
    await db.update(vehicles).set({ kilometrajeActual: km }).where(eq(vehicles.id, vId));
  }

  revalidatePath("/dashboard/combustible");
}
```

- [ ] **Step 2: Create Combustible UI**
Create `src/app/dashboard/combustible/page.tsx` with a form and a table displaying `fuelTickets`. Ensure the form has `encType="multipart/form-data"` and a file input for `ticketFile`.

---

### Task 4: Documentación Module

**Files:**
- Create: `src/app/dashboard/documentacion/page.tsx`
- Modify: `src/lib/actions.ts`

**Interfaces:**
- Produces: Document tracking list and upload action.

- [ ] **Step 1: Add createDocument Server Action**
Update `src/lib/actions.ts` to include `createDocument`. It should upload the file to `empresa-${empresaId}/docs` and insert into `documents`.

- [ ] **Step 2: Create Documentación UI**
Create `src/app/dashboard/documentacion/page.tsx` showing a table of `documents`. Add a visual indicator if `fechaVencimiento` is within 30 days from today (warning) or past (danger).

---

### Task 5: Infracciones Module

**Files:**
- Create: `src/app/dashboard/infracciones/page.tsx`
- Modify: `src/lib/actions.ts`

**Interfaces:**
- Produces: Fines tracking module.

- [ ] **Step 1: Add createFine Server Action**
Update `src/lib/actions.ts` to include `createFine`.

- [ ] **Step 2: Create Infracciones UI**
Create `src/app/dashboard/infracciones/page.tsx` showing a table of `fines` with statuses and a form to add new ones.
