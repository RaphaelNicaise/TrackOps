ALTER TABLE "subscription_plans" ALTER COLUMN "max_vehiculos" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "telefono" varchar(50);--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "direccion" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "ciudad" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "provincia" text;--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "setup_completado" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "min_vehiculos" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" integer DEFAULT 0 NOT NULL;