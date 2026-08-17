# Especificación de Diseño: Sistema de Documentación de Vehículos con MinIO

## 1. Visión General
El objetivo de esta funcionalidad es proporcionar un sistema completo, fluido y visual para la gestión de documentos asociados a cada vehículo de la flota, almacenados de manera segura en un servidor MinIO (S3 compatible), organizados por categorías personalizables mediante drag-and-drop interactivo, y con soporte completo para visualización, descarga, eliminación y compatibilidad móvil.

---

## 2. Arquitectura de Almacenamiento en MinIO

### 2.1 Estructura de Carpetas y Objetos
Los archivos se organizan de forma jerárquica y aislada por empresa y vehículo en el bucket `trackops`:

```
trackops/
└── empresa_{empresaId}/
    └── vehiculos/
        └── vehiculo_{vehicleId}/
            └── {timestamp}-{randomId}.{ext}
```

* **Bucket**: `trackops` (se verifica/crea automáticamente si no existe al iniciar la aplicación o al subir un archivo).
* **Multi-tenant**: Los archivos quedan aislados por prefijo `empresa_{empresaId}`.
* **Integridad de Nombres**: En MinIO se guarda con clave única `{timestamp}-{randomId}.{ext}`, mientras que la base de datos conserva el nombre de archivo original (`fileName`), MIME type y peso en bytes.

---

## 3. Modelo de Datos (Drizzle ORM)

### 3.1 Tabla `document_categories`
Define las categorías disponibles para agrupar documentos (asociadas a la empresa):
```typescript
export const documentCategories = pgTable("document_categories", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  nombre: text("nombre").notNull(), // Ej: "Seguro", "Cédula", "RTO / VTV", "Service", "Habilitaciones"
  color: varchar("color", { length: 30 }).default("blue").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

*Categorías iniciales por defecto cuando una empresa no tiene ninguna*:
- Seguro
- Cédula
- RTO / VTV
- Service

### 3.2 Tabla `vehicle_documents`
Registra cada documento subido y asociado a un vehículo:
```typescript
export const vehicleDocuments = pgTable("vehicle_documents", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  categoryId: integer("category_id").references(() => documentCategories.id, { onDelete: "set null" }), // null = "Sin categoría"
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  fileKey: text("file_key").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fechaVencimiento: timestamp("fecha_vencimiento"), // Opcional / base para futuro
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## 4. Endpoints y Lógica de Negocio

### 4.1 `POST /api/vehicles/[id]/documents/upload`
* **Entrada**: `FormData` con `files` (uno o varios archivos) y opcionalmente `categoryId`.
* **Seguridad**: Autenticación vía sesión NextAuth (`session.user.empresaId`).
* **Acción**:
  1. Valida el vehículo y permisos de la empresa.
  2. Sube los archivos al bucket `trackops` de MinIO en la ruta `empresa_{empresaId}/vehiculos/vehiculo_{vehicleId}/...`.
  3. Inserta los registros correspondientes en `vehicle_documents` (`categoryId` nulo por defecto para que queden en *"Sin categoría"*).
* **Respuesta**: Lista de documentos creados en formato JSON.

### 4.2 `GET /api/documents/[id]/view`
* **Propósito**: Abrir el documento en el navegador (nueva pestaña).
* **Acción**: Valida permisos de empresa, recupera el stream desde MinIO (`GetObjectCommand`) y responde con `Content-Type: <mimeType>` y `Content-Disposition: inline; filename="<fileName>"`.

### 4.3 `GET /api/documents/[id]/download`
* **Propósito**: Descargar el archivo forzadamente al dispositivo del usuario.
* **Acción**: Valida permisos, recupera el stream desde MinIO y responde con `Content-Disposition: attachment; filename="<fileName>"`.

### 4.4 `PATCH /api/documents/[id]`
* **Propósito**: Cambiar de categoría (vía Drag & Drop o selector) o editar metadatos.
* **Entrada**: `{ categoryId: number | null, title?: string, fechaVencimiento?: string | null }`.
* **Acción**: Actualiza el registro en `vehicle_documents`.

### 4.5 `DELETE /api/documents/[id]`
* **Propósito**: Eliminar un documento.
* **Acción**: Elimina el objeto en MinIO (`DeleteObjectCommand`) y elimina el registro en la base de datos.

### 4.6 `GET` / `POST` / `DELETE /api/vehicles/[id]/categories`
* **Propósito**: Listar, crear y borrar categorías personalizadas de la empresa.

---

## 5. Componentes e Interfaz de Usuario

### 5.1 Navegación en la Tabla de Vehículos (`/dashboard/control-flota/vehiculos`)
* Toda la fila (`<TableRow>`) del vehículo es clickeable con efecto hover y cursor pointer para navegar a `/dashboard/control-flota/vehiculos/[id]`.
* El botón o badge de documentos (`docCount`) enlaza directamente a `/dashboard/control-flota/vehiculos/[id]?tab=documentacion`.

### 5.2 Subsección de Documentación (`VehiculoDetail`)
Se implementa el componente `VehiculoDocumentos` en la pestaña `"Documentación"` con:

1. **Panel Izquierdo / Superior de Subida & Sin Categorizar**:
   * **Dropzone de Subida**: Zona interactiva para soltar archivos o clickear para abrir explorador (`multiple`, acepta `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.doc`, `.docx`, `.xls`, `.xlsx`).
   * **Bandeja "Sin Categoría"**: Contenedor visual destacado con los documentos recién subidos o sin clasificar. Cada archivo es arrastrable (`draggable`).
2. **Panel Derecho / Grilla de Categorías**:
   * Grilla dinámica de categorías con contador de archivos.
   * Botón `+ Nueva Categoría` con modal interactivo para crear categorías personalizadas al instante.
   * Cada tarjeta de categoría funciona como un drop target: al arrastrar un archivo sobre ella, cambia de color, se resalta y muestra feedback visual.
   * Al soltar el archivo en la categoría, se reubica visualmente de forma instantánea (Optimistic UI) y se guarda asíncronamente en backend.
3. **Acciones por Archivo**:
   * Botón 👁️ (Ver en pestaña nueva).
   * Botón ⬇️ (Descargar).
   * Botón 🗑️ (Eliminar con confirmación).
   * Menú contextual / selector de categoría para uso rápido.
4. **Experiencia Móvil (Responsive Design)**:
   * Diseño apilado verticalmente en pantallas pequeñas.
   * Menú dropdown de 1-tap *"Mover a categoría..."* en cada archivo para no depender exclusivamente del arrastre en pantallas táctiles pequeñas.
   * Botones táctiles de tamaño adecuado (mínimo 44px de área de toque).

---

## 6. Manejo de Errores y Casos Borde
* **MinIO no disponible o fuera de línea**: Mensaje amigable al usuario con reintento y log detallado.
* **Archivos pesados**: Validación de tamaño máximo (ej: 25MB por archivo).
* **Formatos de archivo no soportados**: Notificación clara de formatos admitidos.
* **Categoría eliminada**: Documentos asociados pasan automáticamente a `categoryId = null` ("Sin categoría") sin perderse el archivo físico.
