import { describe, it, expect } from 'vitest';
import {
  vehicles,
  maintenanceLogs,
  gpsLogs,
  fuelTickets,
  documents,
  shiftLogs,
  maintenancePlans,
  gpsInstallations,
} from '@/db/schema';
import { getTableColumns } from 'drizzle-orm';

describe('Multitenancy Schema Definition', () => {
  it('vehicles table has empresaId and patente columns', () => {
    const cols = getTableColumns(vehicles);
    expect(cols.empresaId).toBeDefined();
    expect(cols.patente).toBeDefined();
  });

  it('all child tables have empresaId column', () => {
    expect(getTableColumns(maintenanceLogs).empresaId).toBeDefined();
    expect(getTableColumns(gpsLogs).empresaId).toBeDefined();
    expect(getTableColumns(fuelTickets).empresaId).toBeDefined();
    expect(getTableColumns(documents).empresaId).toBeDefined();
    expect(getTableColumns(shiftLogs).empresaId).toBeDefined();
    expect(getTableColumns(maintenancePlans).empresaId).toBeDefined();
    expect(getTableColumns(gpsInstallations).empresaId).toBeDefined();
  });
});
