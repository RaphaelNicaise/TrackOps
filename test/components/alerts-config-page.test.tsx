import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock @radix-ui/react-dialog Portal for renderToStaticMarkup
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual<any>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: any) => <div data-radix-portal="">{children}</div>,
  };
});

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", email: "admin@empresa.com", role: "ADMIN_EMPRESA", empresaId: 1 },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockSaveAlertConfigAction = vi.fn();
const mockSendTestAlertAction = vi.fn();
const mockGetAlertConfigAction = vi.fn();

vi.mock("@/lib/alert-config-actions", () => ({
  saveAlertConfigAction: (...args: any[]) => mockSaveAlertConfigAction(...args),
  sendTestAlertAction: (...args: any[]) => mockSendTestAlertAction(...args),
  getAlertConfigAction: (...args: any[]) => mockGetAlertConfigAction(...args),
  DEFAULT_ALERT_MODULES: ["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS", "HORARIOS"],
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("@/lib/alerts", () => ({
  appAlert: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
    warning: vi.fn(),
    info: vi.fn(),
    toast: vi.fn(),
    modal: vi.fn(),
  },
}));

import { AlertsConfigForm } from "@/components/configuracion/AlertsConfigForm";
import { TestAlertModal } from "@/components/configuracion/TestAlertModal";
import ConfiguracionPage from "@/app/dashboard/administracion/configuracion/page";
import type { ParsedAlertConfig } from "@/types/alerts";

const MOCK_CONFIG: ParsedAlertConfig = {
  id: 1,
  empresaId: 1,
  canalEmail: 1,
  canalWhatsapp: 1,
  emailDestino: "alertas@logisticavial.com",
  telefonoWhatsapp: "+54 9 11 5555-1234",
  toleranciaKm: 500,
  toleranciaDias: 15,
  modulosHabilitados: ["MANTENIMIENTO", "DOCUMENTACION", "GEOCERCAS", "HORARIOS"],
  activo: 1,
  createdAt: new Date("2026-08-01T12:00:00Z"),
};

describe("Alerts Configuration Page & UI Components (Task 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAlertConfigAction.mockResolvedValue(MOCK_CONFIG);
    mockSaveAlertConfigAction.mockResolvedValue({
      success: true,
      config: MOCK_CONFIG,
    });
    mockSendTestAlertAction.mockResolvedValue({
      success: true,
      dispatchResult: {
        success: true,
        dispatchedChannels: ["EMAIL", "WHATSAPP"],
        destinatarioEmail: "alertas@logisticavial.com",
        destinatarioWhatsapp: "+54 9 11 5555-1234",
        logId: 101,
      },
    });
  });

  describe("AlertsConfigForm Component", () => {
    it("renders master switch and system status correctly", () => {
      const html = renderToStaticMarkup(
        <AlertsConfigForm initialConfig={MOCK_CONFIG} />
      );

      expect(html).toContain("Sistema de Alertas Habilitado");
      expect(html).toContain("Activo");
    });

    it("renders Email and WhatsApp channels with destination inputs and values", () => {
      const html = renderToStaticMarkup(
        <AlertsConfigForm initialConfig={MOCK_CONFIG} />
      );

      expect(html).toContain("Canales de Notificación");
      expect(html).toContain("Notificaciones por Email");
      expect(html).toContain("alertas@logisticavial.com");
      expect(html).toContain("Notificaciones por WhatsApp");
      expect(html).toContain("+54 9 11 5555-1234");
    });

    it("renders module activation toggles for all 4 operational modules", () => {
      const html = renderToStaticMarkup(
        <AlertsConfigForm initialConfig={MOCK_CONFIG} />
      );

      expect(html).toContain("Módulos Habilitados");
      expect(html).toContain("Mantenimiento Preventivo");
      expect(html).toContain("Vencimiento de Documentación");
      expect(html).toContain("Control de Geocercas");
      expect(html).toContain("Horarios y Uso No Autorizado");
    });

    it("renders advance tolerance inputs (Km & Días)", () => {
      const html = renderToStaticMarkup(
        <AlertsConfigForm initialConfig={MOCK_CONFIG} />
      );

      expect(html).toContain("Tolerancias de Anticipación");
      expect(html).toContain("Anticipación de Service (Km)");
      expect(html).toContain("500");
      expect(html).toContain("Anticipación de Documentos (Días)");
      expect(html).toContain("15");
    });

    it("renders action buttons: Guardar Configuración and Disparar Alerta de Prueba", () => {
      const html = renderToStaticMarkup(
        <AlertsConfigForm initialConfig={MOCK_CONFIG} />
      );

      expect(html).toContain("Guardar Configuración");
      expect(html).toContain("Disparar Alerta de Prueba");
    });

    it("displays inactive state when master switch is disabled", () => {
      const inactiveConfig: ParsedAlertConfig = {
        ...MOCK_CONFIG,
        activo: 0,
      };

      const html = renderToStaticMarkup(
        <AlertsConfigForm initialConfig={inactiveConfig} />
      );

      expect(html).toContain("Pausado");
    });

    it("handles partial module selection correctly", () => {
      const partialModulesConfig: ParsedAlertConfig = {
        ...MOCK_CONFIG,
        modulosHabilitados: ["GEOCERCAS", "HORARIOS"],
      };

      const html = renderToStaticMarkup(
        <AlertsConfigForm initialConfig={partialModulesConfig} />
      );

      expect(html).toContain("Control de Geocercas");
      expect(html).toContain("Horarios y Uso No Autorizado");
    });

    it("handles configuration with only Email channel active", () => {
      const emailOnlyConfig: ParsedAlertConfig = {
        ...MOCK_CONFIG,
        canalEmail: 1,
        canalWhatsapp: 0,
        telefonoWhatsapp: null,
      };

      const html = renderToStaticMarkup(
        <AlertsConfigForm initialConfig={emailOnlyConfig} />
      );

      expect(html).toContain("Notificaciones por Email");
      expect(html).toContain("alertas@logisticavial.com");
    });
  });

  describe("TestAlertModal Component", () => {
    it("renders modal dialog triggers and contents when open", () => {
      const html = renderToStaticMarkup(
        <TestAlertModal
          open={true}
          onOpenChange={() => {}}
          currentConfig={MOCK_CONFIG}
        />
      );

      expect(html).toContain("Simulador &amp; Prueba de Alerta");
      expect(html).toContain("Módulo Emisor");
      expect(html).toContain("Nivel de Severidad");
      expect(html).toContain("Canal de Envío");
      expect(html).toContain("Título de la Alerta");
      expect(html).toContain("Mensaje de Notificación");
      expect(html).toContain("Enviar Alerta de Prueba");
    });

    it("displays recipient summary for current configuration in test modal", () => {
      const html = renderToStaticMarkup(
        <TestAlertModal
          open={true}
          onOpenChange={() => {}}
          currentConfig={MOCK_CONFIG}
        />
      );

      expect(html).toContain("alertas@logisticavial.com");
      expect(html).toContain("+54 9 11 5555-1234");
    });

    it("handles null or missing destinations gracefully in test modal", () => {
      const emptyDestConfig: ParsedAlertConfig = {
        ...MOCK_CONFIG,
        emailDestino: null,
        telefonoWhatsapp: null,
      };

      const html = renderToStaticMarkup(
        <TestAlertModal
          open={true}
          onOpenChange={() => {}}
          currentConfig={emptyDestConfig}
        />
      );

      expect(html).toContain("No configurado");
    });
  });

  describe("Configuracion Server Page (/dashboard/administracion/configuracion)", () => {
    it("renders configuration page header, breadcrumb badges, and embedded form", async () => {
      const pageElement = await ConfiguracionPage();
      const html = renderToStaticMarkup(pageElement);

      expect(html).toContain("Configuración General");
      expect(html).toContain("ADMINISTRACIÓN");
      expect(html).toContain("Alertas Multicanal");
      expect(html).toContain("Sistema de Alertas Habilitado");
      expect(html).toContain("Guardar Configuración");
    });
  });
});
