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
        email text,
        telefono varchar(50),
        direccion text,
        ciudad text,
        provincia text,
        setup_completado integer DEFAULT 0 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS telefono varchar(50);`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS direccion text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ciudad text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS provincia text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS setup_completado integer DEFAULT 0 NOT NULL;`;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        name text,
        email text UNIQUE,
        "emailVerified" timestamp,
        image text,
        password_hash text,
        role varchar(30) DEFAULT 'CHOFER' NOT NULL,
        empresa_id integer REFERENCES empresas(id),
        must_change_password integer DEFAULT 0 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password integer DEFAULT 0 NOT NULL;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL;`;

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
    await sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id serial PRIMARY KEY,
        nombre text NOT NULL,
        max_vehiculos integer NOT NULL,
        precio_mensual double precision NOT NULL,
        precio_anual double precision,
        activo integer DEFAULT 1 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS empresa_subscriptions (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        plan_id integer NOT NULL REFERENCES subscription_plans(id),
        estado varchar(20) DEFAULT 'activa' NOT NULL,
        fecha_inicio timestamp DEFAULT now() NOT NULL,
        fecha_fin timestamp,
        metodo_pago varchar(30),
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS alert_configs (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        canal_email integer DEFAULT 1 NOT NULL,
        canal_whatsapp integer DEFAULT 0 NOT NULL,
        email_destino text,
        telefono_whatsapp varchar(20),
        tolerancia_km integer DEFAULT 500,
        tolerancia_dias integer DEFAULT 15,
        modulos_habilitados text DEFAULT '["MANTENIMIENTO","DOCUMENTACION","GEOCERCAS","HORARIOS"]' NOT NULL,
        activo integer DEFAULT 1 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      ALTER TABLE alert_configs ADD COLUMN IF NOT EXISTS modulos_habilitados text DEFAULT '["MANTENIMIENTO","DOCUMENTACION","GEOCERCAS","HORARIOS"]' NOT NULL;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS alert_logs (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        modulo varchar(50) NOT NULL,
        tipo varchar(50) NOT NULL,
        severidad varchar(20) DEFAULT 'MEDIA' NOT NULL,
        titulo text NOT NULL,
        mensaje text NOT NULL,
        canal varchar(30) NOT NULL,
        destinatario_email text,
        destinatario_whatsapp varchar(50),
        vehiculo_id integer REFERENCES vehicles(id) ON DELETE SET NULL,
        patente varchar(20),
        metadata text,
        estado varchar(30) DEFAULT 'MOCK_DISPATCHED' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id serial PRIMARY KEY,
        user_id text,
        user_name text,
        action varchar(20) NOT NULL,
        entity_type varchar(50) NOT NULL,
        entity_id text,
        details text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_plans (
        id serial PRIMARY KEY,
        vehicle_id integer NOT NULL REFERENCES vehicles(id),
        componente varchar(100) NOT NULL,
        intervalo_km integer NOT NULL,
        ultimo_service_km integer NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vehicle_groups (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        nombre text NOT NULL,
        descripcion text,
        color varchar(30) DEFAULT '#3b82f6' NOT NULL,
        icono varchar(50) DEFAULT 'truck' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS vehicle_group_members (
        id serial PRIMARY KEY,
        group_id integer NOT NULL REFERENCES vehicle_groups(id) ON DELETE CASCADE,
        vehicle_id integer NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS schedules (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        nombre text NOT NULL,
        descripcion text,
        color varchar(30) DEFAULT '#F2B705' NOT NULL,
        activo integer DEFAULT 1 NOT NULL,
        dias_config text NOT NULL,
        tolerancia_minutos integer DEFAULT 5 NOT NULL,
        target_type varchar(30) DEFAULT 'ALL' NOT NULL,
        target_vehicles text,
        target_categories text,
        target_groups text,
        alert_channels text DEFAULT '["UI"]' NOT NULL,
        email_recipients text,
        whatsapp_recipients text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS schedule_violations (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        schedule_id integer REFERENCES schedules(id) ON DELETE SET NULL,
        vehicle_id integer NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        patente varchar(20) NOT NULL,
        fecha_inicio timestamp NOT NULL,
        fecha_fin timestamp,
        duracion_minutos integer DEFAULT 0 NOT NULL,
        velocidad_maxima double precision DEFAULT 0 NOT NULL,
        lat double precision,
        lng double precision,
        notificado_email integer DEFAULT 0 NOT NULL,
        notificado_whatsapp integer DEFAULT 0 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tickets_soporte (
        id serial PRIMARY KEY,
        origen varchar(20) DEFAULT 'PANEL' NOT NULL,
        empresa_id integer REFERENCES empresas(id) ON DELETE SET NULL,
        user_id text REFERENCES users(id) ON DELETE SET NULL,
        nombre_contacto text NOT NULL,
        email_contacto text NOT NULL,
        telefono_contacto varchar(50),
        empresa_nombre_manual text,
        tipo varchar(40) NOT NULL,
        prioridad varchar(20) DEFAULT 'MEDIA' NOT NULL,
        estado varchar(30) DEFAULT 'PENDIENTE' NOT NULL,
        asunto text NOT NULL,
        mensaje text NOT NULL,
        preferencia_respuesta varchar(20) DEFAULT 'EMAIL',
        notas_internas text,
        resuelto_por text,
        resuelto_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dni varchar(20);`;

    await sql`
      CREATE TABLE IF NOT EXISTS choferes (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        user_id text REFERENCES users(id) ON DELETE SET NULL,
        nombre text NOT NULL,
        apellido text NOT NULL,
        dni varchar(20) NOT NULL,
        telefono varchar(50),
        email text,
        licencia_numero varchar(50),
        licencia_categoria varchar(20),
        licencia_vencimiento timestamp,
        estado varchar(30) DEFAULT 'ACTIVO' NOT NULL,
        vehiculo_habitual_id integer REFERENCES vehicles(id) ON DELETE SET NULL,
        notas text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sitios (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        nombre text NOT NULL,
        tipo varchar(40) DEFAULT 'DEPOSITO' NOT NULL,
        direccion text NOT NULL,
        ciudad text,
        provincia text,
        lat double precision NOT NULL,
        lng double precision NOT NULL,
        radio_metros integer DEFAULT 100 NOT NULL,
        contacto_nombre text,
        contacto_telefono varchar(50),
        activo integer DEFAULT 1 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS viajes (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        codigo varchar(30) NOT NULL,
        chofer_id integer REFERENCES choferes(id) ON DELETE SET NULL,
        vehiculo_id integer REFERENCES vehicles(id) ON DELETE SET NULL,
        origen_tipo varchar(20) DEFAULT 'SITIO' NOT NULL,
        origen_sitio_id integer REFERENCES sitios(id) ON DELETE SET NULL,
        origen_nombre text NOT NULL,
        origen_direccion text NOT NULL,
        origen_lat double precision NOT NULL,
        origen_lng double precision NOT NULL,
        destino_tipo varchar(20) DEFAULT 'SITIO' NOT NULL,
        destino_sitio_id integer REFERENCES sitios(id) ON DELETE SET NULL,
        destino_nombre text NOT NULL,
        destino_direccion text NOT NULL,
        destino_lat double precision NOT NULL,
        destino_lng double precision NOT NULL,
        distancia_estimada_km double precision,
        fecha_salida_programada timestamp NOT NULL,
        fecha_llegada_estimada timestamp,
        fecha_inicio_real timestamp,
        fecha_fin_real timestamp,
        km_inicio integer,
        km_fin integer,
        estado varchar(30) DEFAULT 'PLANIFICADO' NOT NULL,
        notas text,
        creado_por text,
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
