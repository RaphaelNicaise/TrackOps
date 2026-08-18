import postgres from "postgres";
import { INITIAL_MOCK_GEOFENCES } from "../lib/mock-geofences";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/trackops_db";

export async function ensureGeofencesTable() {
  const sql = postgres(connectionString);
  try {
    console.log("Checking geofences table...");
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
    console.log("✓ Geofences table verified/created.");

    // Check if table is empty
    const countResult = await sql`SELECT count(*)::int as count FROM geofences`;
    const count = countResult[0]?.count || 0;
    console.log(`Current geofences count: ${count}`);

    if (count === 0) {
      console.log("Seeding initial mock geofences into PostgreSQL...");
      // Get first empresa id
      const empresas = await sql`SELECT id FROM empresas LIMIT 1`;
      const empresaId = empresas[0]?.id || 1;

      for (const g of INITIAL_MOCK_GEOFENCES) {
        await sql`
          INSERT INTO geofences (
            empresa_id,
            nombre,
            descripcion,
            tipo,
            color,
            opacidad,
            coordenadas,
            centro_lat,
            centro_lng,
            radio,
            activa,
            target_type,
            target_vehicles,
            target_categories,
            target_groups,
            alert_events,
            speed_limit,
            action_types,
            email_recipients,
            created_at,
            updated_at
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
          )
        `;
      }
      console.log("✓ Initial geofences seeded successfully into database.");
    }
  } catch (error) {
    console.error("Error ensuring geofences table:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

if (require.main === module || process.argv[1]?.includes("migrate-geofences")) {
  ensureGeofencesTable()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
