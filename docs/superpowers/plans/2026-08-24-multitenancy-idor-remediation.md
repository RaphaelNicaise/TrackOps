# Multitenancy & IDOR Critical Remediation Plan

**Goal:** Eliminate cross-tenant data leakage (IDOR), remove unsafe fallback `?? 1` defaults, migrate child tables to include `empresa_id`, and enforce per-tenant vehicle uniqueness `UNIQUE(empresa_id, patente)`.

**Architecture:** 
- Centralized security guards in `src/lib/auth-guards.ts` for verifying tenant context and entity ownership (`requireVehicleOwnership`, `requireEmpresaContext`, etc.).
- Schema update in `src/db/schema.ts` adding `empresa_id` to child tables (`maintenance_logs`, `gps_logs`, `fuel_tickets`, `shift_logs`, `maintenance_plans`, `gps_installations`) and replacing global `patente.unique()` with composite `UNIQUE(empresa_id, patente)`.
- SQL migration in `src/db/migrate.ts` to alter constraints and backfill existing child records.
- Refactoring of Server Actions in `src/lib/actions.ts`, `src/lib/chofer-actions.ts`, `src/lib/flota-actions.ts`, `src/lib/alert-config-actions.ts` and API routes to enforce strict tenant isolation.

**Tech Stack:** Next.js 14 (App Router, Server Actions), Drizzle ORM, PostgreSQL / PostGIS, Vitest.

---

### Task 1: Create Centralized Auth & Tenant Ownership Guards
- Implement `src/lib/auth-guards.ts`
- Implement `test/auth-guards.test.ts`

### Task 2: Update Database Schema & Migration for Tenant Scoping
- Update `src/db/schema.ts` with `empresaId` on child tables and composite index `vehicles_empresa_patente_idx`.
- Update `src/db/migrate.ts` with migration SQL and data backfill.
- Implement `test/multitenancy-schema.test.ts`.

### Task 3: Secure Server Actions Against IDOR & Cross-Tenant Access
- Update `src/lib/actions.ts` to validate vehicle ownership and insert `empresaId`.
- Update `src/lib/chofer-actions.ts` to validate ownership and insert `empresaId`.
- Update `src/lib/flota-actions.ts` and `src/lib/alert-config-actions.ts` to eliminate `?? 1` fallbacks and check tenant scope.
- Implement `test/multitenancy-security.test.ts`.

### Task 4: Secure Document & Category API Routes
- Update `src/app/api/vehicles/[id]/categories/route.ts`
- Update `src/app/api/documents/[id]/route.ts`
- Update `src/app/api/documents/[id]/download/route.ts`
- Update `src/app/api/documents/[id]/view/route.ts`

### Task 5: Full Test Suite Verification
- Run complete test suite and verify 100% passing tests.
