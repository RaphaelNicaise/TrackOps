export const DEMO_EMAIL_SUFFIX = "@test.com";

/**
 * Empresa sembrada por los scripts de seed ("Logística Alpha S.A.").
 * Todos sus usuarios se consideran parte de la cuenta demo.
 */
export const DEMO_EMPRESA_ID = 1;

export interface DemoUserLike {
  email?: string | null;
  empresaId?: number | null;
}

export function isDemoEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(DEMO_EMAIL_SUFFIX);
}

export function isDemoUser(user?: DemoUserLike | null): boolean {
  if (!user) return false;
  return isDemoEmail(user.email) || user.empresaId === DEMO_EMPRESA_ID;
}

/**
 * true solo si la sesión actual pertenece a la cuenta demo
 * (usuarios @test.com o usuarios de la empresa demo).
 * En caso de error (sin sesión / BD no disponible) devuelve false:
 * el comportamiento seguro es NO mostrar datos de prueba.
 */
export async function isDemoSession(): Promise<boolean> {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    return isDemoUser(session?.user);
  } catch {
    return false;
  }
}
