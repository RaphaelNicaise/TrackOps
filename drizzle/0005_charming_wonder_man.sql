CREATE TABLE IF NOT EXISTS "alert_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"modulo" varchar(50) NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"severidad" varchar(20) DEFAULT 'MEDIA' NOT NULL,
	"titulo" text NOT NULL,
	"mensaje" text NOT NULL,
	"canal" varchar(30) NOT NULL,
	"destinatario_email" text,
	"destinatario_whatsapp" varchar(50),
	"vehiculo_id" integer,
	"patente" varchar(20),
	"metadata" text,
	"estado" varchar(30) DEFAULT 'MOCK_DISPATCHED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"schedule_id" integer,
	"vehicle_id" integer NOT NULL,
	"patente" varchar(20) NOT NULL,
	"fecha_inicio" timestamp NOT NULL,
	"fecha_fin" timestamp,
	"duracion_minutos" integer DEFAULT 0 NOT NULL,
	"velocidad_maxima" double precision DEFAULT 0 NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"notificado_email" integer DEFAULT 0 NOT NULL,
	"notificado_whatsapp" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"color" varchar(30) DEFAULT '#F2B705' NOT NULL,
	"activo" integer DEFAULT 1 NOT NULL,
	"dias_config" text NOT NULL,
	"tolerancia_minutos" integer DEFAULT 5 NOT NULL,
	"target_type" varchar(30) DEFAULT 'ALL' NOT NULL,
	"target_vehicles" text,
	"target_categories" text,
	"target_groups" text,
	"alert_channels" text DEFAULT '["UI"]' NOT NULL,
	"email_recipients" text,
	"whatsapp_recipients" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"color" varchar(30) DEFAULT '#3b82f6' NOT NULL,
	"icono" varchar(50) DEFAULT 'truck' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_configs" ADD COLUMN "modulos_habilitados" text DEFAULT '["MANTENIMIENTO","DOCUMENTACION","GEOCERCAS","HORARIOS"]' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_logs" ADD CONSTRAINT "alert_logs_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_logs" ADD CONSTRAINT "alert_logs_vehiculo_id_vehicles_id_fk" FOREIGN KEY ("vehiculo_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_violations" ADD CONSTRAINT "schedule_violations_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_violations" ADD CONSTRAINT "schedule_violations_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_violations" ADD CONSTRAINT "schedule_violations_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_group_members" ADD CONSTRAINT "vehicle_group_members_group_id_vehicle_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."vehicle_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_group_members" ADD CONSTRAINT "vehicle_group_members_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_groups" ADD CONSTRAINT "vehicle_groups_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
