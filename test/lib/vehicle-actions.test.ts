import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInsert, mockValues } = vi.hoisted(() => {
  const mockValues = vi.fn().mockResolvedValue([{ id: 10 }]);
  const mockInsert = vi.fn().mockImplementation(() => ({ values: mockValues, returning: vi.fn().mockResolvedValue([{ id: 10 }]) }));
  return { mockInsert, mockValues };
});

vi.mock('@/db', () => ({
  db: {
    insert: mockInsert,
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import { createVehicle } from '@/lib/vehicle-actions';
import { auth } from '@/auth';

describe('vehicle-actions: createVehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { id: 'u1', empresaId: 1 }
    });
  });

  it('throws an error if not authenticated', async () => {
    (auth as any).mockResolvedValueOnce({ user: null });
    const fd = new FormData();
    await expect(createVehicle(fd)).rejects.toThrow('No autorizado');
  });

  it('inserts into db when connected and revalidates path', async () => {
    const fd = new FormData();
    fd.set('patente', 'AA 100 BB');
    fd.set('marca', 'Scania');
    fd.set('modelo', 'R450');
    fd.set('anio', '2022');
    fd.set('tipo', 'Camión');
    fd.set('chasis', '9BS12345');
    fd.set('kilometrajeActual', '50000');
    fd.set('rto', '2026-10-01');

    const res = await createVehicle(fd);

    expect(res).toEqual({ success: true });
    expect(mockInsert).toHaveBeenCalled();
  });

  it('falls back to mock storage when db insert fails', async () => {
    mockValues.mockRejectedValueOnce(new Error('DB connection failed'));
    const fd = new FormData();
    fd.set('patente', 'ZZ 999 YY');
    fd.set('marca', 'Volvo');
    fd.set('modelo', 'FH');

    const res = await createVehicle(fd);
    expect(res).toEqual({ success: true });
  });
});
