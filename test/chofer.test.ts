import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInsert, mockValues, mockSelect, mockFrom, mockWhere, mockUpdate, mockSet, mockLimit } = vi.hoisted(() => {
  const mockValues = vi.fn().mockResolvedValue([]);
  const mockLimit = vi.fn().mockResolvedValue([]);
  const mockWhere = vi.fn().mockImplementation(() => ({
    limit: mockLimit,
    then: (resolve: any, reject?: any) => Promise.resolve([]).then(resolve, reject),
  }));
  const mockSet = vi.fn().mockReturnThis();
  
  const mockFrom = vi.fn().mockImplementation(() => ({ where: mockWhere }));
  const mockInsert = vi.fn().mockImplementation(() => ({ values: mockValues }));
  const mockSelect = vi.fn().mockImplementation(() => ({ from: mockFrom }));
  const mockUpdate = vi.fn().mockImplementation(() => ({ set: mockSet }));
  
  mockSet.mockImplementation(() => ({ where: mockWhere }));
  
  return { mockInsert, mockValues, mockSelect, mockFrom, mockWhere, mockUpdate, mockSet, mockLimit };
});

vi.mock('../src/db', () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  }
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('../src/auth', () => ({
  auth: vi.fn(),
}));

import { checkInVehicle, checkOutVehicle } from '../src/lib/chofer-actions';
import { auth } from '../src/auth';
import { revalidatePath } from 'next/cache';

describe('Chofer Actions (Shift Logs)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue([{ id: 5, empresaId: 1, kilometrajeActual: 10000 }]);
    
    // Default auth mock: Logged in as Chofer
    (auth as any).mockResolvedValue({
      user: { id: 'chofer-123', empresaId: 1, role: 'CHOFER' }
    });
  });

  describe('checkInVehicle', () => {
    it('throws error if vehicle is already in use', async () => {
      // Mock db returns an active shift log (endTime is null)
      mockWhere.mockImplementation(() => ({
        limit: mockLimit,
        then: (resolve: any, reject?: any) => Promise.resolve([{ id: 1, vehicleId: 5, endTime: null }]).then(resolve, reject),
      }));
      
      const formData = new FormData();
      formData.append('vehicleId', '5');
      formData.append('startKm', '10000');

      await expect(checkInVehicle(formData)).rejects.toThrow('El vehículo ya está en uso');
    });

    it('inserts a new shift log if vehicle is free', async () => {
      // Mock db returns empty array (no active shift log)
      mockWhere.mockImplementation(() => ({
        limit: mockLimit,
        then: (resolve: any, reject?: any) => Promise.resolve([]).then(resolve, reject),
      }));
      
      const formData = new FormData();
      formData.append('vehicleId', '5');
      formData.append('startKm', '10000');

      await checkInVehicle(formData);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        vehicleId: 5,
        userId: 'chofer-123',
        startKm: 10000,
      }));
      expect(revalidatePath).toHaveBeenCalledWith('/panel/chofer');
    });
  });

  describe('checkOutVehicle', () => {
    it('updates shift log with end time and end km, and updates vehicle km', async () => {
      mockLimit.mockResolvedValue([{ id: 1, empresaId: 1, vehicleId: 5, startTime: new Date() }]);
      
      const formData = new FormData();
      formData.append('shiftLogId', '1');
      formData.append('vehicleId', '5');
      formData.append('endKm', '10500');

      await checkOutVehicle(formData);

      // Verify Shift Log update
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      // First update call is for shiftLogs
      expect(mockSet).toHaveBeenNthCalledWith(1, expect.objectContaining({
        endKm: 10500,
        endTime: expect.any(Date)
      }));

      // Second update call is for vehicles table to update km
      expect(mockSet).toHaveBeenNthCalledWith(2, { kilometrajeActual: 10500 });
      
      expect(revalidatePath).toHaveBeenCalledWith('/panel/chofer');
    });
  });
});
