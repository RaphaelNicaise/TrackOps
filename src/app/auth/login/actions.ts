"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginWithCredentials(formData: FormData) {
  try {
    await signIn("credentials", formData);
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Credenciales inválidas. Verifique sus datos e intente nuevamente." };
        default:
          return { success: false, error: "Error al iniciar sesión. Intente más tarde." };
      }
    }
    // NEXT_REDIRECT must be rethrown to let Next.js redirect
    throw error;
  }
}
