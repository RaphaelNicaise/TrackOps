"use client";
import { appAlert } from "@/lib/alerts";
import type { ApiResponse } from "@/lib/api-error";

const CODE_TITLE: Record<string, string> = {
  VALIDATION_ERROR: "Revisá los datos",
  UNPROCESSABLE: "Revisá el archivo",
  CONFLICT: "Dato duplicado",
  PAYLOAD_TOO_LARGE: "Archivo muy grande",
  UNAUTHORIZED: "Acceso denegado",
  FORBIDDEN: "Acceso denegado",
  NOT_FOUND: "No encontrado",
  INTERNAL_ERROR: "Error interno",
};

const CODE_TYPE: Record<string, "error" | "warning" | "info"> = {
  VALIDATION_ERROR: "error",
  UNPROCESSABLE: "error",
  CONFLICT: "warning",
  PAYLOAD_TOO_LARGE: "warning",
  UNAUTHORIZED: "error",
  FORBIDDEN: "error",
  NOT_FOUND: "warning",
  INTERNAL_ERROR: "error",
};

export function getErrorMessage(body: ApiResponse<never>): string {
  if (body.success === false) return body.error.message;
  return "Error inesperado";
}

export function getFieldErrors(body: ApiResponse<never>): Record<string, string[]> | undefined {
  if (body.success === false) return body.error.fieldErrors;
  return undefined;
}

export async function handleApiResult(res: Response): Promise<{ ok: boolean; data?: unknown; fieldErrors?: Record<string, string[]> }> {
  let body: ApiResponse<never>;
  try {
    body = (await res.json()) as ApiResponse<never>;
  } catch {
    const msg = `Error ${res.status}: ${res.statusText}`;
    appAlert.error(msg, "Error");
    return { ok: false };
  }

  // Success envelope
  if ((body as { success: boolean }).success === true) {
    const ok = body as { success: true; data: unknown; message?: string };
    if (ok.message) appAlert.success(ok.message, "Listo");
    return { ok: true, data: ok.data };
  }

  // Error envelope normalizado
  if ((body as { success: boolean }).success === false) {
    const err = body as { success: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]>; details?: unknown } };
    const title = CODE_TITLE[err.error.code] ?? "Error";
    const type = CODE_TYPE[err.error.code] ?? "error";
    if (type === "warning") appAlert.warning(err.error.message, title);
    else appAlert.error(err.error.message, title);

    // Si es UNAUTHORIZED/FORBIDDEN con modal más visible
    if (err.error.code === "UNAUTHORIZED" || err.error.code === "FORBIDDEN") {
      // toast ya mostrado, no duplicar modal para no ser intrusivo
    }

    return { ok: false, fieldErrors: err.error.fieldErrors };
  }

  // Fallback legacy {error: "string"}
  const legacy = body as unknown as { error?: string; message?: string };
  const msg = legacy.error || legacy.message || `Error ${res.status}`;
  appAlert.error(msg, "Error");
  return { ok: false };
}

export function handleActionResult<T>(result: ApiResponse<T>): { ok: boolean; data?: T; fieldErrors?: Record<string, string[]> } {
  if (result.success) {
    if (result.message) appAlert.success(result.message, "Listo");
    return { ok: true, data: result.data };
  }
  const title = CODE_TITLE[result.error.code] ?? "Error";
  const type = CODE_TYPE[result.error.code] ?? "error";
  if (type === "warning") appAlert.warning(result.error.message, title);
  else appAlert.error(result.error.message, title);
  return { ok: false, fieldErrors: result.error.fieldErrors };
}
