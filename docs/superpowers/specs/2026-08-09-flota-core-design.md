# Flota Core Design

## Goal
Establish the core functional foundation for TrackOps Flota, including role-based conditional dashboards, vehicle management (CRUD), maintenance logs, and a functional database seeding strategy.

## Context
The current application has static UI shells for dashboards and vehicle lists. The goal is to connect these to Drizzle ORM and PostgreSQL using Next.js App Router patterns (Server Components and Server Actions) and adapt the views based on user roles (SuperAdmin, AdminEmpresa, Chofer).

## Architecture & Data Flow

### 1. Role-Based Dashboards
- **Entry Point**: `src/app/dashboard/page.tsx`
- **Logic**: Fetch `session.user.role`.
  - `SUPER_ADMIN`: Renders `<SuperAdminDashboard />`. Fetches total companies and total vehicles globally.
  - `ADMIN_EMPRESA`: Renders `<EmpresaDashboard />`. Fetches total vehicles and maintenance alerts specifically for `user.empresaId`.
- **Data Isolation**: All Drizzle queries (except SuperAdmin) must explicitly filter by `empresaId` to enforce Row-Level Multitenancy.

### 2. Vehicle Management (Flota)
- **View**: `src/app/dashboard/flota/page.tsx` will be a Server Component fetching vehicles via Drizzle for the current `empresaId`.
- **Creation**: 
  - A Shadcn `<Sheet>` component will house the "Añadir Vehículo" form.
  - Form submission will trigger a Server Action (`createVehicle`).
  - The Server Action will insert the record and call `revalidatePath('/dashboard/flota')` to update the UI without client-side navigation.

### 3. Maintenance Logs (Mantenimiento)
- **View**: `src/app/dashboard/mantenimiento/page.tsx` will fetch logs from `maintenanceLogs` joined with `vehicles`.
- **Creation**:
  - A Shadcn `<Dialog>` component will house the "Registrar Mantenimiento" form.
  - A Server Action (`createMaintenanceLog`) will handle the insertion.
  - **Business Logic**: The action must also update `vehicles.kilometrajeActual` if the new log's mileage is higher than the current vehicle mileage.

### 4. Interactive GPS Map (Simulated)
- **View**: `src/app/dashboard/gps/page.tsx`
- **Logic**: Real GPS backend integration is excluded for this iteration. However, we will implement the UI layout for the interactive map (using a placeholder or mock markers) alongside typical tracking system options (vehicle list panel, status filters like 'en marcha', 'detenido', 'sin transmisión').

### 4. Database Seeding & Setup
- **File**: `src/db/seed.ts`
- **Purpose**: Automate the creation of test data to avoid manual data entry during testing.
- **Data Model**:
  - 1 SuperAdmin user.
  - 2 Empresas.
  - 1 AdminEmpresa and 1 Chofer per Empresa.
  - Dummy vehicles and maintenance logs.
- **Execution**: Added as an npm script (`"db:seed": "tsx src/db/seed.ts"`).

## Trade-offs and Constraints
- **Scope limitation**: WhatsApp integration and Mercado Pago are explicitly excluded from this iteration to focus on core platform usability.
- **State management**: Relying heavily on Server Actions and `revalidatePath` to keep the client light and leverage Next.js App Router capabilities, avoiding complex client-side state managers like Zustand for basic CRUD.

## Testing Strategy
- Run the schema push (`drizzle-kit push`) against the local docker-compose PostgreSQL database.
- Execute the seed script.
- Log in with different roles to verify data isolation and conditional UI rendering.
- Test vehicle and maintenance creation flows manually to ensure DB insertions and UI updates work seamlessly.
