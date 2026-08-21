import { z } from "zod";

export const geofenceSchema = z
  .object({
    nombre: z.string({ required_error: "El nombre de la geocerca es obligatorio" }).trim().min(3, "Mínimo 3 caracteres").max(80, "Máximo 80 caracteres"),
    descripcion: z.string().trim().max(500, "Máximo 500 caracteres").nullable().optional(),
    tipo: z.enum(["Polígono", "Círculo"], { errorMap: () => ({ message: "Tipo inválido" }) }).default("Polígono"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido, debe ser #RRGGBB").default("#3b82f6"),
    opacidad: z.coerce.number().min(0).max(1).default(0.25),
    coordenadas: z
      .union([z.string(), z.array(z.array(z.number()))])
      .nullable()
      .optional()
      .transform((v) => {
        if (v == null) return null;
        if (typeof v === "string") return v.trim();
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      })
      .pipe(z.string().trim().nullable().optional()),
    centroLat: z
      .unknown()
      .optional()
      .transform((v) => {
        if (v == null || String(v).trim() === "") return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
      })
      .pipe(z.number().min(-90).max(90).nullable().optional()),
    centroLng: z
      .unknown()
      .optional()
      .transform((v) => {
        if (v == null || String(v).trim() === "") return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
      })
      .pipe(z.number().min(-180).max(180).nullable().optional()),
    radio: z
      .unknown()
      .optional()
      .transform((v) => {
        if (v == null || String(v).trim() === "") return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
      })
      .pipe(z.number().positive("Radio debe ser positivo").max(50000, "Radio máximo 50km").nullable().optional()),
    activa: z.union([z.boolean(), z.number(), z.string()]).optional().transform((v) => (v === true || v === 1 || v === "1" || v === "true" ? 1 : 0)).pipe(z.number().int().min(0).max(1)).default(1),
    targetType: z.union([z.string(), z.null(), z.undefined()]).optional().transform((v) => (v == null ? "ALL" : String(v))).default("ALL"),
    targetVehicles: z.union([z.string(), z.array(z.any()), z.null(), z.undefined()]).optional().transform((v) => (v == null ? null : typeof v === "string" ? v : JSON.stringify(v))),
    targetCategories: z.union([z.string(), z.array(z.any()), z.null(), z.undefined()]).optional().transform((v) => (v == null ? null : typeof v === "string" ? v : JSON.stringify(v))),
    targetGroups: z.union([z.string(), z.array(z.any()), z.null(), z.undefined()]).optional().transform((v) => (v == null ? null : typeof v === "string" ? v : JSON.stringify(v))),
    alertEvents: z.union([z.string(), z.array(z.string()), z.null(), z.undefined()]).optional().transform((v) => (v == null ? null : typeof v === "string" ? v : JSON.stringify(v))),
    speedLimit: z
      .unknown()
      .optional()
      .transform((v) => {
        if (v == null || String(v).trim() === "") return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
      })
      .pipe(z.number().int().positive().nullable().optional()),
    actionTypes: z.union([z.string(), z.array(z.any()), z.null(), z.undefined()]).optional().transform((v) => (v == null ? null : typeof v === "string" ? v : JSON.stringify(v))),
    emailRecipients: z.union([z.string(), z.null(), z.undefined()]).optional().transform((v) => (v == null ? null : String(v))),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "Círculo") {
      if (data.centroLat == null || data.centroLng == null || data.radio == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Para geocerca circular se requiere centro (lat/lng) y radio", path: ["radio"] });
      }
    }
    if (data.tipo === "Polígono") {
      if (!data.coordenadas || data.coordenadas.trim().length < 10) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Para geocerca polígono se requieren coordenadas válidas", path: ["coordenadas"] });
      }
    }
  });

export type GeofenceInput = z.infer<typeof geofenceSchema>;
