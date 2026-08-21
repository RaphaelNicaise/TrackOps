CREATE TABLE IF NOT EXISTS "tickets_soporte" (
	"id" serial PRIMARY KEY NOT NULL,
	"origen" varchar(20) DEFAULT 'PANEL' NOT NULL,
	"empresa_id" integer,
	"user_id" text,
	"nombre_contacto" text NOT NULL,
	"email_contacto" text NOT NULL,
	"telefono_contacto" varchar(50),
	"empresa_nombre_manual" text,
	"tipo" varchar(40) NOT NULL,
	"prioridad" varchar(20) DEFAULT 'MEDIA' NOT NULL,
	"estado" varchar(30) DEFAULT 'PENDIENTE' NOT NULL,
	"asunto" text NOT NULL,
	"mensaje" text NOT NULL,
	"preferencia_respuesta" varchar(20) DEFAULT 'EMAIL',
	"notas_internas" text,
	"resuelto_por" text,
	"resuelto_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets_soporte" ADD CONSTRAINT "tickets_soporte_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets_soporte" ADD CONSTRAINT "tickets_soporte_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
