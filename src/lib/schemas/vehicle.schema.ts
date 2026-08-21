import { z } from "zod";
import { PATENTE_REGEX, PATENTE_REGEX_DESC } from "@/lib/api-error";

export const patenteSchema = z
  .string({ required_error: "La patente es obligatoria" })
  .trim()
  .min(1, "La patente es obligatoria")
  .transform((v) => v.toUpperCase())
  .refine((v) => PATENTE_REGEX.test(v), { message: PATENTE_REGEX_DESC });

export const vehicleSchema = z.object({
  patente: patenteSchema,
  marca: z.string({ required_error: "La marca es obligatoria" }).trim().min(1, "La marca es obligatoria").max(50, "Máximo 50 caracteres"),
  modelo: z.string({ required_error: "El modelo es obligatorio" }).trim().min(1, "El modelo es obligatorio").max(50, "Máximo 50 caracteres"),
  anio: z.coerce.number().int().min(1950, "Año inválido").max(new Date().getFullYear() + 1, "Año fuera de rango").nullable().optional(),
  tipo: z.enum(["camion", "bus", "utilitario", "auto", "camioneta", "acoplado", "maquinaria", "moto"], { errorMap: () => ({ message: "Tipo de vehículo inválido" }) }).default("utilitario"),
  chasis: z.string().trim().max(30, "Máximo 30 caracteres").nullable().optional(),
  kilometrajeActual: z.coerce.number().int().min(0, "Kilometraje inválido").max(5_000_000, "Kilometraje fuera de rango").default(0),
  rto: z.coerce.date().nullable().optional(),
});

// Para FormData (todos string)
export const vehicleFormSchema = z.object({
  patente: patenteSchema,
  marca: z.string().trim().min(1, "La marca es obligatoria").max(50, "Máximo 50 caracteres"),
  modelo: z.string().trim().min(1, "El modelo es obligatorio").max(50, "Máximo 50 caracteres"),
  anio: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v == null || String(v).trim() === "") return null;
      const n = Number(String(v).trim());
      return isNaN(n) ? String(v) : n;
    })
    .pipe(
      z.union([z.number().int().min(1950).max(new Date().getFullYear() + 1), z.null(), z.string().transform(() => null as unknown as number)])
    )
    .transform((v) => (typeof v === "string" ? null : v) as number | null),
  tipo: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v == null || String(v).trim() === "") return "utilitario";
      const norm = String(v).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const allowed = ["camion", "bus", "utilitario", "auto", "camioneta", "acoplado", "maquinaria", "moto"];
      return allowed.includes(norm) ? norm : "utilitario";
    })
    .pipe(z.enum(["camion", "bus", "utilitario", "auto", "camioneta", "acoplado", "maquinaria", "moto"])),
  chasis: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => (v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, 30))),
  kilometrajeActual: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v == null || String(v).trim() === "") return 0;
      const n = Number(String(v).trim());
      return isNaN(n) ? 0 : Math.trunc(n);
    })
    .pipe(z.number().int().min(0).max(5_000_000)),
  rto: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v == null || String(v).trim() === "") return null;
      const d = new Date(String(v));
      return isNaN(d.getTime()) ? null : d;
    }),
});

export type VehicleFormInput = z.infer<typeof vehicleFormSchema>;
