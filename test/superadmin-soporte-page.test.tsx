import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { superAdminNav, navByRole } from "@/components/layout/app-sidebar";
import { Headphones } from "lucide-react";

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "admin-1", email: "admin@test.com", role: "SUPER_ADMIN" },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock support actions
vi.mock("@/lib/soporte-actions", () => ({
  getSupportTickets: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        origen: "PANEL",
        empresaId: 10,
        empresaNombre: "Transportes Acme",
        userId: "usr-1",
        userName: "Juan Pérez",
        nombreContacto: "Juan Pérez",
        emailContacto: "juan@acme.com",
        telefonoContacto: "+5491122334455",
        empresaNombreManual: null,
        tipo: "PROBLEMA_TECNICO",
        prioridad: "ALTA",
        estado: "PENDIENTE",
        asunto: "Falla de señal GPS en camión 4",
        mensaje: "El dispositivo no reporta coordenadas desde las 08:00.",
        preferenciaRespuesta: "WHATSAPP",
        notasInternas: null,
        resueltoPor: null,
        resueltoAt: null,
        createdAt: new Date("2026-08-21T09:00:00Z"),
        updatedAt: new Date("2026-08-21T09:00:00Z"),
      },
    ],
  }),
  getSupportTicketStats: vi.fn().mockResolvedValue({
    total: 1,
    pendientes: 1,
    enRevision: 0,
    resueltos: 0,
    urgentes: 0,
  }),
}));

import SuperadminSoportePage, { metadata } from "@/app/panel/superadmin/soporte/page";
import { getSupportTickets, getSupportTicketStats } from "@/lib/soporte-actions";

describe("Sidebar Superadmin Support Navigation", () => {
  it("should contain 'Centro de Soporte' under 'Gestión de Plataforma'", () => {
    const platformGroup = superAdminNav.find((g) => g.label === "Gestión de Plataforma");
    expect(platformGroup).toBeDefined();

    const soporteItem = platformGroup?.items.find((item) => item.title === "Centro de Soporte");
    expect(soporteItem).toBeDefined();
    expect(soporteItem).toMatchObject({
      title: "Centro de Soporte",
      url: "/panel/superadmin/soporte",
      icon: Headphones,
    });
  });

  it("should make Centro de Soporte accessible for SUPER_ADMIN role", () => {
    const superAdminMenu = navByRole.SUPER_ADMIN;
    const platformGroup = superAdminMenu.find((g) => g.label === "Gestión de Plataforma");
    const soporteItem = platformGroup?.items.find((item) => item.url === "/panel/superadmin/soporte");
    expect(soporteItem).toBeDefined();
    expect(soporteItem?.title).toBe("Centro de Soporte");
  });
});

describe("Superadmin Centro de Soporte Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports correct page metadata", () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe("Centro de Soporte | Superadmin TrackOps");
    expect(metadata.description).toBe(
      "Mesa de ayuda e incidencias técnicas, quejas y consultas multicanal de clientes y visitantes."
    );
  });

  it("renders page header, badges, titles, and calls data fetchers", async () => {
    const pageElement = await SuperadminSoportePage();
    const html = renderToStaticMarkup(pageElement);

    // Verify data fetchers were called
    expect(getSupportTickets).toHaveBeenCalledTimes(1);
    expect(getSupportTicketStats).toHaveBeenCalledTimes(1);

    // Verify Badges and live status
    expect(html).toContain("SUPERADMIN · MESA DE AYUDA");
    expect(html).toContain("Soporte Multicanal Activo");

    // Verify Title & Subtitle
    expect(html).toContain("Centro de Soporte &amp; Incidencias");
    expect(html).toContain(
      "Gestión centralizada de reclamos, problemas de GPS, consultas comerciales y soporte técnico."
    );
  });

  it("handles fallback gracefully when data fetch fails", async () => {
    vi.mocked(getSupportTickets).mockRejectedValueOnce(new Error("DB connection error"));
    vi.mocked(getSupportTicketStats).mockRejectedValueOnce(new Error("DB connection error"));

    const pageElement = await SuperadminSoportePage();
    const html = renderToStaticMarkup(pageElement);

    expect(html).toContain("Centro de Soporte &amp; Incidencias");
    expect(html).toContain("SUPERADMIN · MESA DE AYUDA");
  });
});
