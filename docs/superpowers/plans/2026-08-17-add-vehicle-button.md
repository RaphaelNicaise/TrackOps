# Botón Agregar Vehículo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el botón y modal para registrar nuevos vehículos en el panel de Control de Flota (`/dashboard/control-flota/vehiculos`).

**Architecture:** Se creará una función Server Action `createVehicle` en `vehicle-actions.ts` que guardará en PostgreSQL/Drizzle (o fallback a `mock-vehicles.ts`). En la UI, se construirá el componente `CreateVehicleDialog` en `vehicle-dialogs.tsx` y se integrará en la barra de herramientas de `vehiculos-table.tsx`.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, Lucide React, Radix/shadcn Dialog, Drizzle ORM, Vitest.

## Global Constraints

- Seguir los patrones de código existentes en `src/components/dashboard/vehiculos/` y `src/lib/vehicle-actions.ts`.
- Soportar modo resiliente con fallback a mock en memoria (`addMockVehiculo`) cuando la base de datos no esté conectada.
- Formulario con campos: Patente (requerido, mayúsculas), Tipo (selector), Marca (requerido), Modelo (requerido), Año (numérico), Chasis (texto), Kilometraje actual (numérico), RTO (fecha vencimiento).
- Revalidar `/dashboard/control-flota/vehiculos` tras la creación.

---

### Task 1: Helper `addMockVehiculo` en `mock-vehicles.ts`

**Files:**
- Modify: `src/lib/mock-vehicles.ts`
- Test: `test/lib/mock-vehicles.test.ts`

**Interfaces:**
- Produces: `addMockVehiculo(data: MockVehiculoPatch): MockVehiculo`

- [ ] **Step 1: Escribir el test fallido para `addMockVehiculo`**

```ts
// test/lib/mock-vehicles.test.ts
import { describe, it, expect } from 'vitest';
import { addMockVehiculo, mockVehiculos } from '@/lib/mock-vehicles';

describe('mock-vehicles helper', () => {
  it('adds a new vehicle with generated id and defaults', () => {
    const initialCount = mockVehiculos.length;
    const newVeh = addMockVehiculo({
      patente: 'AA 999 ZZ',
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2024,
      tipo: 'Camioneta',
      chasis: '8AJBA3CD4E5678901',
      kilometrajeActual: 1500,
    });

    expect(newVeh.id).toBeGreaterThan(0);
    expect(newVeh.patente).toBe('AA 999 ZZ');
    expect(newVeh.marca).toBe('Toyota');
    expect(mockVehiculos.length).toBe(initialCount + 1);
    expect(mockVehiculos.find((v) => v.patente === 'AA 999 ZZ')).toBeDefined();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npx vitest run test/lib/mock-vehicles.test.ts`
Expected: FAIL con "addMockVehiculo is not a function"

- [ ] **Step 3: Implementar `addMockVehiculo` en `src/lib/mock-vehicles.ts`**

```ts
export function addMockVehiculo(data: MockVehiculoPatch): MockVehiculo {
  const nextId = mockVehiculos.length > 0 ? Math.max(...mockVehiculos.map((v) => v.id)) + 1 : 1;
  const newVehiculo: MockVehiculo = {
    id: nextId,
    patente: (data.patente ?? "").toUpperCase(),
    marca: data.marca ?? "",
    modelo: data.modelo ?? "",
    anio: data.anio ?? null,
    tipo: data.tipo ?? "Camión",
    chasis: data.chasis ?? "",
    kilometrajeActual: data.kilometrajeActual ?? 0,
    rto: data.rto ?? null,
    docCount: 0,
    estado: "Detenido",
    velocidad: "0 km/h",
    ultimaActualizacion: "Recién",
    online: true,
    hasAlert: false,
    lat: -38.715,
    lng: -62.265,
    kilometraje: `${(data.kilometrajeActual ?? 0).toLocaleString("es-AR")} km`,
    alertasCount: 0,
  };
  mockVehiculos.unshift(newVehiculo);
  return newVehiculo;
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npx vitest run test/lib/mock-vehicles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/mock-vehicles.ts test/lib/mock-vehicles.test.ts
git commit -m "feat(flota): add addMockVehiculo helper with unit tests"
```

---

### Task 2: Server Action `createVehicle` en `src/lib/vehicle-actions.ts`

**Files:**
- Modify: `src/lib/vehicle-actions.ts`
- Test: `test/lib/vehicle-actions.test.ts`

**Interfaces:**
- Consumes: `addMockVehiculo` de `@/lib/mock-vehicles`, `db` de `@/db`, `vehicles` de `@/db/schema`
- Produces: `createVehicle(formData: FormData): Promise<{ success: boolean; id?: number }>`

- [ ] **Step 1: Escribir el test fallido para `createVehicle`**

```ts
// test/lib/vehicle-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInsert, mockValues } = vi.hoisted(() => {
  const mockValues = vi.fn().mockResolvedValue([{ id: 10 }]);
  const mockInsert = vi.fn().mockImplementation(() => ({ values: mockValues, returning: vi.fn().mockResolvedValue([{ id: 10 }]) }));
  return { mockInsert, mockValues };
});

vi.mock('@/db', () => ({
  db: {
    insert: mockInsert,
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import { createVehicle } from '@/lib/vehicle-actions';
import { auth } from '@/auth';

describe('vehicle-actions: createVehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { id: 'u1', empresaId: 1 }
    });
  });

  it('throws an error if not authenticated', async () => {
    (auth as any).mockResolvedValueOnce({ user: null });
    const fd = new FormData();
    await expect(createVehicle(fd)).rejects.toThrow('No autorizado');
  });

  it('inserts into db when connected and revalidates path', async () => {
    const fd = new FormData();
    fd.set('patente', 'AA 100 BB');
    fd.set('marca', 'Scania');
    fd.set('modelo', 'R450');
    fd.set('anio', '2022');
    fd.set('tipo', 'Camión');
    fd.set('chasis', '9BS12345');
    fd.set('kilometrajeActual', '50000');
    fd.set('rto', '2026-10-01');

    await createVehicle(fd);

    expect(mockInsert).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npx vitest run test/lib/vehicle-actions.test.ts`
Expected: FAIL con "createVehicle is not exported"

- [ ] **Step 3: Implementar `createVehicle` en `src/lib/vehicle-actions.ts`**

```ts
export async function createVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const empresaId = session.user.empresaId ?? 1;
  const patente = ((formData.get("patente") as string) || "").trim().toUpperCase();
  const marca = (formData.get("marca") as string) || "";
  const modelo = (formData.get("modelo") as string) || "";
  const anio = formData.get("anio") ? parseInt(formData.get("anio") as string) : null;
  const tipo = (formData.get("tipo") as string) || null;
  const chasis = (formData.get("chasis") as string) || null;
  const kilometrajeActual = parseInt(formData.get("kilometrajeActual") as string) || 0;
  const rto = formData.get("rto") ? new Date(formData.get("rto") as string) : null;

  const data = {
    patente,
    marca,
    modelo,
    anio,
    tipo,
    chasis,
    kilometrajeActual,
    rto,
  };

  try {
    await db.insert(vehicles).values({
      empresaId,
      ...data,
    });
  } catch (err) {
    addMockVehiculo(data);
  }

  revalidatePath(VEHICULOS_PATH);
  return { success: true };
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npx vitest run test/lib/vehicle-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/vehicle-actions.ts test/lib/vehicle-actions.test.ts
git commit -m "feat(flota): implement createVehicle server action with db and mock fallback"
```

---

### Task 3: Componente `CreateVehicleDialog` en `vehicle-dialogs.tsx`

**Files:**
- Modify: `src/components/dashboard/vehiculos/vehicle-dialogs.tsx`

**Interfaces:**
- Consumes: `createVehicle` de `@/lib/vehicle-actions`
- Produces: `export function CreateVehicleDialog(): JSX.Element`

- [ ] **Step 1: Agregar `CreateVehicleDialog` a `src/components/dashboard/vehiculos/vehicle-dialogs.tsx`**

Implementar el componente modal con botón trigger `Plus` + `"Agregar vehículo"`:
- Estado `open` para abrir/cerrar.
- Estado `isPending` vía `useTransition`.
- Inputs: Patente (required, uppercase), Tipo (select), Marca (required), Modelo (required), Año (number), Chasis (text), Km actual (number, default 0), RTO (date).
- Handler de `onSubmit` que invoca `createVehicle(fd)`, resetea formulario, cierra el diálogo y llama a `router.refresh()`.

- [ ] **Step 2: Verificar la compilación TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 errors en `vehicle-dialogs.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/vehiculos/vehicle-dialogs.tsx
git commit -m "feat(flota): create CreateVehicleDialog component"
```

---

### Task 4: Integrar `CreateVehicleDialog` en `vehiculos-table.tsx`

**Files:**
- Modify: `src/components/dashboard/vehiculos/vehiculos-table.tsx`

**Interfaces:**
- Consumes: `CreateVehicleDialog` de `./vehicle-dialogs`

- [ ] **Step 1: Actualizar la cabecera de `vehiculos-table.tsx`**

En la sección superior (donde está el buscador y el contador), agregar un contenedor flex con:
- La barra de búsqueda.
- El componente `<CreateVehicleDialog />` a la derecha.

- [ ] **Step 2: Verificar compilación y tests**

Run: `npx vitest run` y `npx tsc --noEmit`
Expected: PASS en todos los tests y sin errores de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/vehiculos/vehiculos-table.tsx
git commit -m "feat(flota): integrate CreateVehicleDialog into VehiculosTable header"
```

---

### Task 5: Verificación End-to-End

- [ ] **Step 1: Ejecutar suite completa de tests**

Run: `npm test` o `npx vitest run`
Expected: Todos los tests pasando.

- [ ] **Step 2: Verificar build de Next.js**

Run: `npm run build`
Expected: Build exitoso sin errores.
