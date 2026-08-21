CREATE TABLE IF NOT EXISTS "choferes" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"user_id" text,
	"nombre" text NOT NULL,
	"apellido" text NOT NULL,
	"dni" varchar(20) NOT NULL,
	"telefono" varchar(50),
	"email" text,
	"licencia_numero" varchar(50),
	"licencia_categoria" varchar(20),
	"licencia_vencimiento" timestamp,
	"estado" varchar(30) DEFAULT 'ACTIVO' NOT NULL,
	"vehiculo_habitual_id" integer,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sitios" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"tipo" varchar(40) DEFAULT 'DEPOSITO' NOT NULL,
	"direccion" text NOT NULL,
	"ciudad" text,
	"provincia" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"radio_metros" integer DEFAULT 100 NOT NULL,
	"contacto_nombre" text,
	"contacto_telefono" varchar(50),
	"activo" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "viajes" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"chofer_id" integer,
	"vehiculo_id" integer,
	"origen_tipo" varchar(20) DEFAULT 'SITIO' NOT NULL,
	"origen_sitio_id" integer,
	"origen_nombre" text NOT NULL,
	"origen_direccion" text NOT NULL,
	"origen_lat" double precision NOT NULL,
	"origen_lng" double precision NOT NULL,
	"destino_tipo" varchar(20) DEFAULT 'SITIO' NOT NULL,
	"destino_sitio_id" integer,
	"destino_nombre" text NOT NULL,
	"destino_direccion" text NOT NULL,
	"destino_lat" double precision NOT NULL,
	"destino_lng" double precision NOT NULL,
	"distancia_estimada_km" double precision,
	"fecha_salida_programada" timestamp NOT NULL,
	"fecha_llegada_estimada" timestamp,
	"fecha_inicio_real" timestamp,
	"fecha_fin_real" timestamp,
	"km_inicio" integer,
	"km_fin" integer,
	"estado" varchar(30) DEFAULT 'PLANIFICADO' NOT NULL,
	"notas" text,
	"creado_por" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dni" varchar(20);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "choferes" ADD CONSTRAINT "choferes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "choferes" ADD CONSTRAINT "choferes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "choferes" ADD CONSTRAINT "choferes_vehiculo_habitual_id_vehicles_id_fk" FOREIGN KEY ("vehiculo_habitual_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sitios" ADD CONSTRAINT "sitios_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viajes" ADD CONSTRAINT "viajes_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viajes" ADD CONSTRAINT "viajes_chofer_id_choferes_id_fk" FOREIGN KEY ("chofer_id") REFERENCES "public"."choferes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viajes" ADD CONSTRAINT "viajes_vehiculo_id_vehicles_id_fk" FOREIGN KEY ("vehiculo_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viajes" ADD CONSTRAINT "viajes_origen_sitio_id_sitios_id_fk" FOREIGN KEY ("origen_sitio_id") REFERENCES "public"."sitios"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viajes" ADD CONSTRAINT "viajes_destino_sitio_id_sitios_id_fk" FOREIGN KEY ("destino_sitio_id") REFERENCES "public"."sitios"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
