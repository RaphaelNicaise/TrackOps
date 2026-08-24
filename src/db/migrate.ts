import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/trackops_db";

export async function runMigrations() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    console.log("Ensuring all tables and extensions exist in PostgreSQL...");

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
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS telefono varchar(50);`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS direccion text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ciudad text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS provincia text;`;
    await sql`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS setup_completado integer DEFAULT 0 NOT NULL;`;

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

    // 3. NextAuth accounts & sessions
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
        chasis varchar(50),
        motor varchar(50),
        kilometraje_actual integer DEFAULT 0 NOT NULL,
        rto timestamp,
        vencimiento_rto timestamp,
        nro_poliza_seguro varchar(50),
        companias_seguro varchar(100),
        vencimiento_seguro timestamp,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chasis varchar(50);`;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS motor varchar(50);`;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rto timestamp;`;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vencimiento_rto timestamp;`;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS nro_poliza_seguro varchar(50);`;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS companias_seguro varchar(100);`;
    await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vencimiento_seguro timestamp;`;
    
    // Convert global patente uniqueness to tenant-scoped uniqueness
    try {
      await sql`ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_patente_unique;`;
      await sql`ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_patente_key;`;
    } catch {
      // Ignored if constraint does not exist
    }
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS vehicles_empresa_patente_idx ON vehicles (empresa_id, patente);`;
    await sql`CREATE INDEX IF NOT EXISTS vehicles_empresa_idx ON vehicles (empresa_id);`;

    // 5. maintenance_logs & maintenance_plans
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id),
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
    await sql`
      UPDATE maintenance_logs 
      SET empresa_id = vehicles.empresa_id 
      FROM vehicles 
      WHERE maintenance_logs.vehicle_id = vehicles.id AND maintenance_logs.empresa_id IS NULL;
    `;
    await sql`CREATE INDEX IF NOT EXISTS maintenance_logs_empresa_idx ON maintenance_logs (empresa_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_plans (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        vehicle_id integer REFERENCES vehicles(id),
        nombre text NOT NULL,
        intervalo_km integer,
        intervalo_meses integer,
        ultimo_km integer,
        ultima_fecha timestamp,
        activo integer DEFAULT 1 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`
      UPDATE maintenance_plans 
      SET empresa_id = vehicles.empresa_id 
      FROM vehicles 
      WHERE maintenance_plans.vehicle_id = vehicles.id AND maintenance_plans.empresa_id IS NULL;
    `;
    await sql`CREATE INDEX IF NOT EXISTS maintenance_plans_empresa_idx ON maintenance_plans (empresa_id);`;

    // 6. gps_logs & fuel_tickets & shift_logs & documents
    await sql`
      CREATE TABLE IF NOT EXISTS gps_logs (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id),
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        lat double precision NOT NULL,
        lng double precision NOT NULL,
        speed double precision DEFAULT 0 NOT NULL,
        heading double precision DEFAULT 0 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE gps_logs ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`
      UPDATE gps_logs 
      SET empresa_id = vehicles.empresa_id 
      FROM vehicles 
      WHERE gps_logs.vehicle_id = vehicles.id AND gps_logs.empresa_id IS NULL;
    `;
    await sql`CREATE INDEX IF NOT EXISTS gps_logs_empresa_idx ON gps_logs (empresa_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS fuel_tickets (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id),
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        fecha timestamp NOT NULL,
        litros double precision NOT NULL,
        costo_total double precision NOT NULL,
        kilometraje integer NOT NULL,
        estacion text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE fuel_tickets ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`
      UPDATE fuel_tickets 
      SET empresa_id = vehicles.empresa_id 
      FROM vehicles 
      WHERE fuel_tickets.vehicle_id = vehicles.id AND fuel_tickets.empresa_id IS NULL;
    `;
    await sql`CREATE INDEX IF NOT EXISTS fuel_tickets_empresa_idx ON fuel_tickets (empresa_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        vehicle_id integer REFERENCES vehicles(id),
        tipo varchar(30) NOT NULL,
        vencimiento timestamp NOT NULL,
        file_url text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`
      UPDATE documents 
      SET empresa_id = vehicles.empresa_id 
      FROM vehicles 
      WHERE documents.vehicle_id = vehicles.id AND documents.empresa_id IS NULL;
    `;
    await sql`CREATE INDEX IF NOT EXISTS documents_empresa_idx ON documents (empresa_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS shift_logs (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id),
        vehicle_id integer REFERENCES vehicles(id) NOT NULL,
        driver_id text REFERENCES users(id) NOT NULL,
        inicio timestamp NOT NULL,
        fin timestamp,
        km_inicial integer NOT NULL,
        km_final integer,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE shift_logs ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`
      UPDATE shift_logs 
      SET empresa_id = vehicles.empresa_id 
      FROM vehicles 
      WHERE shift_logs.vehicle_id = vehicles.id AND shift_logs.empresa_id IS NULL;
    `;
    await sql`CREATE INDEX IF NOT EXISTS shift_logs_empresa_idx ON shift_logs (empresa_id);`;

    // 7. audit_logs, subscription_plans, empresa_subscriptions
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id serial PRIMARY KEY,
        empresa_id integer REFERENCES empresas(id) NOT NULL,
        user_id text REFERENCES users(id),
        accion text NOT NULL,
        detalle text,
        created_at timestamp DEFAULT now() NOT NULL
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

    // 8. alert_configs & alert_logs
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

    await sql`
      CREATE TABLE IF NOT EXISTS alert_logs (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        modulo varchar(30) NOT NULL,
        severidad varchar(20) DEFAULT 'INFO' NOT NULL,
        vehiculo_id integer REFERENCES vehicles(id) ON DELETE SET NULL,
        titulo text NOT NULL,
        mensaje text NOT NULL,
        metadata text,
        canales_enviados text NOT NULL,
        destinatarios text NOT NULL,
        estado_despacho varchar(20) DEFAULT 'ENVIADO' NOT NULL,
        error_detalle text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    // 9. gps_installations & document_categories & vehicle_documents
    await sql`
      CREATE TABLE IF NOT EXISTS gps_installations (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        vehicle_id integer REFERENCES vehicles(id) ON DELETE SET NULL,
        instalador_id text REFERENCES users(id) ON DELETE SET NULL,
        fecha timestamp DEFAULT now() NOT NULL,
        notas text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`ALTER TABLE gps_installations ADD COLUMN IF NOT EXISTS empresa_id integer REFERENCES empresas(id);`;
    await sql`
      UPDATE gps_installations 
      SET empresa_id = vehicles.empresa_id 
      FROM vehicles 
      WHERE gps_installations.vehicle_id = vehicles.id AND gps_installations.empresa_id IS NULL;
    `;
    await sql`CREATE INDEX IF NOT EXISTS gps_installations_empresa_idx ON gps_installations (empresa_id);`;
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

    // 10. geofences
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

    // 11. prospectos
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

    // 12. vehicle_groups & vehicle_group_members
    await sql`
      CREATE TABLE IF NOT EXISTS vehicle_groups (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        nombre varchar(100) NOT NULL,
        descripcion text,
        color varchar(30) DEFAULT '#3b82f6' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS vehicle_group_members (
        group_id integer NOT NULL REFERENCES vehicle_groups(id) ON DELETE CASCADE,
        vehicle_id integer NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        PRIMARY KEY (group_id, vehicle_id)
      );
    `;

    // 13. schedules & schedule_violations
    await sql`
      CREATE TABLE IF NOT EXISTS schedules (
        id serial PRIMARY KEY,
        empresa_id integer NOT NULL REFERENCES empresas(id),
        nombre varchar(100) NOT NULL,
        target_type varchar(30) DEFAULT 'ALL' NOT NULL,
        target_vehicles text,
        target_categories text,
        target_groups text,
        days_of_week text NOT NULL,
        start_time varchar(5) NOT NULL,
        end_time varchar(5) NOT NULL,
        active integer DEFAULT 1 NOT NULL,
        alert_on_start_outside integer DEFAULT 1 NOT NULL,
        alert_on_stop_outside integer DEFAULT 1 NOT NULL,
        alert_on_movement_outside integer DEFAULT 1 NOT NULL,
        email_recipients text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS schedule_violations (
        id serial PRIMARY KEY,
        schedule_id integer NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
        vehicle_id integer NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        timestamp timestamp DEFAULT now() NOT NULL,
        violation_type varchar(50) NOT NULL,
        lat double precision NOT NULL,
        lng double precision NOT NULL,
        speed double precision,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    // 14. tickets_soporte
    await sql`
      CREATE TABLE IF NOT EXISTS tickets_soporte (
        id serial PRIMARY KEY,
        numero_ticket varchar(30) NOT NULL UNIQUE,
        empresa_id integer REFERENCES empresas(id) ON DELETE SET NULL,
        user_id text REFERENCES users(id) ON DELETE SET NULL,
        nombre_contacto varchar(100) NOT NULL,
        email_contacto text NOT NULL,
        telefono_contacto varchar(50),
        asunto varchar(200) NOT NULL,
        descripcion text NOT NULL,
        categoria varchar(50) DEFAULT 'OTRO' NOT NULL,
        prioridad varchar(20) DEFAULT 'MEDIA' NOT NULL,
        estado varchar(30) DEFAULT 'ABIERTO' NOT NULL,
        canal_origen varchar(30) DEFAULT 'PANEL_EMPRESA' NOT NULL,
        resolucion_notas text,
        asignado_a_user_id text REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    // 15. choferes
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

    // 16. sitios
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

    // 17. viajes
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

    // Seed default Bahía Blanca sites if sitios table is empty
    const countSitios = await sql`SELECT count(*)::int as count FROM sitios`;
    if ((countSitios[0]?.count || 0) === 0) {
      console.log("Seeding default Bahía Blanca sites into sitios table...");
      const empresasList = await sql`SELECT id FROM empresas LIMIT 1`;
      const empresaId = empresasList[0]?.id || 1;

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
      console.log("✓ Default Bahía Blanca sites seeded successfully.");
    }

    // Seed default choferes if table is empty
    const countChoferes = await sql`SELECT count(*)::int as count FROM choferes`;
    if ((countChoferes[0]?.count || 0) === 0) {
      console.log("Seeding default choferes into choferes table...");
      const empresasList = await sql`SELECT id FROM empresas LIMIT 1`;
      const empresaId = empresasList[0]?.id || 1;
      const vehiclesList = await sql`SELECT id FROM vehicles LIMIT 3`;

      await sql`
        INSERT INTO choferes (empresa_id, nombre, apellido, dni, telefono, email, licencia_numero, licencia_categoria, licencia_vencimiento, estado, vehiculo_habitual_id, notas)
        VALUES
          (${empresaId}, 'Carlos', 'Gómez', '35111222', '+5492914001122', 'carlos.gomez@flota.local', 'B1-35111222', 'B1', NOW() + INTERVAL '2 years', 'ACTIVO', ${vehiclesList[0]?.id || null}, 'Chofer de turno mañana en planta'),
          (${empresaId}, 'Mariana', 'Pérez', '38999000', '+5492914556677', 'mariana.perez@flota.local', 'C1-38999000', 'C1', NOW() + INTERVAL '18 months', 'ACTIVO', ${vehiclesList[1]?.id || null}, 'Especialista en larga distancia'),
          (${empresaId}, 'Jorge', 'Álvarez', '32444555', '+5492914889900', 'jorge.alvarez@flota.local', 'E1-32444555', 'E1', NOW() + INTERVAL '1 year', 'ACTIVO', ${vehiclesList[2]?.id || null}, 'Cargas pesadas e interprovinciales')
        ON CONFLICT DO NOTHING;
      `;
      console.log("✓ Default choferes seeded successfully.");
    }

    // Seed default viajes if table is empty
    const countViajes = await sql`SELECT count(*)::int as count FROM viajes`;
    if ((countViajes[0]?.count || 0) === 0) {
      console.log("Seeding default viajes into viajes table...");
      const empresasList = await sql`SELECT id FROM empresas LIMIT 1`;
      const empresaId = empresasList[0]?.id || 1;
      const firstChofer = await sql`SELECT id FROM choferes LIMIT 1`;
      const firstVehicle = await sql`SELECT id FROM vehicles LIMIT 1`;
      const sitiosList = await sql`SELECT id, nombre, direccion, lat, lng FROM sitios LIMIT 2`;

      if (sitiosList.length >= 2) {
        await sql`
          INSERT INTO viajes (
            empresa_id, codigo, chofer_id, vehiculo_id, origen_tipo, origen_sitio_id, origen_nombre, origen_direccion, origen_lat, origen_lng,
            destino_tipo, destino_sitio_id, destino_nombre, destino_direccion, destino_lat, destino_lng, distancia_estimada_km,
            fecha_salida_programada, fecha_inicio_real, km_inicio, estado, notas
          )
          VALUES
            (
              ${empresaId}, 'VIAJE-101', ${firstChofer[0]?.id || null}, ${firstVehicle[0]?.id || null},
              'SITIO', ${sitiosList[0].id}, ${sitiosList[0].nombre}, ${sitiosList[0].direccion}, ${sitiosList[0].lat}, ${sitiosList[0].lng},
              'SITIO', ${sitiosList[1].id}, ${sitiosList[1].nombre}, ${sitiosList[1].direccion}, ${sitiosList[1].lat}, ${sitiosList[1].lng},
              14.5, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '45 minutes', 124500, 'EN_CURSO', 'Transporte de insumos industriales'
            ),
            (
              ${empresaId}, 'VIAJE-102', ${firstChofer[0]?.id || null}, ${firstVehicle[0]?.id || null},
              'SITIO', ${sitiosList[1].id}, ${sitiosList[1].nombre}, ${sitiosList[1].direccion}, ${sitiosList[1].lat}, ${sitiosList[1].lng},
              'GOOGLE_PLACES', null, 'Terminal de Ómnibus Bahía Blanca', 'Dr. Sixto Laspiur 1800, Bahía Blanca', -38.7290, -62.2450,
              8.2, NOW() + INTERVAL '3 hours', null, null, 'PLANIFICADO', 'Retiro de encomiendas de repuestos'
            )
          ON CONFLICT DO NOTHING;
        `;
        console.log("✓ Default viajes seeded successfully.");
      }
    }

    console.log("✓ All PostgreSQL tables and columns verified and up-to-date!");
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
