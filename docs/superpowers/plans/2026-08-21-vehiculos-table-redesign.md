# Rediseño de Tabla de Vehículos - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la tabla de vehículos (`src/components/dashboard/vehiculos/vehiculos-table.tsx`) para adoptar el estándar visual, limpio y de alta calidad de *Empresas Clientes*, *Prospectos Leads* y *Centro de Soporte*, enfocado 100% en la tabla con micro-métricas en línea.

**Architecture:** La vista de vehículos se estructurará en una cabecera compacta con título y acción principal (`+ Nuevo Vehículo`), una barra de control con pestañas de estado (`Todos`, `RTO Vigente`, `RTO Vencido`, `Sin RTO`) conteniendo contadores dinámicos en badges sutiles, un buscador universal multi-campo, selector de tipo de vehículo y una tabla con celdas enriquecidas (chapa patente en fuente monospace destacada, copia rápida de chasis, odómetro formateado con formato argentino, badge de RTO con severidad de color y fecha relativa, badges de documentación y acciones rápidas).

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, Lucide React icons, Radix UI Dialog/Dropdown, date-fns, Vitest.

## Global Constraints
- Foco absoluto en la tabla: No agregar tarjetas KPI gigantes en la cabecera.
- Las micro-métricas y contadores deben estar integrados directamente dentro de las pestañas (`Todos (X)`, `RTO Vigente (Y)`, `RTO Vencido (Z)`, `Sin RTO (W)`).
- Mantener compatibilidad total con `VehiculoRow` y los flujos existentes: `CreateVehicleDialog`, `EditVehicleDialog`, `DeleteVehicleDialog`, navegación a `/panel/control-flota/vehiculos/[id]` y enlaces a `/panel/mapa`.
- 100% TypeScript estricto y tests con Vitest pasando.

---

### Task 1: Rediseño del Componente `VehiculosTable`

**Files:**
- Modify: `src/components/dashboard/vehiculos/vehiculos-table.tsx`
- Test: `test/components/vehiculos-table.test.tsx`

**Interfaces:**
- Consumes: `VehiculoRow` (`id`, `patente`, `marca`, `modelo`, `anio`, `tipo`, `chasis`, `kilometrajeActual`, `rto`, `docCount`), `CreateVehicleDialog`, `EditVehicleDialog`, `DeleteVehicleDialog` from `./vehicle-dialogs`.
- Produces: `<VehiculosTable vehicles={rows} />` con pestañas interactivas, búsqueda en vivo, filtros por tipo, ordenamiento por columnas y acciones en 1 clic.

- [ ] **Step 1: Escribir las pruebas iniciales en `test/components/vehiculos-table.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VehiculosTable, VehiculoRow } from "@/components/dashboard/vehiculos/vehiculos-table";

const mockVehiculosTest: VehiculoRow[] = [
  {
    id: 1,
    patente: "AA123BB",
    marca: "Scania",
    modelo: "R450",
    anio: 2022,
    tipo: "Camión",
    chasis: "9BS12345678901234",
    kilometrajeActual: 145000,
    rto: new Date("2026-12-31T00:00:00Z"),
    docCount: 3,
  },
  {
    id: 2,
    patente: "AC456DD",
    marca: "Toyota",
    modelo: "Hilux",
    anio: 2021,
    tipo: "Camioneta",
    chasis: "8AJ98765432109876",
    kilometrajeActual: 82500,
    rto: new Date("2025-01-01T00:00:00Z"), // Vencido
    docCount: 1,
  },
  {
    id: 3,
    patente: "AD789EE",
    marca: "Mercedes-Benz",
    modelo: "Sprinter",
    anio: 2023,
    tipo: "Utilitario",
    chasis: null,
    kilometrajeActual: 35000,
    rto: null, // Sin RTO
    docCount: 0,
  },
];

describe("VehiculosTable Rediseñado", () => {
  it("renders header and inline status tabs with dynamic count badges", () => {
    const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
    expect(html).toContain("Vehículos");
    expect(html).toContain("Todos");
    expect(html).toContain("RTO Vigente");
    expect(html).toContain("RTO Vencido");
    expect(html).toContain("Sin RTO");
  });

  it("renders table columns: patente, marca/modelo, chasis, km, rto, docs, and actions", () => {
    const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
    expect(html).toContain("AA123BB");
    expect(html).toContain("Scania");
    expect(html).toContain("R450");
    expect(html).toContain("145.000");
    expect(html).toContain("Vigente");
    expect(html).toContain("Vencido");
    expect(html).toContain("Sin registrar");
  });

  it("renders action buttons including Ver Ficha and Ver en Mapa", () => {
    const html = renderToStaticMarkup(<VehiculosTable vehicles={mockVehiculosTest} />);
    expect(html).toContain("/panel/control-flota/vehiculos/1");
    expect(html).toContain("/panel/mapa?patente=AA123BB");
  });
});
```

- [ ] **Step 2: Ejecutar prueba y verificar fallo o estado actual**

Run: `npx vitest run test/components/vehiculos-table.test.tsx`

- [ ] **Step 3: Implementar el rediseño completo de `src/components/dashboard/vehiculos/vehiculos-table.tsx`**

Incluyendo:
- Cabecera compacta con contador general y botón `CreateVehicleDialog`.
- Barra de filtros con pestañas en línea y micro-badges numéricos (`Todos (3)`, `RTO Vigente (1)`, `RTO Vencido (1)`, `Sin RTO (1)`).
- Dropdown select para filtrar por tipo de vehículo (`Todos`, `Camión`, `Camioneta`, `Utilitario`, `Auto`, etc.).
- Buscador con reset rápido.
- Columnas con formato visual enriquecido: chapa patente con estilo monoespaciado y avatar de tipo, chasis con botón de copia, odómetro formateado con separadores de miles, badge de RTO según estado (verde / rojo / tenue) y fecha formateada (`dd/MM/yyyy`), badge de documentos con link, botón directo `👁️ Ver Ficha`, botón directo `🗺️ Ver en Mapa`, y menú contextual `⋯` con opciones para Editar y Eliminar.
- Estado vacío con mensaje claro y botón de reset o creación.

- [ ] **Step 4: Ejecutar tests para verificar que pasen**

Run: `npx vitest run test/components/vehiculos-table.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/vehiculos/vehiculos-table.tsx test/components/vehiculos-table.test.tsx
git commit -m "feat(vehiculos): redesign VehiculosTable with table-focused compact metrics, status tabs, and enriched rows"
```

---

### Task 2: Verificación Integral de la Suite de Pruebas

**Files:**
- Test: All tests in repository

- [ ] **Step 1: Ejecutar la suite completa de pruebas**

Run: `npm test`
Expected: 33+ suites passed, 100% green.

- [ ] **Step 2: Commit final si corresponde**

```bash
git add .
git commit -m "chore(vehiculos): verify complete test suite for redesigned VehiculosTable"
```
