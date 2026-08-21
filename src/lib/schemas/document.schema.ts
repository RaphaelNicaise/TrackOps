import { z } from "zod";
import { MAX_FILE_SIZE, ALLOWED_MIMES, ALLOWED_EXTENSIONS } from "@/lib/api-error";

export const documentMetaSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(100, "Máximo 100 caracteres"),
  fileName: z.string().trim().min(1, "Nombre de archivo requerido").max(255, "Máximo 255 caracteres"),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE, `El archivo supera los ${MAX_FILE_SIZE / (1024 * 1024)} MB`),
  mimeType: z
    .string()
    .min(1)
    .refine((v) => (ALLOWED_MIMES as readonly string[]).includes(v) || v.startsWith("image/"), {
      message: `Tipo de archivo no permitido. Permitidos: ${ALLOWED_EXTENSIONS.join(", ")}`,
    }),
  categoryId: z.number().int().positive().nullable().optional(),
  fechaVencimiento: z
    .date()
    .nullable()
    .optional()
    .refine((v) => v === null || v === undefined || v instanceof Date, { message: "Fecha inválida" }),
  notas: z.string().trim().max(500, "Máximo 500 caracteres").nullable().optional(),
});

export const uploadDocumentSchema = z.object({
  title: z.string().trim().max(100, "Máximo 100 caracteres").nullable().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  fechaVencimiento: z.coerce.date().nullable().optional(),
  notas: z.string().trim().max(500, "Máximo 500 caracteres").nullable().optional(),
});

export type DocumentMetaInput = z.infer<typeof documentMetaSchema>;
