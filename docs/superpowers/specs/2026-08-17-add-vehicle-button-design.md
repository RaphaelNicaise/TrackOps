# Especificación de Diseño: Botón y Diálogo para Agregar Vehículos

**Fecha:** 2026-08-17  
**Estado:** Aprobado  
**Módulo:** Control de Flota - Vehículos (`/dashboard/control-flota/vehiculos`)

---

## 1. Resumen y Objetivos

Permitir a los administradores y usuarios con permisos en el panel de control de flota registrar nuevos vehículos directamente desde la vista principal de la lista de vehículos mediante un modal (`Dialog`) rápido, sin recargar la página ni navegar a otra sección.

---

## 2. Experiencia de Usuario (UX / UI)

### 2.1. Ubicación del Botón
- Se ubica en la parte superior de la vista de vehículos ([vehiculos-table.tsx](file:///C:/Rapha/Laburo/Prada/src/components/dashboard/vehiculos/vehiculos-table.tsx)), alineado a la derecha en la barra de acciones / filtros junto al input de búsqueda.
- Estilo del botón: `Button` con variante primaria, ícono `Plus` de Lucide y etiqueta `"Agregar vehículo"`.

### 2.2. Modal de Creación (`CreateVehicleDialog`)
- Al hacer clic, se abre un diálogo modal centrado (`DialogContent max-w-xl`) con título: **"Nuevo vehículo"** y descripción explicativa.
- Campos del formulario (Grid responsiva de 2 columnas):
  1. **Patente** (Input de texto, requerido, mayúsculas, fuente monoespaciada).
  2. **Tipo** (Select: `Camión`, `Camioneta`, `Utilitario`, `Auto`, default: vacío o `Camión`).
  3. **Marca** (Input de texto, requerido).
  4. **Modelo** (Input de texto, requerido).
  5. **Año** (Input numérico, opcional).
  6. **Chasis** (Input de texto, opcional, monoespaciado).
  7. **Km actual** (Input numérico, requerido, default `0`).
  8. **Vencimiento RTO** (Input fecha `type="date"`, opcional).
- Acciones:
  - Botón **Cancelar** (cierra el modal y resetea el formulario).
  - Botón **Guardar vehículo** (estado de carga con spinner/texto `"Guardando..."` mientras la Server Action ejecuta).

---

## 3. Arquitectura y Flujo de Datos

### 3.1. Servidor y Persistencia (`vehicle-actions.ts`)
- Se implementa la Server Action `createVehicle(formData: FormData)`.
- **Flujo:**
  1. Valida la sesión activa con `auth()`. Si no hay usuario autenticado, lanza error de autorización.
  2. Extrae `empresaId` de la sesión del usuario (si no posee o es superadmin, utiliza el asignado o valor por defecto).
  3. Parsea y valida los campos del formulario (`patente`, `marca`, `modelo`, `anio`, `tipo`, `chasis`, `kilometrajeActual`, `rto`).
  4. Intenta persistir en la base de datos PostgreSQL usando Drizzle ORM:
     ```ts
     await db.insert(vehicles).values({
       empresaId,
       patente,
       marca,
       modelo,
       anio,
       tipo,
       chasis,
       kilometrajeActual,
       rto,
     });
     ```
  5. **Fallback Mock en Memoria:** Si la base de datos no está disponible o falla la inserción, agrega el registro a la lista en memoria mediante la función auxiliar `addMockVehiculo(data)` en [mock-vehicles.ts](file:///C:/Rapha/Laburo/Prada/src/lib/mock-vehicles.ts).
  6. Llama a `revalidatePath("/dashboard/control-flota/vehiculos")` para actualizar la tabla inmediatamente.

### 3.2. Helpers en `mock-vehicles.ts`
- Se agrega la función `addMockVehiculo(data: MockVehiculoPatch): MockVehiculo` que calcula el próximo `id` disponible, inicializa valores por defecto de telemetría/documentación (`docCount: 0`, `alertasCount: 0`, `online: true`, `estado: "Detenido"`, `lat: -38.715`, `lng: -62.265`, etc.) y lo inserta en `mockVehiculos`.

---

## 4. Manejo de Errores y Validaciones
- La patente debe ser obligatoria y enviada en mayúsculas sin espacios innecesarios.
- Marca, modelo y kilometraje son requeridos por esquema.
- El formulario se resetea al completarse exitosamente la creación y se cierra el diálogo.
- Errores de red o de base de datos son capturados para evitar bloqueos y garantizar consistencia con el modo fallback del proyecto.
