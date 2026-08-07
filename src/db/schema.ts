import { pgTable, serial, text, integer, timestamp, varchar, doublePrecision, customType } from "drizzle-orm/pg-core";

// Custom type for PostGIS Geometry (Point)
export const geometryPoint = customType<{ data: { lat: number; lng: number } }>({
  dataType() {
    return "geometry(Point, 4326)";
  },
  toDriver(value) {
    return `ST_SetSRID(ST_MakePoint(${value.lng}, ${value.lat}), 4326)`;
  },
  fromDriver(value: unknown) {
    // Basic representation
    if (typeof value === "string") {
      return { lat: 0, lng: 0 };
    }
    return { lat: 0, lng: 0 };
  },
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: varchar("role", { length: 20 }).default("chofer").notNull(), // admin, chofer, mecanico
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  patente: varchar("patente", { length: 20 }).notNull().unique(),
  modelo: text("modelo").notNull(),
  marca: text("marca").notNull(),
  anio: integer("anio"),
  tipo: varchar("tipo", { length: 30 }).default("camion"), // camion, bus, utilitario
  kilometrajeActual: integer("kilometraje_actual").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const maintenanceLogs = pgTable("maintenance_logs", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  fecha: timestamp("fecha").notNull(),
  kilometraje: integer("kilometraje").notNull(),
  costo: doublePrecision("costo").default(0),
  taller: text("taller"),
  descripcion: text("descripcion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gpsLogs = pgTable("gps_logs", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  speed: doublePrecision("speed").default(0),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
