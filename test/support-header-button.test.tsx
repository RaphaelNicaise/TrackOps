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
  usePathname: () => "/panel",
}));

// Mock @radix-ui/react-dialog Portal for server-side static markup rendering
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
  };
});

vi.mock("@radix-ui/react-select", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-select");
  return {
    ...actual,
    Root: ({ children, defaultValue, value }: any) => <div data-select-root="" data-value={value || defaultValue}>{children}</div>,
    Trigger: ({ children, ...props }: any) => <button type="button" {...props}>{children}</button>,
    Value: ({ children, placeholder }: any) => <span>{children || placeholder}</span>,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
    Content: ({ children, ...props }: any) => <div data-radix-select-content="" {...props}>{children}</div>,
    Viewport: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Item: ({ children, value, ...props }: any) => <div data-value={value} {...props}>{children} {value}</div>,
    ItemText: ({ children }: any) => <span>{children}</span>,
    ItemIndicator: ({ children }: any) => <span>{children}</span>,
    ScrollUpButton: () => null,
    ScrollDownButton: () => null,
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

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "usr-mock-1",
      name: "Juan Perez",
      email: "juan@transportes.com",
      role: "ADMIN_EMPRESA",
      empresaId: 10,
    },
  }),
}));

vi.mock("@/lib/impersonation", () => ({
  getEffectiveTenantContext: vi.fn().mockResolvedValue({
    isImpersonating: false,
    empresaId: 10,
    empresaNombre: "Transportes del Norte",
  }),
}));

import { SupportTicketHeaderButton } from "@/components/soporte/support-ticket-header-button";
import PanelLayout from "@/app/panel/layout";

describe("SupportTicketHeaderButton Component (Task 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSupportTicket.mockResolvedValue({
      success: true,
      ticketId: 42,
      message: "Ticket de soporte creado correctamente",
    });
  });

  describe("Button Trigger and Initial State", () => {
    it("renders the support button with Headphones icon and Soporte text", () => {
      const html = renderToStaticMarkup(
        <SupportTicketHeaderButton
          userName="Juan Perez"
          userEmail="juan@transportes.com"
          empresaNombre="Transportes del Norte"
          empresaId={10}
          userRole="ADMIN_EMPRESA"
        />
      );

      expect(html).toContain("Soporte");
      expect(html).toContain("Contactar Soporte / Reportar Incidencia");
    });
  });

  describe("Modal Form Fields and Options", () => {
    it("renders modal header with user session and empresa info", () => {
      const html = renderToStaticMarkup(
        <SupportTicketHeaderButton
          userName="Juan Perez"
          userEmail="juan@transportes.com"
          empresaNombre="Transportes del Norte"
          empresaId={10}
          userRole="ADMIN_EMPRESA"
          defaultOpen={true}
        />
      );

      expect(html).toContain("Centro de Soporte &amp; Incidencias");
      expect(html).toContain("Juan Perez");
      expect(html).toContain("juan@transportes.com");
      expect(html).toContain("Transportes del Norte");
      expect(html).toContain("ADMIN_EMPRESA");
    });

    it("handles fallback when userName or empresaNombre are not provided", () => {
      const html = renderToStaticMarkup(
        <SupportTicketHeaderButton
          userEmail="soloemail@empresa.com"
          empresaId={5}
          defaultOpen={true}
        />
      );

      expect(html).toContain("Empresa #5");
      expect(html).toContain("soloemail@empresa.com");
    });

    it("renders all ticket tipo options in the form", () => {
      const html = renderToStaticMarkup(
        <SupportTicketHeaderButton
          userName="Juan Perez"
          userEmail="juan@transportes.com"
          defaultOpen={true}
        />
      );

      expect(html).toContain("PROBLEMA_TECNICO");
      expect(html).toContain("Falla Técnica / Error en el Sistema");
      expect(html).toContain("DISPOSITIVO_GPS");
      expect(html).toContain("Problema con GPS / Vehículo / Telemetría");
      expect(html).toContain("FACTURACION");
      expect(html).toContain("Consulta de Facturación / Plan");
      expect(html).toContain("QUEJA_RECLAMO");
      expect(html).toContain("Reclamo / Disconformidad");
      expect(html).toContain("CONSULTA_GENERAL");
      expect(html).toContain("Consulta General / Asesoramiento");
      expect(html).toContain("OTRO");
      expect(html).toContain("Otro Motivo");
    });

    it("renders all priority options (BAJA, MEDIA, ALTA, URGENTE)", () => {
      const html = renderToStaticMarkup(
        <SupportTicketHeaderButton
          userName="Juan Perez"
          userEmail="juan@transportes.com"
          defaultOpen={true}
        />
      );

      expect(html).toContain("BAJA");
      expect(html).toContain("MEDIA");
      expect(html).toContain("ALTA");
      expect(html).toContain("URGENTE");
      expect(html).toContain("Baja");
      expect(html).toContain("Media");
      expect(html).toContain("Alta");
      expect(html).toContain("Urgente");
    });

    it("renders form inputs for asunto, mensaje, email/whatsapp dynamic fields and preferenciaRespuesta", () => {
      const html = renderToStaticMarkup(
        <SupportTicketHeaderButton
          userName="Juan Perez"
          userEmail="juan@transportes.com"
          defaultOpen={true}
        />
      );

      expect(html).toContain("Asunto");
      expect(html).toContain("Mensaje");
      expect(html).toContain("Email de Contacto para Respuesta");
      expect(html).toContain("¿Por qué medio prefieres recibir la respuesta?");
      expect(html).toContain("Email");
      expect(html).toContain("WhatsApp");
      expect(html).toContain("Enviar Ticket");
      expect(html).toContain("Cancelar");
    });
  });

  describe("Integration in Panel Layout", () => {
    it("renders SupportTicketHeaderButton inside the panel layout header bar", async () => {
      const layoutJsx = await PanelLayout({ children: <div>Contenido Panel</div> });
      const html = renderToStaticMarkup(layoutJsx);

      expect(html).toContain("Soporte");
      expect(html).toContain("Contactar Soporte / Reportar Incidencia");
      expect(html).toContain("Contenido Panel");
    });
  });
});
