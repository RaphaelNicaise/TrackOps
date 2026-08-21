import { z } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNPROCESSABLE"
  | "INTERNAL_ERROR";

export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | {
      success: false;
      error: {
        code: ApiErrorCode;
        message: string;
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
        details?: unknown;
      };
    };

// ── Constantes normalizadas (usadas en todos los módulos) ──
export const PATENTE_REGEX = /^(?:[A-Z]{2}\s?\d{3}\s?[A-Z]{2}|[A-Z]{3}\s?\d{3})$/;
export const PATENTE_REGEX_DESC = "Formato inválido. Ejemplos válidos: AA 123 BB o AB123CD (nueva) o ABC 123 (vieja)";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_CSV_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_CSV_ROWS = 500;
export const MAX_FILES_PER_REQUEST = 5;

export const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
] as const;

export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
] as const;

// ── Helpers ──
export function zodToFieldErrors(e: z.ZodError): Record<string, string[]> {
  const flat = e.flatten();
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(flat.fieldErrors)) {
    if (v) out[k] = v;
  }
  if (flat.formErrors.length > 0) {
    out["_form"] = flat.formErrors;
  }
  return out;
}

export function zodToDetails(e: z.ZodError) {
  return {
    fieldErrors: zodToFieldErrors(e),
    issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message, code: i.code })),
  };
}

export class AppError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string[]>,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toApiErrorResponse(err: unknown): { status: number; body: ApiResponse<never> } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          fieldErrors: err.fieldErrors,
          details: err.details,
        },
      },
    };
  }
  if (err instanceof z.ZodError) {
    return {
      status: 400,
      body: {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Revisá los datos ingresados",
          fieldErrors: zodToFieldErrors(err),
          details: zodToDetails(err),
        },
      },
    };
  }
  const message = err instanceof Error ? err.message : "Error interno del servidor";
  // Map common auth strings to codes
  if (message === "No autorizado" || message === "Unauthorized" || message.includes("No autorizado")) {
    return { status: 401, body: { success: false, error: { code: "UNAUTHORIZED", message } } };
  }
  if (message === "Forbidden" || message.includes("Forbidden")) {
    return { status: 403, body: { success: false, error: { code: "FORBIDDEN", message } } };
  }
  return { status: 500, body: { success: false, error: { code: "INTERNAL_ERROR", message } } };
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status?: number,
  fieldErrors?: Record<string, string[]>,
  details?: unknown
): { status: number; body: ApiResponse<never> } {
  const statusMap: Record<ApiErrorCode, number> = {
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    PAYLOAD_TOO_LARGE: 413,
    UNPROCESSABLE: 422,
    INTERNAL_ERROR: 500,
  };
  return {
    status: status ?? statusMap[code],
    body: { success: false, error: { code, message, fieldErrors, details } },
  };
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255);
}
