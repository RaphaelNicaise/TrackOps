Bypass de auth demo en producción. src/auth.ts:82 si !user || !user.passwordHash permite login con cualquier password vía DEMO_USERS src/auth.ts:10. src/auth.config.ts:4 secret fallback dev-secret-key-trackops-authjs-123456789. En prod con DATABASE_URL caído entrás como [admin@test.com](mailto:admin@test.com) sin validar. Propuesta: exigir passwordHash siempre, demo solo si ALLOW_DEMO_LOGIN=true &amp;&amp; NODE_ENV!=production, y AUTH_SECRET obligatorio en prod



 Multitenancy roto / IDOR crítico. src/lib/vehicle-actions.ts:15 empresaId ?? 1 contamina empresa 1 si es SUPER_ADMIN. src/app/api/vehicles/[id]/documents/route.ts:28 GET no filtra por empresaId. fuelTickets/gpsLogs/shiftLogs/maintenancePlans sin columna empresa_id src/db/schema.ts:120,129,150,161 — un Admin B puede cargar ticket a vehículo de A enumerando IDs. Propuesta: añadir empresaId a tablas hijo, índice único UNIQUE(empresa_id, patente) (hoy patente unique global src/db/schema.ts:98 te impide que dos empresas tengan mismo dominio), helper requireEmpresaOwnership(vehicleId) y quitar fallback 1. Sin esto no podés cobrar.



5. Validación inexistente (cero Zod). package.json:1 sin zod. src/lib/import-actions.ts:30 inserta row.patente sin trim().toUpperCase(), ni límite tamaño, ni duplicado intra-file. src/app/api/geofences/route.ts:73 acepta empresaId=1 sin session en test. storage.ts sin whitelist mime/size. Propuesta: zod schemas para vehículo/geofence/schedule, regex patente ^[A-Z]{2}\s?\d{3}\s?[A-Z]{2}$, y fileSize &lt;10MB.

Seccion de Combustible + Funcionalidades para el chofer, carga de tickets (foto o manual) para gestionar tema combustible



13. Sin TanStack Table ni paginación. Spec doc/design.md:10 pide TanStack Table data-dense. Tablas son &lt;Table&gt; shadcn con sort manual src/components/dashboard/vehiculos/vehiculos-table.tsx:1 sin sticky header ni limit. export/route.ts:19 hace select * en memoria. Decisión: migrar a @tanstack/react-table (ya tenés react-query/recharts) con 25/50 paginación o dejar simple hasta 500 vehículos.



Tipografía triple. src/app/layout.tsx:1 carga Outfit+Playfair_Display pero globals.css:1 usa SF Pro/Geist. Landing usa font-playfair serif. Decisión: unificar en Outfit (industrial) vs mantener Playfair editorial en landing. Hacer chequeo general de tipografias



Que el Chofer o el admin de la empresa, cuando quiera crear el viaje pueda elegir tanto un sitio (preconfigurado en la seccion sitios) como algun lugar de google places.

Ver el tema del cobro escalonado, porque hay que cobrar mensual pero puede pasar que en el medio de la mensualidad se agreguen vehiculos.

Integrarle a cada vehiculo la columnas para verificar si tiene o no el gps instalado, que modelo, etc. Que eso iria conectado con la cuenta instalador vendedor, cuando instale el GPS, se tendria que reflejar en el vehiculo, que esta funcionando. 