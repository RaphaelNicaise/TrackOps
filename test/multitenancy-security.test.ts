import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInsert, mockValues, mockSelect, mockFrom, mockWhere, mockUpdate, mockSet, mockDelete, mockLimit } = vi.hoisted(() => {
  const mockValues = vi.fn().mockResolvedValue([]);
  const mockLimit = vi.fn().mockResolvedValue([]);
  const mockWhere = vi.fn().mockImplementation(() => ({ limit: mockLimit }));
  const mockSet = vi.fn().mockReturnThis();
  
  const mockFrom = vi.fn().mockImplementation(() => ({ where: mockWhere }));
  const mockInsert = vi.fn().mockImplementation(() => ({ values: mockValues }));
  const mockSelect = vi.fn().mockImplementation(() => ({ from: mockFrom }));
  const mockUpdate = vi.fn().mockImplementation(() => ({ set: mockSet }));
  const mockDelete = vi.fn().mockImplementation(() => ({ where: mockWhere }));
  
  mockSet.mockImplementation(() => ({ where: mockWhere }));
  
  return { mockInsert, mockValues, mockSelect, mockFrom, mockWhere, mockUpdate, mockSet, mockDelete, mockLimit };
});

vi.mock('@/db', () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
  }
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/s3', () => ({
  uploadFile: vi.fn(),
}));

vi.mock('@/lib/impersonation', () => ({
  getEffectiveTenantContext: vi.fn().mockResolvedValue({ empresaId: null, isImpersonating: false }),
}));

import { createFuelTicket, createMaintenanceLog, createDocument, startShift } from '@/lib/actions';
import { checkInVehicle, checkOutVehicle } from '@/lib/chofer-actions';
import { updateChofer, deleteChofer, updateSitio, deleteSitio, iniciarViajeChofer } from '@/lib/flota-actions';
import { auth } from '@/auth';
import { AppError } from '@/lib/api-error';

describe('Multitenancy & IDOR Security Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('IDOR Prevention on Vehicle Sub-resources', () => {
    it('createFuelTicket rejects when vehicle belongs to another company', async () => {
      // User belongs to Empresa 2
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'user-empresa-2', empresaId: 2, role: 'ADMIN_EMPRESA' }
      } as any);

      // Vehicle 100 belongs to Empresa 1 (not 2) -> empty lookup for empresaId=2
      mockLimit.mockResolvedValueOnce([]);

      const formData = new FormData();
      formData.append('vehicleId', '100');
      formData.append('fecha', '2026-08-20');
      formData.append('litros', '40');
      formData.append('costoTotal', '40000');
      formData.append('kilometraje', '50000');

      await expect(createFuelTicket(formData)).rejects.toThrow(AppError);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('createMaintenanceLog rejects when vehicle belongs to another company', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'user-empresa-2', empresaId: 2, role: 'ADMIN_EMPRESA' }
      } as any);

      mockLimit.mockResolvedValueOnce([]); // Vehicle not found in tenant 2

      const formData = new FormData();
      formData.append('vehicleId', '100');
      formData.append('fecha', '2026-08-20');
      formData.append('kilometraje', '55000');
      formData.append('costo', '15000');
      formData.append('taller', 'Taller X');
      formData.append('descripcion', 'Frenos');

      await expect(createMaintenanceLog(formData)).rejects.toThrow(AppError);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('startShift rejects when vehicle belongs to another company', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'chofer-empresa-2', empresaId: 2, role: 'CHOFER' }
      } as any);

      mockLimit.mockResolvedValueOnce([]);

      const formData = new FormData();
      formData.append('vehicleId', '100');
      formData.append('startKm', '50000');

      await expect(startShift(formData)).rejects.toThrow(AppError);
    });

    it('checkInVehicle in chofer-actions rejects when vehicle belongs to another company', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'chofer-empresa-2', empresaId: 2, role: 'CHOFER' }
      } as any);

      mockLimit.mockResolvedValueOnce([]);

      const formData = new FormData();
      formData.append('vehicleId', '100');
      formData.append('startKm', '50000');

      await expect(checkInVehicle(formData)).rejects.toThrow(AppError);
    });
  });

  describe('IDOR Prevention on Flota / Viajes / Choferes / Sitios', () => {
    it('updateChofer fails if chofer does not belong to session company', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'admin-empresa-2', empresaId: 2, role: 'ADMIN_EMPRESA' }
      } as any);

      mockWhere.mockImplementation(() => ({
        returning: vi.fn().mockResolvedValueOnce([]), // 0 rows updated
      }));

      const res = await updateChofer(999, { nombre: 'Hacked' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('sin permisos');
    });

    it('deleteChofer fails if chofer does not belong to session company', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'admin-empresa-2', empresaId: 2, role: 'ADMIN_EMPRESA' }
      } as any);

      mockWhere.mockImplementation(() => ({
        returning: vi.fn().mockResolvedValueOnce([]), // 0 rows deleted
      }));

      const res = await deleteChofer(999);
      expect(res.success).toBe(false);
      expect(res.error).toContain('sin permisos');
    });

    it('updateSitio fails if sitio does not belong to session company', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'admin-empresa-2', empresaId: 2, role: 'ADMIN_EMPRESA' }
      } as any);

      mockWhere.mockImplementation(() => ({
        returning: vi.fn().mockResolvedValueOnce([]),
      }));

      const res = await updateSitio(999, { nombre: 'Sitio Hack' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('sin permisos');
    });

    it('deleteSitio fails if sitio does not belong to session company', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'admin-empresa-2', empresaId: 2, role: 'ADMIN_EMPRESA' }
      } as any);

      mockWhere.mockImplementation(() => ({
        returning: vi.fn().mockResolvedValueOnce([]),
      }));

      const res = await deleteSitio(999);
      expect(res.success).toBe(false);
      expect(res.error).toContain('sin permisos');
    });
  });
});
