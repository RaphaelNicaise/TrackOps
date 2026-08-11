CREATE TABLE IF NOT EXISTS "alert_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"canal_email" integer DEFAULT 1 NOT NULL,
	"canal_whatsapp" integer DEFAULT 0 NOT NULL,
	"email_destino" text,
	"telefono_whatsapp" varchar(20),
	"tolerancia_km" integer DEFAULT 500,
	"tolerancia_dias" integer DEFAULT 15,
	"activo" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"user_name" text,
	"action" varchar(20) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" text,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "empresa_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"empresa_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"estado" varchar(20) DEFAULT 'activa' NOT NULL,
	"fecha_inicio" timestamp DEFAULT now() NOT NULL,
	"fecha_fin" timestamp,
	"metodo_pago" varchar(30),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gps_installations" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"instalador_id" text,
	"dispositivo_modelo" text,
	"dispositivo_serial" varchar(50),
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_instalacion" timestamp,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"max_vehiculos" integer NOT NULL,
	"precio_mensual" double precision NOT NULL,
	"precio_anual" double precision,
	"activo" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "chasis" varchar(30);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "empresa_subscriptions" ADD CONSTRAINT "empresa_subscriptions_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "empresa_subscriptions" ADD CONSTRAINT "empresa_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gps_installations" ADD CONSTRAINT "gps_installations_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gps_installations" ADD CONSTRAINT "gps_installations_instalador_id_users_id_fk" FOREIGN KEY ("instalador_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
