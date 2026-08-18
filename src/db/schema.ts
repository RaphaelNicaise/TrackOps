import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  serial,
  varchar,
  doublePrecision,
  customType,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

export const geometryPoint = customType<{ data: { lat: number; lng: number } }>({
  dataType() {
    return "geometry(Point, 4326)";
  },
  toDriver(value) {
    return `ST_SetSRID(ST_MakePoint(${value.lng}, ${value.lat}), 4326)`;
  },
  fromDriver(value: unknown) {
    if (typeof value === "string") {
      return { lat: 0, lng: 0 };
    }
    return { lat: 0, lng: 0 };
  },
});

export const empresas = pgTable("empresas", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  cuit: varchar("cuit", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: varchar("role", { length: 30 }).default("CHOFER").notNull(), // SUPER_ADMIN, ADMIN_EMPRESA, CHOFER, VENDEDOR_INSTALADOR
  empresaId: integer("empresa_id").references(() => empresas.id),
})

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  patente: varchar("patente", { length: 20 }).notNull().unique(),
  modelo: text("modelo").notNull(),
  marca: text("marca").notNull(),
  anio: integer("anio"),
  tipo: varchar("tipo", { length: 30 }).default("camion"), // camion, bus, utilitario, auto
  chasis: varchar("chasis", { length: 30 }),
  kilometrajeActual: integer("kilometraje_actual").default(0).notNull(),
  rto: timestamp("rto"),
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

export const fuelTickets = pgTable("fuel_tickets", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  fecha: timestamp("fecha").notNull(),
  litros: doublePrecision("litros").notNull(),
  costoTotal: doublePrecision("costo_total").notNull(),
  kilometraje: integer("kilometraje").notNull(),
  ticketUrl: text("ticket_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  tipoDocumento: varchar("tipo_documento", { length: 50 }).notNull(), // vtv, seguro, ruta
  fechaVencimiento: timestamp("fecha_vencimiento").notNull(),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const shiftLogs = pgTable("shift_logs", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  startKm: integer("start_km").notNull(),
  endKm: integer("end_km"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const maintenancePlans = pgTable("maintenance_plans", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  componente: varchar("componente", { length: 100 }).notNull(), // ej. "Aceite y Filtros", "Pastillas de Freno"
  intervaloKm: integer("intervalo_km").notNull(), // ej. 10000
  ultimoServiceKm: integer("ultimo_service_km").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════
// Nuevas tablas — Reestructuración MVP
// ═══════════════════════════════════════════════════════════

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  userName: text("user_name"),
  action: varchar("action", { length: 20 }).notNull(), // CREATE, UPDATE, DELETE
  entityType: varchar("entity_type", { length: 50 }).notNull(), // vehicle, fuelTicket, maintenanceLog, etc.
  entityId: text("entity_id"),
  details: text("details"), // JSON string with change details
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  maxVehiculos: integer("max_vehiculos").notNull(),
  precioMensual: doublePrecision("precio_mensual").notNull(),
  precioAnual: doublePrecision("precio_anual"),
  activo: integer("activo").default(1).notNull(), // 1 = activo, 0 = inactivo
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const empresaSubscriptions = pgTable("empresa_subscriptions", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  estado: varchar("estado", { length: 20 }).default("activa").notNull(), // activa, suspendida, cancelada
  fechaInicio: timestamp("fecha_inicio").defaultNow().notNull(),
  fechaFin: timestamp("fecha_fin"),
  metodoPago: varchar("metodo_pago", { length: 30 }), // mercadopago, transferencia, efectivo
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alertConfigs = pgTable("alert_configs", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  canalEmail: integer("canal_email").default(1).notNull(), // 1 = activo
  canalWhatsapp: integer("canal_whatsapp").default(0).notNull(),
  emailDestino: text("email_destino"),
  telefonoWhatsapp: varchar("telefono_whatsapp", { length: 20 }),
  toleranciaKm: integer("tolerancia_km").default(500),
  toleranciaDias: integer("tolerancia_dias").default(15),
  activo: integer("activo").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gpsInstallations = pgTable("gps_installations", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  instaladorId: text("instalador_id").references(() => users.id),
  dispositivoModelo: text("dispositivo_modelo"),
  dispositivoSerial: varchar("dispositivo_serial", { length: 50 }),
  estado: varchar("estado", { length: 20 }).default("pendiente").notNull(), // pendiente, instalado, con_falla
  fechaInstalacion: timestamp("fecha_instalacion"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentCategories = pgTable("document_categories", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  nombre: text("nombre").notNull(),
  color: varchar("color", { length: 30 }).default("blue").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicleDocuments = pgTable("vehicle_documents", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  categoryId: integer("category_id").references(() => documentCategories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  fileKey: text("file_key").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fechaVencimiento: timestamp("fecha_vencimiento"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresa_id").references(() => empresas.id).notNull(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  tipo: varchar("tipo", { length: 20 }).default("Polígono").notNull(),
  color: varchar("color", { length: 30 }).default("#3b82f6").notNull(),
  opacidad: doublePrecision("opacidad").default(0.25).notNull(),
  coordenadas: text("coordenadas"),
  centroLat: doublePrecision("centro_lat"),
  centroLng: doublePrecision("centro_lng"),
  radio: doublePrecision("radio"),
  activa: integer("activa").default(1).notNull(),
  targetType: varchar("target_type", { length: 30 }).default("ALL").notNull(),
  targetVehicles: text("target_vehicles"),
  targetCategories: text("target_categories"),
  targetGroups: text("target_groups"),
  alertEvents: text("alert_events"),
  speedLimit: integer("speed_limit"),
  actionTypes: text("action_types"),
  emailRecipients: text("email_recipients"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const prospectos = pgTable("prospectos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  telefono: varchar("telefono", { length: 50 }),
  empresa: text("empresa"),
  flotaEstimada: integer("flota_estimada"),
  mensaje: text("mensaje"),
  estado: varchar("estado", { length: 30 }).default("nuevo").notNull(), // nuevo, contactado, demo_agendada, convertido, descartado
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

