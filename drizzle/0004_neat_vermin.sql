CREATE TABLE IF NOT EXISTS "document_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"color" varchar(30) DEFAULT 'blue' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geofences" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"tipo" varchar(20) DEFAULT 'Polígono' NOT NULL,
	"color" varchar(30) DEFAULT '#3b82f6' NOT NULL,
	"opacidad" double precision DEFAULT 0.25 NOT NULL,
	"coordenadas" text,
	"centro_lat" double precision,
	"centro_lng" double precision,
	"radio" double precision,
	"activa" integer DEFAULT 1 NOT NULL,
	"target_type" varchar(30) DEFAULT 'ALL' NOT NULL,
	"target_vehicles" text,
	"target_categories" text,
	"target_groups" text,
	"alert_events" text,
	"speed_limit" integer,
	"action_types" text,
	"email_recipients" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prospectos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"telefono" varchar(50),
	"empresa" text,
	"flota_estimada" integer,
	"mensaje" text,
	"estado" varchar(30) DEFAULT 'nuevo' NOT NULL,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"empresa_id" integer NOT NULL,
	"category_id" integer,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"file_key" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"fecha_vencimiento" timestamp,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "geofences" ADD CONSTRAINT "geofences_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_category_id_document_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."document_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
