"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logAudit } from "./audit";

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to change password on first login or when mandatory change is flagged.
 */
export async function changeInitialPassword(formData: FormData): Promise<ChangePasswordResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado. Por favor inicia sesión nuevamente." };
    }

    const newPassword = (formData.get("newPassword") as string) || "";
    const confirmPassword = (formData.get("confirmPassword") as string) || "";

    if (!newPassword || newPassword.trim().length < 8) {
      return { success: false, error: "La nueva contraseña debe tener al menos 8 caracteres." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "Las contraseñas no coinciden. Verifícalas e inténtalo de nuevo." };
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: 0,
      })
      .where(eq(users.id, session.user.id));

    await logAudit("UPDATE", "user_password", session.user.id, {
      reason: "mandatory_first_login_password_change",
    });

    revalidatePath("/panel");
    return { success: true };
  } catch (error) {
    console.error("Error changing initial password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al cambiar la contraseña.",
    };
  }
}
