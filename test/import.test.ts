import { describe, it, expect, vi, beforeEach } from 'vitest';
import Papa from 'papaparse';
import { importVehiclesCSV } from '../src/lib/import-actions';

const { mockInsert, mockValues, mockSelect, mockFrom, mockWhere, mockTransaction } = vi.hoisted(() => {
  const mockValues = vi.fn().mockResolvedValue([]);
  const mockWhere = vi.fn().mockResolvedValue([]);
  
  const mockFrom = vi.fn().mockImplementation(() => ({ where: mockWhere }));
  const mockInsert = vi.fn().mockImplementation(() => ({ values: mockValues }));
  const mockSelect = vi.fn().mockImplementation(() => ({ from: mockFrom }));
  
  const mockTransaction = vi.fn().mockImplementation(async (cb) => {
    // pass the mocked db to the transaction callback
    return await cb({ insert: mockInsert, select: mockSelect });
  });

  return { mockInsert, mockValues, mockSelect, mockFrom, mockWhere, mockTransaction };
});

vi.mock('../src/db', () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
    transaction: mockTransaction,
  }
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('../src/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '../src/auth';
import { revalidatePath } from 'next/cache';

describe('Import Actions (Phase 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { id: 'admin-123', empresaId: 1, role: 'ADMIN_EMPRESA' }
    });
  });

  describe('importVehiclesCSV', () => {
    it('throws error if file is missing', async () => {
      const formData = new FormData();
      await expect(importVehiclesCSV(formData)).rejects.toThrow('No se encontró archivo CSV');
    });

    it('parses CSV and inserts multiple vehicles', async () => {
      const csvContent = `patente,marca,modelo,anio,tipo,kilometrajeActual
AB123CD,Ford,Ranger,2021,utilitario,50000
AA000AA,Mercedes,Benz,2018,camion,120000`;
      
      const file = new File([csvContent], 'flota.csv', { type: 'text/csv' });
      const formData = new FormData();
      formData.append('csvFile', file);

      await importVehiclesCSV(formData);

      expect(mockTransaction).toHaveBeenCalled();
      
      // Inside transaction, it should insert multiple rows
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ patente: 'AB123CD', empresaId: 1 }),
        expect.objectContaining({ patente: 'AA000AA', empresaId: 1 }),
      ]));

      expect(revalidatePath).toHaveBeenCalledWith(expect.stringContaining('/panel'));
    });
  });
});
