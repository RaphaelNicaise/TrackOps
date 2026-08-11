import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted for variables that need to be accessed inside vi.mock
const { mockInsert, mockValues, mockSelect, mockFrom, mockWhere, mockUpdate, mockSet } = vi.hoisted(() => {
  const mockValues = vi.fn().mockResolvedValue([]);
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockSet = vi.fn().mockReturnThis();
  
  const mockFrom = vi.fn().mockImplementation(() => ({ where: mockWhere }));
  const mockInsert = vi.fn().mockImplementation(() => ({ values: mockValues }));
  const mockSelect = vi.fn().mockImplementation(() => ({ from: mockFrom }));
  const mockUpdate = vi.fn().mockImplementation(() => ({ set: mockSet }));
  
  mockSet.mockImplementation(() => ({ where: mockWhere }));
  
  return { mockInsert, mockValues, mockSelect, mockFrom, mockWhere, mockUpdate, mockSet };
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

vi.mock('../src/lib/s3', () => ({
  uploadFile: vi.fn(),
}));

import { createFuelTicket, createDocument, createFine, createVehicle, createMaintenanceLog } from '../src/lib/actions';
import { auth } from '../src/auth';
import { uploadFile } from '../src/lib/s3';
import { revalidatePath } from 'next/cache';

describe('Server Actions (Flota & Operaciones)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default auth mock: Logged in as Admin Empresa
    (auth as any).mockResolvedValue({
      user: { empresaId: 1, role: 'ADMIN_EMPRESA' }
    });
  });

  describe('createFuelTicket', () => {
    it('throws error if user has no empresaId', async () => {
      (auth as any).mockResolvedValueOnce({ user: null });
      
      const formData = new FormData();
      await expect(createFuelTicket(formData)).rejects.toThrow('No empresa ID');
    });

    it('inserts fuel ticket and DOES NOT update vehicle km if new km is lower', async () => {
      const formData = new FormData();
      formData.append('vehicleId', '10');
      formData.append('fecha', '2026-08-01');
      formData.append('litros', '50.5');
      formData.append('costoTotal', '50000');
      formData.append('kilometraje', '1000'); // New km
      
      // Mock DB: Current vehicle km is 2000 (higher than 1000)
      mockWhere.mockResolvedValueOnce([{ id: 10, kilometrajeActual: 2000 }]);

      await createFuelTicket(formData);

      // Verify Insert
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        vehicleId: 10,
        litros: 50.5,
        costoTotal: 50000,
        kilometraje: 1000,
        ticketUrl: null
      }));

      // Verify Update was NOT called
      expect(mockUpdate).not.toHaveBeenCalled();
      
      // Verify Revalidate
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/combustible');
    });

    it('inserts fuel ticket and UPDATES vehicle km if new km is higher', async () => {
      const formData = new FormData();
      formData.append('vehicleId', '10');
      formData.append('fecha', '2026-08-01');
      formData.append('litros', '50.5');
      formData.append('costoTotal', '50000');
      formData.append('kilometraje', '3000'); // New km (higher)
      
      // Mock DB: Current vehicle km is 2000
      mockWhere.mockResolvedValueOnce([{ id: 10, kilometrajeActual: 2000 }]);

      await createFuelTicket(formData);

      // Verify Update was called
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({ kilometrajeActual: 3000 });
    });

    it('uploads file to S3 if ticketFile is present and has size', async () => {
      const formData = new FormData();
      formData.append('vehicleId', '10');
      formData.append('kilometraje', '1000');
      formData.append('fecha', '2026-08-01');
      formData.append('litros', '10');
      formData.append('costoTotal', '100');
      
      // Mock file
      const mockFile = new File(['dummy content'], 'ticket.png', { type: 'image/png' });
      formData.append('ticketFile', mockFile);

      (uploadFile as any).mockResolvedValueOnce('/empresa-1/tickets/mock-url.png');
      mockWhere.mockResolvedValueOnce([]); // No vehicle found, doesn't matter for this test

      await createFuelTicket(formData);

      expect(uploadFile).toHaveBeenCalledWith(mockFile, 'empresa-1/tickets');
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        ticketUrl: '/empresa-1/tickets/mock-url.png'
      }));
    });
  });

  describe('createVehicle', () => {
    it('inserts a new vehicle and revalidates flota', async () => {
      const formData = new FormData();
      formData.append('patente', 'AA111AA');
      formData.append('marca', 'Toyota');
      formData.append('modelo', 'Hilux');
      formData.append('anio', '2023');
      formData.append('tipo', 'utilitario');
      formData.append('kilometrajeActual', '500');

      await createVehicle(formData);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        empresaId: 1, // from mocked auth session
        patente: 'AA111AA',
        marca: 'Toyota',
        modelo: 'Hilux',
        anio: 2023,
        tipo: 'utilitario',
        kilometrajeActual: 500,
      }));
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/flota');
    });
  });

  describe('createMaintenanceLog', () => {
    it('inserts log and updates vehicle km if higher', async () => {
      const formData = new FormData();
      formData.append('vehicleId', '5');
      formData.append('fecha', '2026-08-01');
      formData.append('kilometraje', '15000'); // new km
      formData.append('costo', '25000');
      formData.append('taller', 'Taller Los Amigos');
      formData.append('descripcion', 'Cambio de aceite');

      // Current km is 10000 (lower)
      mockWhere.mockResolvedValueOnce([{ id: 5, kilometrajeActual: 10000 }]);

      await createMaintenanceLog(formData);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        vehicleId: 5,
        kilometraje: 15000,
        costo: 25000,
        taller: 'Taller Los Amigos',
        descripcion: 'Cambio de aceite',
      }));

      // Should update km
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({ kilometrajeActual: 15000 });
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/mantenimiento');
    });
  });

  describe('createDocument', () => {
    it('inserts document with S3 url', async () => {
      const formData = new FormData();
      formData.append('vehicleId', '5');
      formData.append('tipoDocumento', 'VTV');
      formData.append('fechaVencimiento', '2027-01-01');
      
      const mockFile = new File(['pdf data'], 'vtv.pdf', { type: 'application/pdf' });
      formData.append('documentFile', mockFile);

      (uploadFile as any).mockResolvedValueOnce('/empresa-1/docs/vtv.pdf');

      await createDocument(formData);

      expect(uploadFile).toHaveBeenCalledWith(mockFile, 'empresa-1/docs');
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        vehicleId: 5,
        tipoDocumento: 'VTV',
        fileUrl: '/empresa-1/docs/vtv.pdf',
      }));
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/documentacion');
    });
  });

  describe('createFine', () => {
    it('inserts fine with default pendiente status', async () => {
      const formData = new FormData();
      formData.append('vehicleId', '10');
      formData.append('fecha', '2026-08-01');
      formData.append('jurisdiccion', 'CABA');
      formData.append('motivo', 'Exceso de velocidad');
      formData.append('monto', '150000');
      // No estado provided

      await createFine(formData);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
        vehicleId: 10,
        jurisdiccion: 'CABA',
        motivo: 'Exceso de velocidad',
        monto: 150000,
        estado: 'pendiente' // Validates default value behavior
      }));
    });
  });
});
