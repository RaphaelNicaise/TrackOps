import { db } from "./index";
import { users, empresas, vehicles, maintenanceLogs, documentCategories, vehicleDocuments, prospectos } from "./schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import postgres from "postgres";


const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/trackops_db";

async function createTablesIfNotExist() {
  const sql = postgres(connectionString);
  try {
    console.log("Verifying / creating database tables and columns if they do not exist...");
    await sql`
      CREATE TABLE IF NOT EXISTS empresas (
        id serial PRIMARY KEY,
        nombre text NOT NULL,
        cuit varchar(20),
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        name text,
        email text UNIQUE,
        "emailVerified" timestamp,
        image text,
        password_hash text,
        role varchar(30) DEFAULT 'CHOFER' NOT NULL,
        empresa_id integer REFERENCES empresas(id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vehicles (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        patente varchar(20) NOT NULL UNIQUE,
        modelo text NOT NULL,
        marca text NOT NULL,
        anio integer,
        tipo varchar(30) DEFAULT 'camion',
        chasis varchar(30),
        kilometraje_actual integer DEFAULT 0 NOT NULL,
        rto timestamp,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rto timestamp;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS document_categories (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        nombre text NOT NULL,
        color varchar(30) DEFAULT 'blue' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vehicle_documents (
        id serial PRIMARY KEY,
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        category_id integer REFERENCES document_categories(id) ON DELETE SET NULL,
        title text NOT NULL,
        file_name text NOT NULL,
        file_key text NOT NULL,
        file_size integer NOT NULL,
        mime_type varchar(100) NOT NULL,
        fecha_vencimiento timestamp,
        notas text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id serial PRIMARY KEY,
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        fecha timestamp NOT NULL,
        kilometraje integer NOT NULL,
        costo double precision DEFAULT 0,
        taller text,
        descripcion text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS prospectos (
        id serial PRIMARY KEY,
        nombre text NOT NULL,
        email text NOT NULL,
        telefono varchar(50),
        empresa text,
        flota_estimada integer,
        mensaje text,
        estado varchar(30) DEFAULT 'nuevo' NOT NULL,
        notas text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS geofences (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        nombre text NOT NULL,
        descripcion text,
        tipo varchar(20) DEFAULT 'Polígono' NOT NULL,
        color varchar(30) DEFAULT '#3b82f6' NOT NULL,
        opacidad double precision DEFAULT 0.25 NOT NULL,
        coordenadas text,
        centro_lat double precision,
        centro_lng double precision,
        radio double precision,
        activa integer DEFAULT 1 NOT NULL,
        target_type varchar(30) DEFAULT 'ALL' NOT NULL,
        target_vehicles text,
        target_categories text,
        target_groups text,
        alert_events text,
        speed_limit integer,
        action_types text,
        email_recipients text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("✓ Database tables verified/created successfully.");
  } finally {
    await sql.end();
  }
}

async function main() {
  console.log("🌱 Starting TrackOps database seeding...");

  await createTablesIfNotExist();

  // 1. Crear / obtener Empresa
  let [emp1] = await db
    .insert(empresas)
    .values([
      { nombre: "Logística Alpha S.A.", cuit: "30-71234567-9" },
    ])
    .returning();

  if (!emp1) {
    [emp1] = await db.select().from(empresas).limit(1);
  }

  const passwordHash = await bcryptjs.hash("password123", 10);

  // 2. Crear Usuarios
  try {
    await db.insert(users).values([
      {
        id: crypto.randomUUID(),
        email: "superadmin@trackops.com",
        role: "SUPER_ADMIN",
        name: "Super Admin",
        passwordHash,
      },
      {
        id: crypto.randomUUID(),
        email: "admin@logistica.com",
        role: "ADMIN_EMPRESA",
        empresaId: emp1.id,
        name: "Admin Logística",
        passwordHash,
      },
      {
        id: crypto.randomUUID(),
        email: "chofer@logistica.com",
        role: "CHOFER",
        empresaId: emp1.id,
        name: "Carlos Conductor",
        passwordHash,
      },
    ]).onConflictDoNothing();
  } catch (e) {
    console.log("Users already exist or seeded.");
  }

  // 3. Crear Categorías de Documentos
  console.log("Seeding document categories...");
  let seededCategories = await db
    .select()
    .from(documentCategories)
    .where(eq(documentCategories.empresaId, emp1.id));


  if (seededCategories.length === 0) {
    seededCategories = await db
      .insert(documentCategories)
      .values([
        { empresaId: emp1.id, nombre: "Seguro", color: "blue" },
        { empresaId: emp1.id, nombre: "Cédula", color: "emerald" },
        { empresaId: emp1.id, nombre: "RTO / VTV", color: "amber" },
        { empresaId: emp1.id, nombre: "Service", color: "purple" },
        { empresaId: emp1.id, nombre: "Habilitaciones", color: "indigo" },
      ])
      .returning();
  }

  const catSeguro = seededCategories.find((c) => c.nombre === "Seguro") || seededCategories[0];
  const catCedula = seededCategories.find((c) => c.nombre === "Cédula") || seededCategories[1];
  const catRto = seededCategories.find((c) => c.nombre === "RTO / VTV") || seededCategories[2];
  const catService = seededCategories.find((c) => c.nombre === "Service") || seededCategories[3];

  // 4. Crear Vehículos (Flota completa)
  console.log("Seeding vehicles...");
  const mockVehiclesData = [
    {
      empresaId: emp1.id,
      patente: "AB 123 CD",
      marca: "Ford",
      modelo: "Ranger",
      anio: 2021,
      tipo: "utilitario",
      chasis: "8ALB2FDVXMG123456",
      kilometrajeActual: 125430,
      rto: new Date("2027-03-15"),
    },
    {
      empresaId: emp1.id,
      patente: "EF 456 GH",
      marca: "Volkswagen",
      modelo: "Gol",
      anio: 2019,
      tipo: "auto",
      chasis: "8AWZZZ13ZJA123456",
      kilometrajeActual: 89210,
      rto: new Date("2024-11-20"),
    },
    {
      empresaId: emp1.id,
      patente: "IJ 789 KL",
      marca: "Renault",
      modelo: "Kangoo",
      anio: 2022,
      tipo: "utilitario",
      chasis: "8A1B5C3VXKJ123456",
      kilometrajeActual: 45100,
      rto: null,
    },
    {
      empresaId: emp1.id,
      patente: "MN 012 OP",
      marca: "Mercedes-Benz",
      modelo: "Atron",
      anio: 2020,
      tipo: "camion",
      chasis: "9BM958152MA123456",
      kilometrajeActual: 312800,
      rto: new Date("2026-12-01"),
    },
    {
      empresaId: emp1.id,
      patente: "QR 345 ST",
      marca: "Fiat",
      modelo: "Cronos",
      anio: 2023,
      tipo: "auto",
      chasis: "8AD3973H0PU123456",
      kilometrajeActual: 67900,
      rto: new Date("2028-01-10"),
    },
  ];

  for (const vData of mockVehiclesData) {
    try {
      let [v] = await db
        .insert(vehicles)
        .values(vData)
        .onConflictDoNothing()
        .returning();

      if (!v) {
        const [existing] = await db.select().from(vehicles).where(eq(vehicles.patente, vData.patente));
        v = existing;
      }

      if (v) {
        // 5. Crear Documentos iniciales para cada vehículo si no existen
        const existingDocs = await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.vehicleId, v.id));
        if (existingDocs.length === 0) {

          if (v.patente === "AB 123 CD") {
            await db.insert(vehicleDocuments).values([
              {
                vehicleId: v.id,
                empresaId: emp1.id,
                categoryId: catSeguro?.id || null,
                title: "Póliza La Segunda 2026",
                fileName: "poliza_seguro_ford_ranger.pdf",
                fileKey: `empresa_${emp1.id}/vehiculos/vehiculo_${v.id}/mock-poliza.pdf`,
                fileSize: 2450000,
                mimeType: "application/pdf",
                fechaVencimiento: new Date("2027-02-28"),
                notas: "Cobertura Todo Riesgo con franquicia",
              },
              {
                vehicleId: v.id,
                empresaId: emp1.id,
                categoryId: catCedula?.id || null,
                title: "Cédula Verde - Titular",
                fileName: "cedula_verde_AB123CD.jpg",
                fileKey: `empresa_${emp1.id}/vehiculos/vehiculo_${v.id}/mock-cedula.jpg`,
                fileSize: 870000,
                mimeType: "image/jpeg",
                fechaVencimiento: null,
                notas: "Escaneado original",
              },
              {
                vehicleId: v.id,
                empresaId: emp1.id,
                categoryId: catRto?.id || null,
                title: "Certificado RTO Vigente",
                fileName: "informe_tecnico_rto_2026.pdf",
                fileKey: `empresa_${emp1.id}/vehiculos/vehiculo_${v.id}/mock-rto.pdf`,
                fileSize: 1150000,
                mimeType: "application/pdf",
                fechaVencimiento: new Date("2027-03-15"),
                notas: "Aprobado sin observaciones",
              },
            ]);
          } else if (v.patente === "EF 456 GH") {
            await db.insert(vehicleDocuments).values([
              {
                vehicleId: v.id,
                empresaId: emp1.id,
                categoryId: catSeguro?.id || null,
                title: "Póliza San Cristóbal",
                fileName: "seguro_gol_2024.pdf",
                fileKey: `empresa_${emp1.id}/vehiculos/vehiculo_${v.id}/mock-seguro-gol.pdf`,
                fileSize: 1540000,
                mimeType: "application/pdf",
                fechaVencimiento: new Date("2024-11-20"),
                notas: "Requiere renovación inmediata",
              },
            ]);
          } else if (v.patente === "IJ 789 KL") {
            await db.insert(vehicleDocuments).values([
              {
                vehicleId: v.id,
                empresaId: emp1.id,
                categoryId: catService?.id || null,
                title: "Factura Service 40.000km",
                fileName: "service_oficial_renault.pdf",
                fileKey: `empresa_${emp1.id}/vehiculos/vehiculo_${v.id}/mock-service.pdf`,
                fileSize: 460000,
                mimeType: "application/pdf",
                fechaVencimiento: null,
                notas: "Cambio aceite y filtros oficial",
              },
              {
                vehicleId: v.id,
                empresaId: emp1.id,
                categoryId: null, // Sin categoría para probar arrastre
                title: "Constancia de Grabado de Autopartes",
                fileName: "grabado_autopartes_kangoo.pdf",
                fileKey: `empresa_${emp1.id}/vehiculos/vehiculo_${v.id}/mock-grabado.pdf`,
                fileSize: 320000,
                mimeType: "application/pdf",
                fechaVencimiento: null,
                notas: "Documento pendiente de clasificar",
              },
            ]);
          }
        }
      }
    } catch (err) {
      console.warn("Vehicle seed notice:", err);
    }
  }

  // 6. Crear Prospectos (Leads CRM)
  console.log("Seeding prospectos...");
  const existingProspectos = await db.select().from(prospectos);
  if (existingProspectos.length === 0) {
    await db.insert(prospectos).values([
      {
        nombre: "Martín Palermo",
        email: "mpalermo@transpalermo.com",
        telefono: "+54 9 11 4455-6677",
        empresa: "Transportes Palermo S.R.L.",
        flotaEstimada: 18,
        mensaje: "Hola, nos interesa el módulo de control de combustible y geocercas para 18 camiones en Buenos Aires.",
        estado: "nuevo",
        notas: "Lead originado desde formulario web de landing page.",
      },
      {
        nombre: "Laura Fernández",
        email: "lfernandez@delsurlog.com.ar",
        telefono: "+54 9 299 512-3456",
        empresa: "Distribuidora del Sur",
        flotaEstimada: 8,
        mensaje: "Buscamos controlar los vencimientos de RTO y seguros de utilitarios con alertas WhatsApp.",
        estado: "contactado",
        notas: "Primer contacto telefónico realizado. Se envió folleto comercial.",
      },
      {
        nombre: "Esteban Quito",
        email: "esteban@quitoexpress.com",
        telefono: "+54 9 351 678-9012",
        empresa: "Quito Logistics & Courier",
        flotaEstimada: 35,
        mensaje: "Queremos agendar una demo técnica para integración de GPS con nuestra flota en Córdoba.",
        estado: "demo_agendada",
        notas: "Demo agendada para el viernes a las 11:00 hs con el equipo de operaciones.",
      },
      {
        nombre: "Sofía Martínez",
        email: "smartinez@fletesexpress.com",
        telefono: "+54 9 11 9876-5432",
        empresa: "Fletes Express Rosario",
        flotaEstimada: 5,
        mensaje: "Queremos probar el sistema para 5 camionetas de reparto urbano.",
        estado: "convertido",
        notas: "Cliente convertido al plan Starter. Crearon cuenta exitosamente.",
      },
      {
        nombre: "Diego Rodríguez",
        email: "diego@transcuyo.com",
        telefono: "+54 9 261 333-4455",
        empresa: "Expreso Cuyo S.A.",
        flotaEstimada: 50,
        mensaje: "Consulta sobre precios por volumen para más de 50 unidades de larga distancia.",
        estado: "descartado",
        notas: "Por el momento decidieron continuar con su proveedor actual de telemetría.",
      },
    ]);
    console.log("✓ Prospectos seeded successfully.");
  }

  console.log("✅ Seeding completed successfully!");
  console.log("You can log in with: admin@logistica.com / password123 (or superadmin@trackops.com)");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
