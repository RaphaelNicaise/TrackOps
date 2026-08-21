import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock @radix-ui/react-dialog Portal for server-side static markup rendering
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
  };
});

const mockCreateSupportTicket = vi.fn();
vi.mock("@/lib/soporte-actions", () => ({
  createSupportTicket: (...args: any[]) => mockCreateSupportTicket(...args),
}));

const mockAlertSuccess = vi.fn();
const mockAlertError = vi.fn();
vi.mock("@/lib/alerts", () => ({
  appAlert: {
    success: (...args: any[]) => mockAlertSuccess(...args),
    error: (...args: any[]) => mockAlertError(...args),
    warning: vi.fn(),
    info: vi.fn(),
    toast: vi.fn(),
    modal: vi.fn(),
  },
}));

import { PublicSupportDialog } from "@/components/soporte/public-support-dialog";
import LandingPage from "@/app/page";

describe("PublicSupportDialog Component (Task 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSupportTicket.mockResolvedValue({
      success: true,
      ticketId: 101,
      message: "Ticket de soporte creado correctamente",
    });
  });

  describe("Trigger Button Rendering", () => {
    it("renders the trigger button with text 'Hablar con Soporte'", () => {
      const html = renderToStaticMarkup(<PublicSupportDialog />);
      expect(html).toContain("Hablar con Soporte");
    });
  });

  describe("Modal Dialog Content and Form Fields", () => {
    it("renders modal header with title and description", () => {
      const html = renderToStaticMarkup(<PublicSupportDialog defaultOpen={true} />);
      expect(html).toContain("Mesa de Ayuda y Soporte TrackOps");
      expect(html).toContain(
        "¿Tienes dudas sobre el servicio, problemas técnicos o necesitas asistencia con tu cuenta? Envíanos tu consulta y un especialista te responderá a la brevedad."
      );
    });

    it("renders all required form inputs: nombre, email, telefono, empresa", () => {
      const html = renderToStaticMarkup(<PublicSupportDialog defaultOpen={true} />);
      expect(html).toContain("Nombre y Apellido");
      expect(html).toContain("Email de Contacto");
      expect(html).toContain("Teléfono / WhatsApp");
      expect(html).toContain("Empresa / Flota");
      expect(html).toContain("type=\"email\"");
    });

    it("renders all ticket tipo options in select", () => {
      const html = renderToStaticMarkup(<PublicSupportDialog defaultOpen={true} />);
      expect(html).toContain("CONSULTA_GENERAL");
      expect(html).toContain("PROBLEMA_TECNICO");
      expect(html).toContain("DISPOSITIVO_GPS");
      expect(html).toContain("FACTURACION");
      expect(html).toContain("QUEJA_RECLAMO");
      expect(html).toContain("OTRO");
    });

    it("renders asunto, mensaje, and preferencia de respuesta fields", () => {
      const html = renderToStaticMarkup(<PublicSupportDialog defaultOpen={true} />);
      expect(html).toContain("Asunto");
      expect(html).toContain("Mensaje o Consulta");
      expect(html).toContain("Preferencia de Contacto");
      expect(html).toContain("EMAIL");
      expect(html).toContain("WHATSAPP");
      expect(html).toContain("TELEFONO");
    });

    it("renders dialog action buttons: cancel and submit", () => {
      const html = renderToStaticMarkup(<PublicSupportDialog defaultOpen={true} />);
      expect(html).toContain("Cancelar");
      expect(html).toContain("Enviar Consulta");
    });
  });

  describe("Landing Page Integration", () => {
    it("renders LandingPage including PublicSupportDialog in the footer", () => {
      const html = renderToStaticMarkup(<LandingPage />);
      expect(html).toContain("Hablar con Soporte");
      expect(html).toContain("Contacto Ventas");
      expect(html).toContain("Términos y Privacidad");
    });
  });
});

