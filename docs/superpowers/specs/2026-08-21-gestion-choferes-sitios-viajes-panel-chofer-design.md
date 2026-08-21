# Design Spec: Sistema Integral de Choferes, Sitios, Viajes y Panel del Chofer

**Fecha:** 2026-08-21  
**Módulos:**
1. Control de Flota - Choferes (`/panel/control-flota/choferes`) & Auth con DNI (`/auth/login`)
2. Control de Flota - Sitios (`/panel/control-flota/sitios`)
3. Control de Flota - Viajes (`/panel/control-flota/viajes`)
4. Panel Móvil del Chofer (`/panel/chofer`)

---

## 1. Visión General y Arquitectura

Este sistema unifica la operativa de transporte y logística en TrackOps:
- Los administradores de empresa registran choferes, gestionan credenciales, configuran sitios de interés y despachan viajes.
- Los choferes pueden autenticarse fácilmente con su **DNI o escaneo de código DNI**, acceder a su panel simplificado (`/panel/chofer`), iniciar y cerrar turnos/viajes con odómetro, y crear viajes en ruta.
- Tanto administradores como choferes pueden seleccionar puntos de origen y destino entre **Sitios Preconfigurados** de la empresa o cualquier dirección/lugar del mapa mediante **Google Places / Geocoding en tiempo real**.

---

## 2. Modelo de Datos (`src/db/schema.ts`)

### A. Tabla `choferes`
- `id`: serial primary key
- `empresaId`: integer not null (FK `empresas.id`)
- `userId`: text nullable (FK `users.id`)
- `nombre`: text not null
- `apellido`: text not null
- `dni`: varchar(20) not null
- `telefono`: varchar(50)
- `email`: text
- `licenciaNumero`: varchar(50)
- `licenciaCategoria`: varchar(20) (ej: B1, C1, D, E1)
- `licenciaVencimiento`: timestamp
- `estado`: varchar(20) default 'ACTIVO' ('ACTIVO', 'INACTIVO', 'LICENCIA_SUSPENDIDA')
- `vehiculoHabitualId`: integer nullable (FK `vehicles.id`)
- `notas`: text
- `createdAt`: timestamp default now()
- `updatedAt`: timestamp default now()

### B. Tabla `sitios`
- `id`: serial primary key
- `empresaId`: integer not null (FK `empresas.id`)
- `nombre`: text not null (ej: "Planta Zárate", "Depósito Central", "Cliente Quilmes")
- `tipo`: varchar(40) default 'DEPOSITO' ('PLANTA', 'DEPOSITO', 'CLIENTE', 'SUCURSAL', 'PROVEEDOR', 'TALLER', 'OTRO')
- `direccion`: text not null
- `ciudad`: text
- `provincia`: text
- `lat`: doublePrecision not null
- `lng`: doublePrecision not null
- `radioMetros`: integer default 100
- `contactoNombre`: text
- `contactoTelefono`: varchar(50)
- `activo`: integer default 1
- `createdAt`: timestamp default now()
- `updatedAt`: timestamp default now()

### C. Tabla `viajes`
- `id`: serial primary key
- `empresaId`: integer not null (FK `empresas.id`)
- `codigo`: varchar(30) not null (ej: "VIA-1002")
- `choferId`: integer nullable (FK `choferes.id`)
- `vehiculoId`: integer nullable (FK `vehicles.id`)
- `origenTipo`: varchar(20) default 'SITIO' ('SITIO', 'GOOGLE_PLACES')
- `origenSitioId`: integer nullable (FK `sitios.id`)
- `origenNombre`: text not null
- `origenDireccion`: text not null
- `origenLat`: doublePrecision not null
- `origenLng`: doublePrecision not null
- `destinoTipo`: varchar(20) default 'SITIO' ('SITIO', 'GOOGLE_PLACES')
- `destinoSitioId`: integer nullable (FK `sitios.id`)
- `destinoNombre`: text not null
- `destinoDireccion`: text not null
- `destinoLat`: doublePrecision not null
- `destinoLng`: doublePrecision not null
- `distanciaEstimadaKm`: doublePrecision
- `fechaSalidaProgramada`: timestamp not null
- `fechaLlegadaEstimada`: timestamp
- `fechaInicioReal`: timestamp
- `fechaFinReal`: timestamp
- `kmInicio`: integer
- `kmFin`: integer
- `estado`: varchar(30) default 'PLANIFICADO' ('PLANIFICADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO')
- `notas`: text
- `creadoPor`: text
- `createdAt`: timestamp default now()
- `updatedAt`: timestamp default now()

---

## 3. Especificación de Componentes y Vistas

### A. Gestión de Choferes (`/panel/control-flota/choferes`)
- **Cabecera & Pestañas de Estado:** `Todos (X)`, `Activos (Y)`, `Licencia por Vencer (Z)`, `Inactivos (W)`.
- **Tabla Enriquecida:**
  - Chofer (Avatar con iniciales, Nombre y Apellido, DNI).
  - Licencia de Conducir (Categoría, Número, Badge de vigencia con días restantes / vencido).
  - Contacto (Teléfono con link directo de WhatsApp, Email).
  - Estado del Chofer (Badge verde Activo / rojo Inactivo).
  - Acciones: Editar Chofer, Asignar Credenciales de Acceso, Ver Historial de Viajes, Cambiar Estado.
- **Diálogo de Alta / Edición de Chofer:**
  - Datos personales (Nombre, Apellido, DNI, Teléfono, Email).
  - Datos de licencia (Número, Categoría, Fecha de Vencimiento).
  - Opción de "Generar acceso al sistema" (crea/asocia cuenta de usuario con rol `CHOFER` y contraseña inicial).

### B. Autenticación con DNI y Escáner (`/auth/login`)
- Selector de modo de acceso:
  - **Acceso Empresa / Admin:** Email + Contraseña.
  - **Acceso Chofer:** DNI + Contraseña / PIN.
  - **Botón "Escanear DNI":** Permite leer el código de barras en formato PDF417 de los DNI argentinos (o ingreso rápido por cámara / lector de código de barras) que extrae automáticamente el número de DNI.
  - Acceso de prueba demo en 1 clic para el Chofer.

### C. Gestión de Sitios (`/panel/control-flota/sitios`)
- **Cabecera & Pestañas:** `Todos`, `Plantas`, `Depósitos`, `Clientes`, `Sucursales`, `Otros`.
- **Vista Dual Tabla / Mapa:** Listado de sitios con selector para ver en mapa o lista.
- **Diálogo de Alta / Edición de Sitio:**
  - Nombre del Sitio, Tipo/Categoría.
  - Dirección física con geocodificación automática.
  - Selector de posición en mapa interactivo (lat/lng) con ajuste de radio de geocerca.
  - Datos de contacto en destino.

### D. Gestión y Creación de Viajes (`/panel/control-flota/viajes`)
- **Buscador & Filtros:** Por estado (`Planificados`, `En Curso`, `Completados`, `Cancelados`), fecha, chofer y vehículo.
- **Diálogo de Creación de Viaje (`CreateViajeDialog`):**
  - **Selector de Origen:**
    - Opción A: *Sitio Preconfigurado* (Dropdown con buscador de los sitios registrados).
    - Opción B: *Google Places / Búsqueda en Mapa* (Buscador con autocomplete geográfico en tiempo real).
  - **Selector de Destino:**
    - Opción A: *Sitio Preconfigurado*.
    - Opción B: *Google Places / Búsqueda en Mapa*.
  - Asignación de **Vehículo** y **Chofer**.
  - Fecha y hora programada de salida.
  - Notas u observaciones de carga.

### E. Panel Dedicado del Chofer (`/panel/chofer`)
- Interfaz adaptativa mobile-first:
  - **Viaje Actual En Curso:** Indicador destacado con origen, destino, mapa de ruta, odómetro inicial y botón grande `🏁 Finalizar Viaje` (solicita odómetro final y novedades).
  - **Viajes Asignados:** Lista de viajes programados con botón `🚀 Iniciar Viaje` (solicita odómetro de salida y confirmación de vehículo).
  - **Crear Viaje Rápido:** Botón flotante `+ Iniciar Viaje Libre` donde el chofer selecciona origen y destino (sitio o lugar de mapa) y su vehículo.
  - **Acceso rápido a Combustible:** Botón para registrar carga de combustible en ruta.

---

## 4. Navegación en el Sidebar (`app-sidebar.tsx`)
- En `adminNav` (ADMIN_EMPRESA):
  - En **Control de Flota**:
    - `Vehículos` (`/panel/control-flota/vehiculos`, icon: `Truck`)
    - `Choferes` (`/panel/control-flota/choferes`, icon: `UserCheck`)
    - `Viajes` (`/panel/control-flota/viajes`, icon: `Route` o `Navigation`)
    - `Sitios` (`/panel/control-flota/sitios`, icon: `MapPin`)
    - `Mantenimiento` (`/panel/control-flota/mantenimiento`, icon: `Wrench`)
    - `Combustible` (`/panel/control-flota/combustible`, icon: `Fuel`)
    - `Geocercas` (`/panel/control-flota/geocercas`, icon: `Map`)
    - `Grupos de vehículos` (`/panel/control-flota/grupos`, icon: `Users`)
    - `Horarios de uso` (`/panel/control-flota/horarios`, icon: `Clock`)
- En `navByRole.CHOFER`:
  - `Mi Panel / Mis Viajes` (`/panel/chofer`, icon: `Navigation`)
  - `Cargar Combustible` (`/panel/control-flota/combustible`, icon: `Fuel`)

---

## 5. Pruebas y Validación
- Tests unitarios y de integración para:
  - Schemas y Server Actions de Choferes, Sitios y Viajes.
  - Autenticación por DNI en login.
  - Componentes de tabla y diálogos de Choferes, Sitios y Viajes.
  - Panel del chofer (iniciar viaje, finalizar viaje, crear viaje).
