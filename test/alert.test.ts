import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPreventativeAlerts } from '../src/lib/alert-actions';

const { mockSelect, mockFrom, mockWhere, mockInnerJoin } = vi.hoisted(() => {
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockInnerJoin = vi.fn().mockImplementation(() => ({ where: mockWhere }));
  const mockFrom = vi.fn().mockImplementation(() => ({ innerJoin: mockInnerJoin }));
  const mockSelect = vi.fn().mockImplementation(() => ({ from: mockFrom }));
  
  return { mockSelect, mockFrom, mockWhere, mockInnerJoin };
});

vi.mock('../src/db', () => ({
  db: {
    select: mockSelect,
  }
}));

describe('Alert Actions (Phase 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPreventativeAlerts', () => {
    it('returns vehicles exceeding maintenance limits', async () => {
      // Drizzle ORM evaluates: kilometrajeActual >= ultimoServiceKm + intervaloKm
      // We will mock the returned data
      mockWhere.mockResolvedValueOnce([
        {
          id: 1,
          patente: 'AA111AA',
          componente: 'Aceite y Filtros',
          kilometrajeActual: 15500,
          ultimoServiceKm: 5000,
          intervaloKm: 10000
        }
      ]);

      const alerts = await getPreventativeAlerts(1); // empresaId = 1

      expect(mockSelect).toHaveBeenCalled();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].patente).toBe('AA111AA');
    });
  });
});
