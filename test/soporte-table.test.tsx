import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { TicketSoporteRow } from "@/types/soporte";

// Mock Radix UI Portal for server static rendering
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
  };
});

// Mock support actions
const mockUpdateTicketStatus = vi.fn();
const mockUpdateTicketPriority = vi.fn();
const mockSaveTicketInternalNotes = vi.fn();
const mockGetSupportTickets = vi.fn();

vi.mock("@/lib/soporte-actions", () => ({
  updateTicketStatus: (...args: any[]) => mockUpdateTicketStatus(...args),
  updateTicketPriority: (...args: any[]) => mockUpdateTicketPriority(...args),
  saveTicketInternalNotes: (...args: any[]) => mockSaveTicketInternalNotes(...args),
  getSupportTickets: (...args: any[]) => mockGetSupportTickets(...args),
}));

// Mock impersonation actions
const mockEnterTenantAsSuperadmin = vi.fn();
vi.mock("@/lib/impersonation", () => ({
  enterTenantAsSuperadmin: (...args: any[]) => mockEnterTenantAsSuperadmin(...args),
}));
vi.mock("@/lib/admin-actions", () => ({
  enterTenantAsSuperadmin: (...args: any[]) => mockEnterTenantAsSuperadmin(...args),
}));

// Mock alerts
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

import { TicketDetailSheet } from "@/components/superadmin/soporte/ticket-detail-sheet";
import { SoporteTable } from "@/components/superadmin/soporte/soporte-table";

const MOCK_TICKETS: TicketSoporteRow[] = [
  {
    id: 101,
    origen: "PANEL",
    empresaId: 10,
    empresaNombre: "Transportes del Sur S.A.",
    userId: "usr-101",
    userName: "Carlos Lopez",
    nombreContacto: "Carlos Lopez",
    emailContacto: "carlos@transporte.com",
    telefonoContacto: "+5491122334455",
    empresaNombreManual: null,
    tipo: "PROBLEMA_TECNICO",
    prioridad: "URGENTE",
    estado: "PENDIENTE",
    asunto: "Falla en GPS de unidad 10",
    mensaje: "El GPS del camión 10 dejó de reportar coordenadas desde las 08:00 hs.",
    preferenciaRespuesta: "WHATSAPP",
    notasInternas: "Se llamó al instalador de zona sur.",
    resueltoPor: null,
    resueltoAt: null,
    createdAt: new Date("2026-08-21T09:00:00Z"),
    updatedAt: new Date("2026-08-21T09:30:00Z"),
  },
  {
    id: 102,
    origen: "WEB",
    empresaId: null,
    empresaNombre: null,
    userId: null,
    userName: null,
    nombreContacto: "María Gómez",
    emailContacto: "maria@empresaexterior.com",
    telefonoContacto: "+5491199887766",
    empresaNombreManual: "Logística Gómez",
    tipo: "FACTURACION",
    prioridad: "MEDIA",
    estado: "EN_REVISION",
    asunto: "Consulta sobre facturas del plan Pro",
    mensaje: "Necesito copia de la factura B del mes pasado.",
    preferenciaRespuesta: "EMAIL",
    notasInternas: null,
    resueltoPor: null,
    resueltoAt: null,
    createdAt: new Date("2026-08-20T14:00:00Z"),
    updatedAt: new Date("2026-08-20T14:30:00Z"),
  },
  {
    id: 103,
    origen: "PANEL",
    empresaId: 12,
    empresaNombre: "Distribuidora Andina",
    userId: "usr-102",
    userName: "Esteban Quito",
    nombreContacto: "Esteban Quito",
    emailContacto: "esteban@andina.com",
    telefonoContacto: null,
    empresaNombreManual: null,
    tipo: "DISPOSITIVO_GPS",
    prioridad: "ALTA",
    estado: "RESUELTO",
    asunto: "Activación de nuevo sensor de combustible",
    mensaje: "Sensor instalado en Scania R450, listo para calibrar.",
    preferenciaRespuesta: "EMAIL",
    notasInternas: "Calibración completada remotamente.",
    resueltoPor: "admin@trackops.com",
    resueltoAt: new Date("2026-08-20T18:00:00Z"),
    createdAt: new Date("2026-08-19T11:00:00Z"),
    updatedAt: new Date("2026-08-20T18:00:00Z"),
  },
  {
    id: 104,
    origen: "WEB",
    empresaId: null,
    empresaNombre: null,
    userId: null,
    userName: null,
    nombreContacto: "Juan Visitante",
    emailContacto: "juan@descarte.com",
    telefonoContacto: null,
    empresaNombreManual: null,
    tipo: "OTRO",
    prioridad: "BAJA",
    estado: "DESCARTADO",
    asunto: "Spam publicitario",
    mensaje: "Ofrecemos servicios de diseño web.",
    preferenciaRespuesta: null,
    notasInternas: "Descartado por spam.",
    resueltoPor: null,
    resueltoAt: null,
    createdAt: new Date("2026-08-18T10:00:00Z"),
    updatedAt: new Date("2026-08-18T10:05:00Z"),
  },
];

describe("TicketDetailSheet Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders closed when open=false", () => {
    const html = renderToStaticMarkup(
      <TicketDetailSheet
        ticket={MOCK_TICKETS[0]}
        open={false}
        onOpenChange={() => {}}
      />
    );
    expect(html).not.toContain("Ficha 360° del Ticket");
  });

  it("renders ticket header, ID, origen badge, and creation date when open=true", () => {
    const html = renderToStaticMarkup(
      <TicketDetailSheet
        ticket={MOCK_TICKETS[0]}
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(html).toContain("#101");
    expect(html).toContain("PANEL");
    expect(html).toContain("Ficha 360° de Incidencia");
  });

  it("renders contact details: name, email, phone, and company", () => {
    const html = renderToStaticMarkup(
      <TicketDetailSheet
        ticket={MOCK_TICKETS[0]}
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(html).toContain("Carlos Lopez");
    expect(html).toContain("carlos@transporte.com");
    expect(html).toContain("+5491122334455");
    expect(html).toContain("Transportes del Sur S.A.");
    expect(html).toContain("tel:+5491122334455");
  });

  it("renders ticket content: type, priority, subject, and full message body", () => {
    const html = renderToStaticMarkup(
      <TicketDetailSheet
        ticket={MOCK_TICKETS[0]}
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(html).toContain("Falla en GPS de unidad 10");
    expect(html).toContain("El GPS del camión 10 dejó de reportar coordenadas desde las 08:00 hs.");
    expect(html).toContain("PROBLEMA_TECNICO");
    expect(html).toContain("URGENTE");
    expect(html).toContain("WHATSAPP");
  });

  it("renders action buttons: WhatsApp responder, Email responder, and Modo Soporte for tenant ticket", () => {
    const html = renderToStaticMarkup(
      <TicketDetailSheet
        ticket={MOCK_TICKETS[0]}
        open={true}
        onOpenChange={() => {}}
      />
    );

    // WhatsApp button with wa.me link
    expect(html).toContain("Responder por WhatsApp");
    expect(html).toContain("https://wa.me/");

    // Email button with mailto link
    expect(html).toContain("Responder por Email");
    expect(html).toContain("mailto:carlos@transporte.com");

    // Modo Soporte button for tenant ticket with empresaId
    expect(html).toContain("Entrar en Modo Soporte");
  });

  it("handles guest/web tickets without empresaId or phone gracefully", () => {
    const html = renderToStaticMarkup(
      <TicketDetailSheet
        ticket={MOCK_TICKETS[3]}
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(html).toContain("#104");
    expect(html).toContain("WEB");
    expect(html).toContain("Juan Visitante");
    expect(html).toContain("juan@descarte.com");
    // Should not render Modo Soporte button for tickets without empresaId
    expect(html).not.toContain("Entrar en Modo Soporte");
  });

  it("renders internal notes textarea and resolution buttons", () => {
    const html = renderToStaticMarkup(
      <TicketDetailSheet
        ticket={MOCK_TICKETS[0]}
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(html).toContain("Notas Internas de Soporte");
    expect(html).toContain("Se llamó al instalador de zona sur.");
    expect(html).toContain("Guardar Notas");
    expect(html).toContain("Marcar como Resuelto");
  });
});

describe("SoporteTable Component", () => {
  const stats = {
    total: 4,
    pendientes: 1,
    enRevision: 1,
    resueltos: 1,
    urgentes: 1,
  };

  it("renders 4 KPI cards and alerts on urgent pending tickets", () => {
    const html = renderToStaticMarkup(
      <SoporteTable initialTickets={MOCK_TICKETS} stats={stats} />
    );

    expect(html).toContain("Total Incidencias");
    expect(html).toContain("Pendientes");
    expect(html).toContain("En Revisión");
    expect(html).toContain("Resueltos");

    // Urgent alert indicator on KPI
    expect(html).toContain("urgente");
  });

  it("renders search input and filter options (Status, Priority, Type, Origin)", () => {
    const html = renderToStaticMarkup(
      <SoporteTable initialTickets={MOCK_TICKETS} stats={stats} />
    );

    // Search
    expect(html).toContain("Buscar ticket, empresa o contacto...");

    // Status filter tabs / options
    expect(html).toContain("Todos");
    expect(html).toContain("Pendientes");
    expect(html).toContain("En Revisión");
    expect(html).toContain("Resueltos");
    expect(html).toContain("Descartados");

    // Priority, Type, and Origin filters
    expect(html).toContain("Prioridad");
    expect(html).toContain("Tipo");
    expect(html).toContain("Origen");
  });

  it("renders table columns and tickets with badges, sender info, and action buttons", () => {
    const html = renderToStaticMarkup(
      <SoporteTable initialTickets={MOCK_TICKETS} stats={stats} />
    );

    // Header columns
    expect(html).toContain("Ticket &amp; Origen");
    expect(html).toContain("Remitente &amp; Empresa");
    expect(html).toContain("Asunto &amp; Tipo");
    expect(html).toContain("Prioridad");
    expect(html).toContain("Estado");
    expect(html).toContain("Fecha Alta");
    expect(html).toContain("Acciones");

    // Ticket rows
    expect(html).toContain("#101");
    expect(html).toContain("Falla en GPS de unidad 10");
    expect(html).toContain("Carlos Lopez");
    expect(html).toContain("Transportes del Sur S.A.");
    expect(html).toContain("URGENTE");
    expect(html).toContain("PENDIENTE");

    expect(html).toContain("#102");
    expect(html).toContain("Consulta sobre facturas del plan Pro");
    expect(html).toContain("María Gómez");
    expect(html).toContain("Logística Gómez");
    expect(html).toContain("EN_REVISION");

    // Action button
    expect(html).toContain("Ver Ficha 360°");
    expect(html).toContain("Modo Soporte");
  });

  it("renders empty state message when ticket list is empty", () => {
    const html = renderToStaticMarkup(
      <SoporteTable
        initialTickets={[]}
        stats={{ total: 0, pendientes: 0, enRevision: 0, resueltos: 0, urgentes: 0 }}
      />
    );

    expect(html).toContain("No se encontraron incidencias");
    expect(html).toContain("No hay tickets de soporte que coincidan con los filtros aplicados.");
  });
});
