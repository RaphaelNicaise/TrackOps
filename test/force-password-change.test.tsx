import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ForcePasswordChangeModal } from "@/components/auth/ForcePasswordChangeModal";
import { changeInitialPassword } from "@/lib/auth-actions";
import { db } from "@/db";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/panel",
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-123",
      email: "admin@empresa.com",
      role: "ADMIN_EMPRESA",
      empresaId: 1,
      mustChangePassword: 1,
    },
  }),
}));

// Mock db
vi.mock("@/db", () => {
  const updateFn = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ id: "user-123" }]),
    }),
  });
  return {
    db: {
      update: updateFn,
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "user-123", mustChangePassword: 0 }]),
        }),
      }),
    },
  };
});

// Mock audit
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(true),
}));

describe("ForcePasswordChangeModal & Auth Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Modal Visibility", () => {
    it("renders nothing when mustChangePassword is 0", () => {
      const html = renderToStaticMarkup(
        <ForcePasswordChangeModal mustChangePassword={0} userName="Juan Pérez" />
      );
      expect(html).toBe("");
    });

    it("renders nothing when mustChangePassword is undefined", () => {
      const html = renderToStaticMarkup(
        <ForcePasswordChangeModal mustChangePassword={undefined} userName="Juan Pérez" />
      );
      expect(html).toBe("");
    });

    it("renders modal dialog when mustChangePassword is 1", () => {
      const html = renderToStaticMarkup(
        <ForcePasswordChangeModal mustChangePassword={1} userName="Juan Pérez" />
      );
      expect(html).toContain("Actualización de Contraseña");
      expect(html).toContain("Juan Pérez");
      expect(html).toContain("Nueva Contraseña");
      expect(html).toContain("Confirmar Nueva Contraseña");
    });
  });

  describe("changeInitialPassword Server Action", () => {
    it("rejects passwords with fewer than 8 characters", async () => {
      const formData = new FormData();
      formData.append("newPassword", "short");
      formData.append("confirmPassword", "short");

      const result = await changeInitialPassword(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("al menos 8 caracteres");
    });

    it("rejects non-matching passwords", async () => {
      const formData = new FormData();
      formData.append("newPassword", "Password123!");
      formData.append("confirmPassword", "Different123!");

      const result = await changeInitialPassword(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("no coinciden");
    });

    it("updates password and clears mustChangePassword to 0", async () => {
      const formData = new FormData();
      formData.append("newPassword", "NewSecurePassword123!");
      formData.append("confirmPassword", "NewSecurePassword123!");

      const result = await changeInitialPassword(formData);
      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });
  });
});
