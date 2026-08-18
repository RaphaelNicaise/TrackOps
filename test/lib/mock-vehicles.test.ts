import { describe, it, expect } from 'vitest';
import { addMockVehiculo, mockVehiculos } from '@/lib/mock-vehicles';

describe('mock-vehicles helper', () => {
  it('adds a new vehicle with generated id and defaults', () => {
    const initialCount = mockVehiculos.length;
    const newVeh = addMockVehiculo({
      patente: 'AA 999 ZZ',
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2024,
      tipo: 'Camioneta',
      chasis: '8AJBA3CD4E5678901',
      kilometrajeActual: 1500,
    });

    expect(newVeh.id).toBeGreaterThan(0);
    expect(newVeh.patente).toBe('AA 999 ZZ');
    expect(newVeh.marca).toBe('Toyota');
    expect(mockVehiculos.length).toBe(initialCount + 1);
    expect(mockVehiculos.find((v) => v.patente === 'AA 999 ZZ')).toBeDefined();
  });
});
