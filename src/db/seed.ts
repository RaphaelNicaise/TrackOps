import { db } from "./index";
import { users, empresas, vehicles, maintenanceLogs } from "./schema";
import crypto from "crypto";
import bcryptjs from "bcryptjs";

async function main() {
  console.log("Seeding database...");
  
  // 1. Crear Empresas
  const [emp1, emp2] = await db.insert(empresas).values([
    { nombre: "Logística A", cuit: "20-11111111-1" },
    { nombre: "Transporte B", cuit: "20-22222222-2" },
  ]).returning();

  const passwordHash = await bcryptjs.hash("password123", 10);

  // 2. Crear Usuarios
  await db.insert(users).values([
    { id: crypto.randomUUID(), email: "superadmin@trackops.com", role: "SUPER_ADMIN", name: "Super Admin", passwordHash },
    { id: crypto.randomUUID(), email: "admin@logistica.com", role: "ADMIN_EMPRESA", empresaId: emp1.id, name: "Admin A", passwordHash },
    { id: crypto.randomUUID(), email: "chofer@logistica.com", role: "CHOFER", empresaId: emp1.id, name: "Chofer A", passwordHash },
    { id: crypto.randomUUID(), email: "admin2@transporte.com", role: "ADMIN_EMPRESA", empresaId: emp2.id, name: "Admin B", passwordHash },
  ]);

  // 3. Crear Vehículos
  const [v1, v2] = await db.insert(vehicles).values([
    { empresaId: emp1.id, patente: "AA123BB", modelo: "F-150", marca: "Ford", anio: 2020, tipo: "utilitario", kilometrajeActual: 10000 },
    { empresaId: emp2.id, patente: "CC456DD", modelo: "Cargo 1722", marca: "Ford", anio: 2018, tipo: "camion", kilometrajeActual: 50000 },
  ]).returning();

  // 4. Crear Mantenimiento
  await db.insert(maintenanceLogs).values([
    { vehicleId: v1.id, fecha: new Date(), kilometraje: 10000, costo: 50000, taller: "Taller Central", descripcion: "Cambio de aceite y filtros" }
  ]);

  console.log("Seeding complete! You can log in with emails like superadmin@trackops.com and password 'password123'");
  process.exit(0);
}

main().catch(console.error);
