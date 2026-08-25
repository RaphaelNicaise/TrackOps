import postgres from "postgres";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { INITIAL_MOCK_GEOFENCES } from "../lib/mock-geofences";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/trackops_db";

export async function runMigrations() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    console.log("Ensuring PostGIS extension and all tables exist in PostgreSQL...");

    // PostGIS Extension
    await sql`CREATE EXTENSION IF NOT EXISTS postgis;`;

    // 1. empresas
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
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cuit varchar(20);`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS telefono varchar(50);`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS direccion text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ciudad text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS provincia text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS setup_completado integer DEFAULT 0 NOT NULL;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL;`;

    // 2. users
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
        dni varchar(20),
        must_change_password integer DEFAULT 0 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dni varchar(20);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password integer DEFAULT 0 NOT NULL;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL;`;

    // 3. NextAuth accounts & sessions & verificationToken
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        "userId" text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type text NOT NULL,
        provider text NOT NULL,
        "providerAccountId" text NOT NULL,
        refresh_token text,
        access_token text,
        expires_at integer,
        token_type text,
        scope text,
        id_token text,
        session_state text,
        PRIMARY KEY (provider, "providerAccountId")
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        "sessionToken" text PRIMARY KEY,
        "userId" text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires timestamp NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "verificationToken" (
        identifier text NOT NULL,
        token text NOT NULL,
        expires timestamp NOT NULL,
        PRIMARY KEY (identifier, token)
      );
    `;

    // 4. vehicles
    await sql`
      CREATE TABLE IF NOT EXISTS vehicles (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        patente varchar(20) NOT NULL,
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
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chasis varchar(30);`;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS kilometraje_actual integer DEFAULT 0 NOT NULL;`;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rto timestamp;`;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL;`;
    
    try {
      await sql`ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_patente_unique;`;
      await sql`ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_patente_key;`;
    } catch {
      // Ignored
    }
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS vehicles_empresa_patente_idx ON vehicles (empresa_id, patente);`;
    await sql`CREATE INDEX IF NOT EXISTS vehicles_empresa_idx ON vehicles (empresa_id);`;

    // 5. maintenance_logs
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        fecha timestamp NOT NULL,
        kilometraje integer NOT NULL,
        costo double precision DEFAULT 0,
        taller text,
        descripcion text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`CREATE INDEX IF NOT EXISTS maintenance_logs_empresa_idx ON maintenance_logs (empresa_id);`;
    await sql`CREATE INDEX IF NOT EXISTS maintenance_logs_vehicle_idx ON maintenance_logs (vehicle_id);`;

    // 6. gps_logs
    await sql`
      CREATE TABLE IF NOT EXISTS gps_logs (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        lat double precision NOT NULL,
        lng double precision NOT NULL,
        speed double precision DEFAULT 0,
        timestamp timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE gps_logs ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`CREATE INDEX IF NOT EXISTS gps_logs_empresa_idx ON gps_logs (empresa_id);`;
    await sql`CREATE INDEX IF NOT EXISTS gps_logs_vehicle_idx ON gps_logs (vehicle_id);`;

    // 7. fuel_tickets
    await sql`
      CREATE TABLE IF NOT EXISTS fuel_tickets (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        fecha timestamp NOT NULL,
        litros double precision NOT NULL,
        costo_total double precision NOT NULL,
        kilometraje integer NOT NULL,
        ticket_url text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE fuel_tickets ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`CREATE INDEX IF NOT EXISTS fuel_tickets_empresa_idx ON fuel_tickets (empresa_id);`;
    await sql`CREATE INDEX IF NOT EXISTS fuel_tickets_vehicle_idx ON fuel_tickets (vehicle_id);`;

    // 8. documents
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        tipo_documento varchar(50) NOT NULL,
        fecha_vencimiento timestamp NOT NULL,
        file_url text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`CREATE INDEX IF NOT EXISTS documents_empresa_idx ON documents (empresa_id);`;
    await sql`CREATE INDEX IF NOT EXISTS documents_vehicle_idx ON documents (vehicle_id);`;

    // 9. shift_logs
    await sql`
      CREATE TABLE IF NOT EXISTS shift_logs (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        user_id text REFERENCES users(id) NOT NULL,
        start_time timestamp NOT NULL,
        end_time timestamp,
        start_km integer NOT NULL,
        end_km integer,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE shift_logs ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`CREATE INDEX IF NOT EXISTS shift_logs_empresa_idx ON shift_logs (empresa_id);`;
    await sql`CREATE INDEX IF NOT EXISTS shift_logs_vehicle_idx ON shift_logs (vehicle_id);`;

    // 10. maintenance_plans
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_plans (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        componente varchar(100) NOT NULL,
        intervalo_km integer NOT NULL,
        ultimo_service_km integer NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS componente varchar(100);`;
    await sql`ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS intervalo_km integer;`;
    await sql`ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS ultimo_service_km integer;`;
    await sql`CREATE INDEX IF NOT EXISTS maintenance_plans_empresa_idx ON maintenance_plans (empresa_id);`;
    await sql`CREATE INDEX IF NOT EXISTS maintenance_plans_vehicle_idx ON maintenance_plans (vehicle_id);`;

    // 11. audit_logs
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

    // 12. subscription_plans
    await sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id serial PRIMARY KEY,
        nombre text NOT NULL,
        min_vehiculos integer DEFAULT 1 NOT NULL,
        max_vehiculos integer,
        precio_mensual double precision NOT NULL,
        precio_anual double precision,
        activo integer DEFAULT 1 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS min_vehiculos integer DEFAULT 1 NOT NULL;`;
    await sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_vehiculos integer;`;
    await sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS precio_mensual double precision;`;
    await sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS precio_anual double precision;`;
    await sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS activo integer DEFAULT 1 NOT NULL;`;

    // 13. empresa_subscriptions
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
    await sql`ALTER TABLE empresa_subscriptions ADD COLUMN IF NOT EXISTS estado varchar(20) DEFAULT 'activa' NOT NULL;`;
    await sql`ALTER TABLE empresa_subscriptions ADD COLUMN IF NOT EXISTS fecha_inicio timestamp DEFAULT now() NOT NULL;`;
    await sql`ALTER TABLE empresa_subscriptions ADD COLUMN IF NOT EXISTS fecha_fin timestamp;`;
    await sql`ALTER TABLE empresa_subscriptions ADD COLUMN IF NOT EXISTS metodo_pago varchar(30);`;

    // 14. alert_configs
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
    await sql`ALTER TABLE alert_configs ADD COLUMN IF NOT EXISTS modulos_habilitados text DEFAULT '["MANTENIMIENTO","DOCUMENTACION","GEOCERCAS","HORARIOS"]' NOT NULL;`;

    // 15. alert_logs
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
    await sql`ALTER TABLE alert_logs ADD COLUMN IF NOT EXISTS destinatario_email text;`;
    await sql`ALTER TABLE alert_logs ADD COLUMN IF NOT EXISTS destinatario_whatsapp varchar(50);`;
    await sql`ALTER TABLE alert_logs ADD COLUMN IF NOT EXISTS estado varchar(30) DEFAULT 'MOCK_DISPATCHED' NOT NULL;`;

    // 16. gps_installations
    await sql`
      CREATE TABLE IF NOT EXISTS gps_installations (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        vehicle_id integer NOT NULL REFERENCES vehicles(id),
        instalador_id text REFERENCES users(id),
        dispositivo_modelo text,
        dispositivo_serial varchar(50),
        estado varchar(20) DEFAULT 'pendiente' NOT NULL,
        fecha_instalacion timestamp,
        notas text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS gps_installations_empresa_idx ON gps_installations (empresa_id);`;
    await sql`CREATE INDEX IF NOT EXISTS gps_installations_vehicle_idx ON gps_installations (vehicle_id);`;

    // 17. document_categories
    await sql`
      CREATE TABLE IF NOT EXISTS document_categories (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        nombre text NOT NULL,
        color varchar(30) DEFAULT 'blue' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    // 18. vehicle_documents
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

    // 19. geofences
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

    // 20. prospectos
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

    // 21. vehicle_groups
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

    // 22. vehicle_group_members
    await sql`
      CREATE TABLE IF NOT EXISTS vehicle_group_members (
        id serial PRIMARY KEY,
        group_id integer NOT NULL REFERENCES vehicle_groups(id) ON DELETE CASCADE,
        vehicle_id integer NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    // 23. schedules
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

    // 24. schedule_violations
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

    // 25. tickets_soporte
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

    // 26. choferes
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
        foto_dni_frente text,
        foto_dni_dorso text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE choferes ADD COLUMN IF NOT EXISTS foto_dni_frente text;`;
    await sql`ALTER TABLE choferes ADD COLUMN IF NOT EXISTS foto_dni_dorso text;`;

    // 27. sitios
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

    // 28. viajes
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

    console.log("✓ All tables verified and created successfully.");

    // ═══════════════════════════════════════════════════════════
    // SEEDING DEFAULT DATA
    // ═══════════════════════════════════════════════════════════

    // 1. Empresa
    let empresaId = 1;
    const countEmpresas = await sql`SELECT count(*)::int as count FROM empresas`;
    if ((countEmpresas[0]?.count || 0) === 0) {
      console.log("Seeding default empresa...");
      const [emp] = await sql`
        INSERT INTO empresas (nombre, cuit, email, telefono, direccion, ciudad, provincia, setup_completado)
        VALUES ('Logística Alpha S.A.', '30-71234567-9', 'contacto@logisticaalpha.com', '+54 291 455-8899', 'Av. Colón 1250', 'Bahía Blanca', 'Buenos Aires', 1)
        RETURNING id;
      `;
      empresaId = emp.id;
    } else {
      const [firstEmp] = await sql`SELECT id FROM empresas LIMIT 1`;
      empresaId = firstEmp.id;
    }

    // 2. Subscription Plans
    const countPlans = await sql`SELECT count(*)::int as count FROM subscription_plans`;
    if ((countPlans[0]?.count || 0) === 0) {
      console.log("Seeding default subscription plans...");
      await sql`
        INSERT INTO subscription_plans (nombre, min_vehiculos, max_vehiculos, precio_mensual, precio_anual, activo)
        VALUES
          ('Inicial / Starter', 1, 5, 39990, 399900, 1),
          ('Flota Media / Pro', 6, 20, 89990, 899900, 1),
          ('Corporativo / Enterprise', 21, NULL, 189990, 1899900, 1);
      `;
    }

    // 3. Empresa Subscription
    const countSub = await sql`SELECT count(*)::int as count FROM empresa_subscriptions WHERE empresa_id = ${empresaId}`;
    if ((countSub[0]?.count || 0) === 0) {
      const [plan] = await sql`SELECT id FROM subscription_plans WHERE activo = 1 LIMIT 1`;
      if (plan) {
        await sql`
          INSERT INTO empresa_subscriptions (empresa_id, plan_id, estado, fecha_inicio, metodo_pago)
          VALUES (${empresaId}, ${plan.id}, 'activa', NOW(), 'transferencia')
          ON CONFLICT DO NOTHING;
        `;
      }
    }

    // 4. Users
    const countUsers = await sql`SELECT count(*)::int as count FROM users`;
    if ((countUsers[0]?.count || 0) === 0) {
      console.log("Seeding default users...");
      const passwordHash = await bcryptjs.hash("password123", 10);
      await sql`
        INSERT INTO users (id, name, email, role, empresa_id, password_hash, must_change_password)
        VALUES
          (${crypto.randomUUID()}, 'Super Admin', 'superadmin@trackops.com', 'SUPER_ADMIN', NULL, ${passwordHash}, 0),
          (${crypto.randomUUID()}, 'Admin Logística', 'admin@logistica.com', 'ADMIN_EMPRESA', ${empresaId}, ${passwordHash}, 0),
          (${crypto.randomUUID()}, 'Carlos Conductor', 'chofer@logistica.com', 'CHOFER', ${empresaId}, ${passwordHash}, 0)
        ON CONFLICT (email) DO NOTHING;
      `;
    }

    // 5. Document Categories
    const countCategories = await sql`SELECT count(*)::int as count FROM document_categories WHERE empresa_id = ${empresaId}`;
    if ((countCategories[0]?.count || 0) === 0) {
      console.log("Seeding document categories...");
      await sql`
        INSERT INTO document_categories (empresa_id, nombre, color)
        VALUES
          (${empresaId}, 'Seguro', 'blue'),
          (${empresaId}, 'Cédula', 'emerald'),
          (${empresaId}, 'RTO / VTV', 'amber'),
          (${empresaId}, 'Service', 'purple'),
          (${empresaId}, 'Habilitaciones', 'indigo')
        ON CONFLICT DO NOTHING;
      `;
    }

    // 6. Vehicles
    const countVehicles = await sql`SELECT count(*)::int as count FROM vehicles WHERE empresa_id = ${empresaId}`;
    if ((countVehicles[0]?.count || 0) === 0) {
      console.log("Seeding default vehicles...");
      await sql`
        INSERT INTO vehicles (empresa_id, patente, marca, modelo, anio, tipo, chasis, kilometraje_actual, rto)
        VALUES
          (${empresaId}, 'AB 123 CD', 'Ford', 'Ranger', 2021, 'utilitario', '8ALB2FDVXMG123456', 125430, NOW() + INTERVAL '1 year'),
          (${empresaId}, 'EF 456 GH', 'Volkswagen', 'Gol', 2019, 'auto', '8AWZZZ13ZJA123456', 89210, NOW() - INTERVAL '3 months'),
          (${empresaId}, 'IJ 789 KL', 'Renault', 'Kangoo', 2022, 'utilitario', '8A1B5C3VXKJ123456', 45100, NULL),
          (${empresaId}, 'MN 012 OP', 'Mercedes-Benz', 'Atron', 2020, 'camion', '9BM958152MA123456', 312800, NOW() + INTERVAL '6 months'),
          (${empresaId}, 'QR 345 ST', 'Fiat', 'Cronos', 2023, 'auto', '8AD3973H0PU123456', 67900, NOW() + INTERVAL '2 years')
        ON CONFLICT DO NOTHING;
      `;
    }

    // 7. Vehicle Groups
    const countGroups = await sql`SELECT count(*)::int as count FROM vehicle_groups WHERE empresa_id = ${empresaId}`;
    if ((countGroups[0]?.count || 0) === 0) {
      console.log("Seeding vehicle groups...");
      const [g1] = await sql`
        INSERT INTO vehicle_groups (empresa_id, nombre, descripcion, color, icono)
        VALUES (${empresaId}, 'Flota Pesada', 'Camiones de larga distancia y transporte pesado', '#EF4444', 'truck')
        RETURNING id;
      `;
      const [g2] = await sql`
        INSERT INTO vehicle_groups (empresa_id, nombre, descripcion, color, icono)
        VALUES (${empresaId}, 'Reparto Urbano', 'Utilitarios y camionetas para entregas en ciudad', '#3B82F6', 'package')
        RETURNING id;
      `;

      const vehs = await sql`SELECT id, tipo FROM vehicles WHERE empresa_id = ${empresaId}`;
      for (const v of vehs) {
        if (v.tipo === 'camion' && g1) {
          await sql`INSERT INTO vehicle_group_members (group_id, vehicle_id) VALUES (${g1.id}, ${v.id}) ON CONFLICT DO NOTHING;`;
        } else if (g2) {
          await sql`INSERT INTO vehicle_group_members (group_id, vehicle_id) VALUES (${g2.id}, ${v.id}) ON CONFLICT DO NOTHING;`;
        }
      }
    }

    // 8. Geofences
    const countGeofences = await sql`SELECT count(*)::int as count FROM geofences WHERE empresa_id = ${empresaId}`;
    if ((countGeofences[0]?.count || 0) === 0) {
      console.log("Seeding geofences...");
      for (const g of INITIAL_MOCK_GEOFENCES) {
        await sql`
          INSERT INTO geofences (
            empresa_id, nombre, descripcion, tipo, color, opacidad, coordenadas, centro_lat, centro_lng,
            radio, activa, target_type, target_vehicles, target_categories, target_groups, alert_events,
            speed_limit, action_types, email_recipients, created_at, updated_at
          ) VALUES (
            ${empresaId},
            ${g.nombre},
            ${g.descripcion || null},
            ${g.tipo},
            ${g.color},
            ${g.opacidad ?? 0.25},
            ${g.coordenadas ? JSON.stringify(g.coordenadas) : null},
            ${g.centro ? g.centro[0] : null},
            ${g.centro ? g.centro[1] : null},
            ${g.radio || null},
            ${g.activa ? 1 : 0},
            ${g.targetType || "ALL"},
            ${g.targetVehicles ? JSON.stringify(g.targetVehicles) : null},
            ${g.targetCategories ? JSON.stringify(g.targetCategories) : null},
            ${g.targetGroups ? JSON.stringify(g.targetGroups) : null},
            ${g.alertEvents ? JSON.stringify(g.alertEvents) : null},
            ${g.speedLimit || null},
            ${g.actionTypes ? JSON.stringify(g.actionTypes) : null},
            ${g.emailRecipients || null},
            NOW(),
            NOW()
          );
        `;
      }
    }

    // 9. Alert Configs
    const countAlerts = await sql`SELECT count(*)::int as count FROM alert_configs WHERE empresa_id = ${empresaId}`;
    if ((countAlerts[0]?.count || 0) === 0) {
      await sql`
        INSERT INTO alert_configs (empresa_id, canal_email, canal_whatsapp, email_destino, telefono_whatsapp, tolerancia_km, tolerancia_dias, modulos_habilitados, activo)
        VALUES (${empresaId}, 1, 0, 'alertas@logisticaalpha.com', '+542914558899', 500, 15, '["MANTENIMIENTO","DOCUMENTACION","GEOCERCAS","HORARIOS"]', 1)
        ON CONFLICT DO NOTHING;
      `;
    }

    // 10. Sitios
    const countSitios = await sql`SELECT count(*)::int as count FROM sitios WHERE empresa_id = ${empresaId}`;
    if ((countSitios[0]?.count || 0) === 0) {
      console.log("Seeding default Bahía Blanca sites into sitios table...");
      await sql`
        INSERT INTO sitios (empresa_id, nombre, tipo, direccion, ciudad, provincia, lat, lng, radio_metros, contacto_nombre, contacto_telefono, activo)
        VALUES
          (${empresaId}, 'Planta Petroquímica Bahía Blanca', 'PLANTA', 'Ruta Nacional 3 Km 678, Ing. White', 'Bahía Blanca', 'Buenos Aires', -38.7885, -62.2745, 300, 'Ing. Martín Rodríguez', '+5492914551122', 1),
          (${empresaId}, 'Depósito Central Parque Industrial', 'DEPOSITO', 'Parque Industrial Bahía Blanca, Parcela 12', 'Bahía Blanca', 'Buenos Aires', -38.7490, -62.2150, 200, 'Roberto Gómez (Logística)', '+5492914883344', 1),
          (${empresaId}, 'Puerto Galván / Terminal Portuaria', 'PROVEEDOR', 'Acceso Puerto Galván S/N', 'Bahía Blanca', 'Buenos Aires', -38.7870, -62.3020, 400, 'Control Cargas Puerto', '+5492914598800', 1),
          (${empresaId}, 'Centro de Distribución Don Bosco', 'CLIENTE', 'Don Bosco 1450', 'Bahía Blanca', 'Buenos Aires', -38.7180, -62.2650, 150, 'Mariana Costa', '+5492914227788', 1),
          (${empresaId}, 'Sucursal Norte Av. Alem', 'SUCURSAL', 'Av. Alem 2200', 'Bahía Blanca', 'Buenos Aires', -38.6950, -62.2480, 100, 'Carlos Menéndez', '+5492914115566', 1)
        ON CONFLICT DO NOTHING;
      `;
    }

    // 11. Choferes
    const countChoferes = await sql`SELECT count(*)::int as count FROM choferes WHERE empresa_id = ${empresaId}`;
    if ((countChoferes[0]?.count || 0) === 0) {
      console.log("Seeding default choferes...");
      const vehiclesList = await sql`SELECT id FROM vehicles WHERE empresa_id = ${empresaId} LIMIT 3`;
      await sql`
        INSERT INTO choferes (empresa_id, nombre, apellido, dni, telefono, email, licencia_numero, licencia_categoria, licencia_vencimiento, estado, vehiculo_habitual_id, notas)
        VALUES
          (${empresaId}, 'Carlos', 'Gómez', '35111222', '+5492914001122', 'carlos.gomez@logisticaalpha.com', 'B1-35111222', 'B1', NOW() + INTERVAL '2 years', 'ACTIVO', ${vehiclesList[0]?.id || null}, 'Chofer de turno mañana en planta'),
          (${empresaId}, 'Mariana', 'Pérez', '38999000', '+5492914556677', 'mariana.perez@logisticaalpha.com', 'C1-38999000', 'C1', NOW() + INTERVAL '18 months', 'ACTIVO', ${vehiclesList[1]?.id || null}, 'Especialista en larga distancia'),
          (${empresaId}, 'Jorge', 'Álvarez', '32444555', '+5492914889900', 'jorge.alvarez@logisticaalpha.com', 'E1-32444555', 'E1', NOW() + INTERVAL '1 year', 'ACTIVO', ${vehiclesList[2]?.id || null}, 'Cargas pesadas e interprovinciales')
        ON CONFLICT DO NOTHING;
      `;
    }

    // 12. Viajes
    const countViajes = await sql`SELECT count(*)::int as count FROM viajes WHERE empresa_id = ${empresaId}`;
    if ((countViajes[0]?.count || 0) === 0) {
      console.log("Seeding default viajes...");
      const [firstChofer] = await sql`SELECT id FROM choferes WHERE empresa_id = ${empresaId} LIMIT 1`;
      const [firstVehicle] = await sql`SELECT id FROM vehicles WHERE empresa_id = ${empresaId} LIMIT 1`;
      const sitiosList = await sql`SELECT id, nombre, direccion, lat, lng FROM sitios WHERE empresa_id = ${empresaId} LIMIT 2`;

      if (sitiosList.length >= 2) {
        await sql`
          INSERT INTO viajes (
            empresa_id, codigo, chofer_id, vehiculo_id, origen_tipo, origen_sitio_id, origen_nombre, origen_direccion, origen_lat, origen_lng,
            destino_tipo, destino_sitio_id, destino_nombre, destino_direccion, destino_lat, destino_lng, distancia_estimada_km,
            fecha_salida_programada, fecha_inicio_real, km_inicio, estado, notas
          )
          VALUES (
            ${empresaId}, 'VIAJE-101', ${firstChofer?.id || null}, ${firstVehicle?.id || null},
            'SITIO', ${sitiosList[0].id}, ${sitiosList[0].nombre}, ${sitiosList[0].direccion}, ${sitiosList[0].lat}, ${sitiosList[0].lng},
            'SITIO', ${sitiosList[1].id}, ${sitiosList[1].nombre}, ${sitiosList[1].direccion}, ${sitiosList[1].lat}, ${sitiosList[1].lng},
            14.5, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '45 minutes', 124500, 'EN_CURSO', 'Transporte de insumos industriales'
          )
          ON CONFLICT DO NOTHING;
        `;
        await sql`
          INSERT INTO viajes (
            empresa_id, codigo, chofer_id, vehiculo_id, origen_tipo, origen_sitio_id, origen_nombre, origen_direccion, origen_lat, origen_lng,
            destino_tipo, destino_sitio_id, destino_nombre, destino_direccion, destino_lat, destino_lng, distancia_estimada_km,
            fecha_salida_programada, fecha_inicio_real, km_inicio, estado, notas
          )
          VALUES (
            ${empresaId}, 'VIAJE-102', ${firstChofer?.id || null}, ${firstVehicle?.id || null},
            'SITIO', ${sitiosList[1].id}, ${sitiosList[1].nombre}, ${sitiosList[1].direccion}, ${sitiosList[1].lat}, ${sitiosList[1].lng},
            'GOOGLE_PLACES', ${null}, 'Terminal de Ómnibus Bahía Blanca', 'Dr. Sixto Laspiur 1800, Bahía Blanca', -38.7290, -62.2450,
            8.2, NOW() + INTERVAL '3 hours', ${null}, ${null}, 'PLANIFICADO', 'Retiro de encomiendas de repuestos'
          )
          ON CONFLICT DO NOTHING;
        `;
      }
    }

    // 13. Support Tickets
    const countTickets = await sql`SELECT count(*)::int as count FROM tickets_soporte`;
    if ((countTickets[0]?.count || 0) === 0) {
      console.log("Seeding sample tickets...");
      await sql`
        INSERT INTO tickets_soporte (origen, empresa_id, nombre_contacto, email_contacto, telefono_contacto, tipo, prioridad, estado, asunto, mensaje)
        VALUES ('PANEL', ${empresaId}, 'Admin Logística', 'admin@logistica.com', '+54 291 455-8899', 'CONSULTA', 'MEDIA', 'PENDIENTE', 'Consulta sobre reporte mensual de combustible', 'Hola, quisiéramos saber cómo exportar el desglose de rendimiento por vehículo a Excel.')
        ON CONFLICT DO NOTHING;
      `;
      await sql`
        INSERT INTO tickets_soporte (origen, empresa_id, nombre_contacto, email_contacto, telefono_contacto, tipo, prioridad, estado, asunto, mensaje)
        VALUES ('LANDING', ${null}, 'Roberto Fernández', 'rfernandez@transporte.com', '+54 11 4400-1122', 'VENTAS', 'ALTA', 'PENDIENTE', 'Cotización para flota de 30 camiones', 'Buenas tardes, estamos evaluando soluciones de telemetría y geocercas para nuestra flota en Buenos Aires.')
        ON CONFLICT DO NOTHING;
      `;
    }

    // 14. Prospectos (CRM)
    const countProspectos = await sql`SELECT count(*)::int as count FROM prospectos`;
    if ((countProspectos[0]?.count || 0) === 0) {
      console.log("Seeding prospectos...");
      await sql`
        INSERT INTO prospectos (nombre, email, telefono, empresa, flota_estimada, mensaje, estado, notas)
        VALUES ('Martín Palermo', 'mpalermo@transpalermo.com', '+54 9 11 4455-6677', 'Transportes Palermo S.R.L.', 18, 'Nos interesa el módulo de control de combustible y geocercas.', 'nuevo', 'Lead desde landing')
        ON CONFLICT DO NOTHING;
      `;
      await sql`
        INSERT INTO prospectos (nombre, email, telefono, empresa, flota_estimada, mensaje, estado, notas)
        VALUES ('Laura Fernández', 'lfernandez@delsurlog.com.ar', '+54 9 299 512-3456', 'Distribuidora del Sur', 8, 'Controlar vencimientos de RTO y seguros con alertas WhatsApp.', 'contactado', 'Primer contacto telefónico')
        ON CONFLICT DO NOTHING;
      `;
      await sql`
        INSERT INTO prospectos (nombre, email, telefono, empresa, flota_estimada, mensaje, estado, notas)
        VALUES ('Esteban Quito', 'esteban@quitoexpress.com', '+54 9 351 678-9012', 'Quito Logistics & Courier', 35, 'Demo técnica para integración GPS en Córdoba.', 'demo_agendada', 'Demo agendada para el viernes')
        ON CONFLICT DO NOTHING;
      `;
    }

    console.log("✅ All PostgreSQL tables and seed data verified and up-to-date!");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

if (require.main === module || process.argv[1]?.includes("migrate")) {
  runMigrations()
    .then(() => {
      console.log("Migration finished successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration script failed:", err);
      process.exit(1);
    });
}
