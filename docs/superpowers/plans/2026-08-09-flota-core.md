# Flota Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the core role-based dashboards, database seeding, vehicle CRUD, maintenance logs, and a mock GPS interface for TrackOps Flota.

**Architecture:** We use Next.js Server Components for data fetching with Drizzle ORM to PostgreSQL. Mutations use Server Actions with `revalidatePath`. UI relies on Shadcn UI (Tailwind + Radix). Data is isolated by `empresaId`.

**Tech Stack:** Next.js (App Router), Drizzle ORM, PostgreSQL, Shadcn UI, Tailwind CSS, Lucide React.

## Global Constraints

- No real API integration with Mercado Pago or WhatsApp.
- Enforce strict Row-Level isolation by explicitly checking `empresaId` on all queries for non-SuperAdmins.
- All new Server Actions must be placed in `src/app/actions/...` or co-located if small. Let's use `src/lib/actions.ts` for simplicity.
- Ensure the app can run on standard `npm run dev`.

---

### Task 1: Database Seed Script

**Files:**
- Create: `src/db/seed.ts`
- Modify: `package.json:10-15`

**Interfaces:**
- Consumes: `schema.ts` definitions (`users`, `empresas`, `vehicles`, `maintenanceLogs`).
- Produces: Populated PostgreSQL database.

- [ ] **Step 1: Write seed script to populate DB**
Create `src/db/seed.ts` and add code to insert 1 SuperAdmin, 2 Empresas, 1 Admin and 1 Chofer per Empresa, and a few vehicles.

```typescript
import { db } from "./index";
import { users, empresas, vehicles, maintenanceLogs } from "./schema";
import crypto from "crypto";

async function main() {
  console.log("Seeding database...");
  
  // 1. Crear Empresas
  const [emp1, emp2] = await db.insert(empresas).values([
    { nombre: "Logística A", cuit: "20-11111111-1" },
    { nombre: "Transporte B", cuit: "20-22222222-2" },
  ]).returning();

  // 2. Crear Usuarios
  await db.insert(users).values([
    { id: crypto.randomUUID(), email: "superadmin@trackops.com", role: "SUPER_ADMIN", name: "Super Admin" },
    { id: crypto.randomUUID(), email: "admin@logistica.com", role: "ADMIN_EMPRESA", empresaId: emp1.id, name: "Admin A" },
    { id: crypto.randomUUID(), email: "chofer@logistica.com", role: "CHOFER", empresaId: emp1.id, name: "Chofer A" },
  ]);

  // 3. Crear Vehículos
  const [v1] = await db.insert(vehicles).values([
    { empresaId: emp1.id, patente: "AA123BB", modelo: "F-150", marca: "Ford", anio: 2020, tipo: "utilitario", kilometrajeActual: 10000 },
    { empresaId: emp2.id, patente: "CC456DD", modelo: "Cargo 1722", marca: "Ford", anio: 2018, tipo: "camion", kilometrajeActual: 50000 },
  ]).returning();

  // 4. Crear Mantenimiento
  await db.insert(maintenanceLogs).values([
    { vehicleId: v1.id, fecha: new Date(), kilometraje: 10000, costo: 50000, taller: "Taller Central", descripcion: "Cambio de aceite" }
  ]);

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch(console.error);
```

- [ ] **Step 2: Add seed command to package.json**
Modify `package.json` to add the seed command in the `scripts` block.

```json
"db:seed": "npx tsx src/db/seed.ts"
```

- [ ] **Step 3: Run the seed script**
Run: `npm run db:push && npm run db:seed`
Expected: "Seeding complete!" without errors.

---

### Task 2: Server Actions for CRUD

**Files:**
- Create: `src/lib/actions.ts`

**Interfaces:**
- Consumes: Drizzle `db`, Auth session.
- Produces: `createVehicle(formData)`, `createMaintenanceLog(formData)`

- [ ] **Step 1: Implement Server Actions**
Create `src/lib/actions.ts` with vehicle and maintenance insertion logic.

```typescript
"use server";
import { db } from "@/db";
import { vehicles, maintenanceLogs } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresaId) throw new Error("No empresa ID");

  await db.insert(vehicles).values({
    empresaId: session.user.empresaId,
    patente: formData.get("patente") as string,
    marca: formData.get("marca") as string,
    modelo: formData.get("modelo") as string,
    anio: parseInt(formData.get("anio") as string),
    tipo: formData.get("tipo") as string,
    kilometrajeActual: parseInt(formData.get("kilometrajeActual") as string),
  });

  revalidatePath("/dashboard/flota");
}

export async function createMaintenanceLog(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresaId) throw new Error("No empresa ID");

  const vId = parseInt(formData.get("vehicleId") as string);
  const km = parseInt(formData.get("kilometraje") as string);

  await db.insert(maintenanceLogs).values({
    vehicleId: vId,
    fecha: new Date(formData.get("fecha") as string),
    kilometraje: km,
    costo: parseFloat(formData.get("costo") as string),
    taller: formData.get("taller") as string,
    descripcion: formData.get("descripcion") as string,
  });

  // Actualizar kilometraje del vehículo si es mayor
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vId));
  if (vehicle && km > vehicle.kilometrajeActual) {
    await db.update(vehicles).set({ kilometrajeActual: km }).where(eq(vehicles.id, vId));
  }

  revalidatePath("/dashboard/mantenimiento");
  revalidatePath("/dashboard/flota");
}
```

---

### Task 3: Role-Based Dashboard Logic

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/SuperAdminPanel.tsx`
- Create: `src/components/dashboard/EmpresaPanel.tsx`

**Interfaces:**
- Consumes: `auth()`, Drizzle `db`
- Produces: Dynamic dashboard views.

- [ ] **Step 1: Create SuperAdminPanel**
Create `src/components/dashboard/SuperAdminPanel.tsx`.

```typescript
import { db } from "@/db";
import { empresas, vehicles } from "@/db/schema";

export async function SuperAdminPanel() {
  const allEmpresas = await db.select().from(empresas);
  const allVehicles = await db.select().from(vehicles);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="font-semibold text-lg">Total Empresas</h3>
        <p className="text-3xl font-bold">{allEmpresas.length}</p>
      </div>
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="font-semibold text-lg">Total Vehículos en Sistema</h3>
        <p className="text-3xl font-bold">{allVehicles.length}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create EmpresaPanel**
Create `src/components/dashboard/EmpresaPanel.tsx`.

```typescript
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function EmpresaPanel({ empresaId }: { empresaId: number }) {
  const myVehicles = await db.select().from(vehicles).where(eq(vehicles.empresaId, empresaId));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="font-semibold text-lg">Mi Flota Activa</h3>
        <p className="text-3xl font-bold">{myVehicles.length}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire up dashboard page**
Modify `src/app/dashboard/page.tsx` to render the correct panel.

```typescript
import { auth } from "@/auth";
import { SuperAdminPanel } from "@/components/dashboard/SuperAdminPanel";
import { EmpresaPanel } from "@/components/dashboard/EmpresaPanel";

export default async function DashboardHomePage() {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Bienvenido, {session?.user?.name || session?.user?.email}</h1>
      
      {role === "SUPER_ADMIN" && <SuperAdminPanel />}
      {role === "ADMIN_EMPRESA" && session?.user?.empresaId && <EmpresaPanel empresaId={session.user.empresaId} />}
      {role === "CHOFER" && <p className="mt-4">Panel móvil para reportes rápidos.</p>}
    </div>
  );
}
```

---

### Task 4: Flota UI (Table & Creation Form)

**Files:**
- Modify: `src/app/dashboard/flota/page.tsx`

**Interfaces:**
- Consumes: `createVehicle` action.
- Produces: Working vehicle list and creation flow.

- [ ] **Step 1: Implement Server Component Data Fetching**
Update `src/app/dashboard/flota/page.tsx` to read data.

```typescript
import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Settings } from "lucide-react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createVehicle } from "@/lib/actions";

export default async function FlotaPage() {
  const session = await auth();
  const role = session?.user?.role;
  const empresaId = session?.user?.empresaId;
  
  let myVehicles: typeof vehicles.$inferSelect[] = [];
  if (empresaId) {
    myVehicles = await db.select().from(vehicles).where(eq(vehicles.empresaId, empresaId));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Inventario de Flota</h1>
          <p className="text-muted-foreground mt-2">Gestiona los vehículos asignados a tu empresa.</p>
        </div>
        
        <div className="flex gap-4">
          <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN", "ADMIN_EMPRESA"]}>
            <form action={createVehicle} className="flex gap-2 items-center bg-muted p-2 rounded">
              <input type="text" name="patente" placeholder="Patente" required className="border p-1 text-sm"/>
              <input type="text" name="marca" placeholder="Marca" required className="border p-1 text-sm"/>
              <input type="text" name="modelo" placeholder="Modelo" required className="border p-1 text-sm"/>
              <input type="number" name="anio" placeholder="Año" required className="border p-1 text-sm w-16"/>
              <input type="number" name="kilometrajeActual" placeholder="Km" required className="border p-1 text-sm w-20"/>
              <input type="hidden" name="tipo" value="utilitario" />
              <Button type="submit" size="sm"><Plus className="h-4 w-4 mr-1"/> Añadir</Button>
            </form>
          </RequireRole>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patente</TableHead>
              <TableHead>Marca y Modelo</TableHead>
              <TableHead>Año</TableHead>
              <TableHead>Kilometraje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myVehicles.length === 0 ? (
               <TableRow><TableCell colSpan={4} className="h-48 text-center text-muted-foreground">No hay vehículos.</TableCell></TableRow>
            ) : (
               myVehicles.map(v => (
                 <TableRow key={v.id}>
                   <TableCell className="font-medium">{v.patente}</TableCell>
                   <TableCell>{v.marca} {v.modelo}</TableCell>
                   <TableCell>{v.anio}</TableCell>
                   <TableCell>{v.kilometrajeActual} km</TableCell>
                 </TableRow>
               ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

---

### Task 5: Simulated Interactive GPS Map

**Files:**
- Modify: `src/app/dashboard/gps/page.tsx`

**Interfaces:**
- Consumes: Tailwind classes for UI layout.
- Produces: A visual layout simulating a GPS tracking screen with map placeholders and vehicle list.

- [ ] **Step 1: Implement Mocked GPS Map Interface**
Update `src/app/dashboard/gps/page.tsx` with a dual-pane layout.

```typescript
import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";
import { Map, Navigation } from "lucide-react";

export default async function GpsPage() {
  const session = await auth();
  
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Rastreo Satelital</h1>
          <p className="text-muted-foreground mt-2">Monitoreo en tiempo real de tu flota.</p>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Sidebar Vehículos */}
        <div className="w-80 border rounded-lg bg-card p-4 flex flex-col gap-4">
           <h3 className="font-semibold border-b pb-2">Unidades</h3>
           <div className="flex gap-2 text-sm">
             <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">En marcha (2)</span>
             <span className="px-2 py-1 bg-slate-100 rounded-full">Detenido (1)</span>
           </div>
           
           <div className="flex-1 overflow-y-auto flex flex-col gap-2 mt-2">
              <div className="p-3 border rounded flex justify-between items-center bg-muted/50">
                 <div>
                   <p className="font-semibold">AA123BB</p>
                   <p className="text-xs text-muted-foreground">Ford F-150</p>
                 </div>
                 <Navigation className="h-4 w-4 text-green-600" />
              </div>
           </div>
        </div>

        {/* Mapa Mock */}
        <div className="flex-1 border rounded-lg bg-slate-100 flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/0,0,2,0,0/1000x1000')] bg-cover bg-center" />
           <div className="z-10 flex flex-col items-center p-6 bg-white/80 rounded shadow backdrop-blur-sm">
              <Map className="h-10 w-10 text-primary mb-2" />
              <p className="font-semibold">Mapa de Rastreo</p>
              <p className="text-sm text-muted-foreground max-w-sm text-center">La integración real en vivo con el proveedor GPS estará disponible en la próxima iteración. Esta vista representa la ubicación de las unidades en ruta.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
```
