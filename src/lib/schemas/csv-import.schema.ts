import { z } from "zod";
import { PATENTE_REGEX, PATENTE_REGEX_DESC } from "@/lib/api-error";

export const csvRowSchema = z.object({
  patente: z
    .string({ required_error: "Patente requerida" })
    .trim()
    .min(1, "Patente requerida")
    .transform((v) => v.toUpperCase())
    .refine((v) => PATENTE_REGEX.test(v), { message: PATENTE_REGEX_DESC }),
  marca: z.string({ required_error: "Marca requerida" }).trim().min(1, "Marca requerida").max(50, "Máximo 50 caracteres"),
  modelo: z.string({ required_error: "Modelo requerido" }).trim().min(1, "Modelo requerido").max(50, "Máximo 50 caracteres"),
  anio: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (v == null || String(v).trim() === "") return null;
      const n = Number(String(v).trim());
      return isNaN(n) ? v : n;
    })
    .refine((v) => v === null || (typeof v === "number" && Number.isInteger(v) && v >= 1950 && v <= new Date().getFullYear() + 1), { message: "Año inválido (1950 - próximo año)" }),
  tipo: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v == null || String(v).trim() === "" ? "utilitario" : String(v).trim().toLowerCase()))
    .pipe(z.enum(["camion", "bus", "utilitario", "auto", "camioneta", "acoplado", "maquinaria", "moto"]).or(z.literal("utilitario"))),
  kilometrajeActual: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (v == null || String(v).trim() === "") return 0;
      const n = Number(String(v).trim());
      return isNaN(n) ? v : n;
    })
    .refine((v) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 5_000_000, { message: "Kilometraje inválido" }),
});

export type CsvRowInput = z.infer<typeof csvRowSchema>;
