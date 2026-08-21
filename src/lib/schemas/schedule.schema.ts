import { z } from "zod";

export const scheduleSchema = z.object({
  nombre: z.string({ required_error: "El nombre del horario es obligatorio" }).trim().min(3, "Mínimo 3 caracteres").max(80, "Máximo 80 caracteres"),
  descripcion: z.string().trim().max(500, "Máximo 500 caracteres").nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido").default("#F2B705"),
  activo: z.coerce.number().int().min(0).max(1).default(1),
  diasConfig: z.string({ required_error: "La configuración de días es obligatoria" }).trim().min(2, "Configuración de días inválida").refine(
    (v) => {
      try {
        const p = JSON.parse(v);
        return typeof p === "object" && p !== null;
      } catch {
        return false;
      }
    },
    { message: "diasConfig debe ser un JSON válido" }
  ),
  toleranciaMinutos: z.coerce.number().int().min(0, "Mínimo 0 minutos").max(1440, "Máximo 1440 minutos").default(5),
  targetType: z.string().default("ALL"),
  targetVehicles: z.string().nullable().optional(),
  targetCategories: z.string().nullable().optional(),
  targetGroups: z.string().nullable().optional(),
  alertChannels: z.string().default('["UI"]'),
  emailRecipients: z.string().nullable().optional(),
  whatsappRecipients: z.string().nullable().optional(),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;
