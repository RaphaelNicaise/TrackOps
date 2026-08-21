import { empresas, vehicles, alertConfigs } from "@/db/schema";

export interface EmpresaDetail360Data {
  empresa: typeof empresas.$inferSelect;
  subscription: {
    id: number;
    empresaId: number;
    planId: number;
    estado: string;
    fechaInicio: Date;
    fechaFin: Date | null;
    metodoPago: string | null;
    createdAt: Date;
    planNombre?: string | null;
    maxVehiculos?: number | null;
    precioMensual?: number | null;
    precioAnual?: number | null;
  } | null;
  vehicles: (typeof vehicles.$inferSelect)[];
  users: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    mustChangePassword: number;
  }[];
  alertConfig: typeof alertConfigs.$inferSelect | null;
}
