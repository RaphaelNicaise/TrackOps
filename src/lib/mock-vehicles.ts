export type MockVehiculo = {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  tipo: string;
  chasis: string;
  kilometrajeActual: number;
  rto: Date | null;
  docCount: number;
  estado: string;
  velocidad: string;
  ultimaActualizacion: string;
  online: boolean;
  hasAlert: boolean;
  lat: number;
  lng: number;
  kilometraje: string;
  alertasCount: number;
};

export const mockVehiculos: MockVehiculo[] = [
  {
    id: 1,
    patente: "AB 123 CD",
    marca: "Ford",
    modelo: "Ranger",
    anio: 2021,
    tipo: "Camioneta",
    chasis: "8ALB2FDVXMG123456",
    kilometrajeActual: 125430,
    rto: new Date("2027-03-15"),
    docCount: 3,
    estado: "En movimiento",
    velocidad: "60 km/h",
    ultimaActualizacion: "Hace 2 min",
    online: true,
    hasAlert: false,
    lat: -38.715,
    lng: -62.265,
    kilometraje: "125.430 km",
    alertasCount: 0,
  },
  {
    id: 2,
    patente: "EF 456 GH",
    marca: "Volkswagen",
    modelo: "Gol",
    anio: 2019,
    tipo: "Auto",
    chasis: "8AWZZZ13ZJA123456",
    kilometrajeActual: 89210,
    rto: new Date("2024-11-20"),
    docCount: 1,
    estado: "Detenido",
    velocidad: "0 km/h",
    ultimaActualizacion: "Hace 5 min",
    online: true,
    hasAlert: true,
    lat: -38.72,
    lng: -62.27,
    kilometraje: "89.210 km",
    alertasCount: 2,
  },
  {
    id: 3,
    patente: "IJ 789 KL",
    marca: "Renault",
    modelo: "Kangoo",
    anio: 2022,
    tipo: "Utilitario",
    chasis: "8A1B5C3VXKJ123456",
    kilometrajeActual: 45100,
    rto: null,
    docCount: 2,
    estado: "Ralentí",
    velocidad: "0 km/h",
    ultimaActualizacion: "Hace 1 min",
    online: true,
    hasAlert: false,
    lat: -38.71,
    lng: -62.26,
    kilometraje: "45.100 km",
    alertasCount: 0,
  },
  {
    id: 4,
    patente: "MN 012 OP",
    marca: "Mercedes-Benz",
    modelo: "Atron",
    anio: 2020,
    tipo: "Camión",
    chasis: "9BM958152MA123456",
    kilometrajeActual: 312800,
    rto: new Date("2026-12-01"),
    docCount: 4,
    estado: "En movimiento",
    velocidad: "75 km/h",
    ultimaActualizacion: "Hace 30 seg",
    online: true,
    hasAlert: true,
    lat: -38.725,
    lng: -62.255,
    kilometraje: "312.800 km",
    alertasCount: 1,
  },
  {
    id: 5,
    patente: "QR 345 ST",
    marca: "Fiat",
    modelo: "Cronos",
    anio: 2023,
    tipo: "Auto",
    chasis: "8AD3973H0PU123456",
    kilometrajeActual: 67900,
    rto: new Date("2028-01-10"),
    docCount: 0,
    estado: "Detenido",
    velocidad: "0 km/h",
    ultimaActualizacion: "Hace 1 hora",
    online: true,
    hasAlert: false,
    lat: -38.718,
    lng: -62.28,
    kilometraje: "67.900 km",
    alertasCount: 0,
  },
];

export function getMockVehiculo(id: number): MockVehiculo | undefined {
  return mockVehiculos.find((v) => v.id === id);
}

export type MockVehiculoPatch = {
  patente?: string;
  marca?: string;
  modelo?: string;
  anio?: number | null;
  tipo?: string | null;
  chasis?: string | null;
  kilometrajeActual?: number;
  rto?: Date | null;
};

export function updateMockVehiculo(id: number, data: MockVehiculoPatch): boolean {
  const idx = mockVehiculos.findIndex((v) => v.id === id);
  if (idx === -1) return false;
  mockVehiculos[idx] = { ...mockVehiculos[idx], ...data } as MockVehiculo;
  return true;
}

export function deleteMockVehiculo(id: number): boolean {
  const idx = mockVehiculos.findIndex((v) => v.id === id);
  if (idx === -1) return false;
  mockVehiculos.splice(idx, 1);
  return true;
}

export function addMockVehiculo(data: MockVehiculoPatch): MockVehiculo {
  const nextId = mockVehiculos.length > 0 ? Math.max(...mockVehiculos.map((v) => v.id)) + 1 : 1;
  const newVehiculo: MockVehiculo = {
    id: nextId,
    patente: (data.patente ?? "").toUpperCase(),
    marca: data.marca ?? "",
    modelo: data.modelo ?? "",
    anio: data.anio ?? null,
    tipo: data.tipo ?? "Camión",
    chasis: data.chasis ?? "",
    kilometrajeActual: data.kilometrajeActual ?? 0,
    rto: data.rto ?? null,
    docCount: 0,
    estado: "Detenido",
    velocidad: "0 km/h",
    ultimaActualizacion: "Recién",
    online: true,
    hasAlert: false,
    lat: -38.715,
    lng: -62.265,
    kilometraje: `${(data.kilometrajeActual ?? 0).toLocaleString("es-AR")} km`,
    alertasCount: 0,
  };
  mockVehiculos.unshift(newVehiculo);
  return newVehiculo;
}

