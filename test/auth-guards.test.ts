import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSelect, mockFrom, mockWhere, mockLimit } = vi.hoisted(() => {
  const mockLimit = vi.fn().mockResolvedValue([]);
  const mockWhere = vi.fn().mockImplementation(() => ({ limit: mockLimit }));
  const mockFrom = vi.fn().mockImplementation(() => ({ where: mockWhere }));
  const mockSelect = vi.fn().mockImplementation(() => ({ from: mockFrom }));

  return { mockSelect, mockFrom, mockWhere, mockLimit };
});

vi.mock('@/db', () => ({
  db: {
    select: mockSelect,
  },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/impersonation', () => ({
  getEffectiveTenantContext: vi.fn().mockResolvedValue({ empresaId: null, isImpersonating: false }),
}));

import { requireVehicleOwnership, getEffectiveEmpresaId } from '@/lib/auth-guards';
import { getEffectiveTenantContext } from '@/lib/impersonation';
import { AppError } from '@/lib/api-error';

describe('Auth & Tenant Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEffectiveEmpresaId', () => {
    it('returns empresaId from normal tenant session', async () => {
      const session = { user: { id: 'u1', empresaId: 42, role: 'ADMIN_EMPRESA' } };
      const id = await getEffectiveEmpresaId(session);
      expect(id).toBe(42);
    });

    it('returns empresaId from impersonation when superadmin is impersonating', async () => {
      (getEffectiveTenantContext as any).mockResolvedValueOnce({
        empresaId: 99,
        isImpersonating: true,
      });
      const session = { user: { id: 'admin', role: 'SUPER_ADMIN' } };
      const id = await getEffectiveEmpresaId(session);
      expect(id).toBe(99);
    });

    it('throws UNAUTHORIZED when session has no empresa and not impersonating', async () => {
      (getEffectiveTenantContext as any).mockResolvedValueOnce({
        empresaId: null,
        isImpersonating: false,
      });
      const session = { user: { id: 'u2', role: 'SUPER_ADMIN' } };
      await expect(getEffectiveEmpresaId(session)).rejects.toThrow(AppError);
    });

    it('throws UNAUTHORIZED when session is null', async () => {
      await expect(getEffectiveEmpresaId(null)).rejects.toThrow('No autorizado');
    });
  });

  describe('requireVehicleOwnership', () => {
    it('returns vehicle when it belongs to the tenant', async () => {
      mockLimit.mockResolvedValueOnce([{ id: 10, empresaId: 5, patente: 'AA111AA' }]);
      const v = await requireVehicleOwnership(10, 5);
      expect(v.id).toBe(10);
    });

    it('throws NOT_FOUND when vehicle belongs to another tenant or does not exist', async () => {
      mockLimit.mockResolvedValueOnce([]);
      await expect(requireVehicleOwnership(999, 5)).rejects.toThrow(AppError);
    });
  });
});
