import { describe, it, expect } from "vitest";
import { superAdminNav, adminNav, navByRole } from "@/components/layout/app-sidebar";

describe("Sidebar Superadmin items", () => {
  it("should contain all required superadmin sections", () => {
    const labels = superAdminNav.map((group) => group.label);
    expect(labels).toContain("Monitoreo SaaS");
    expect(labels).toContain("Gestión de Plataforma");
    expect(labels).toContain("Dev & Operaciones");
  });

  it("should contain all Monitoreo SaaS items", () => {
    const group = superAdminNav.find((g) => g.label === "Monitoreo SaaS");
    expect(group).toBeDefined();
    expect(group?.items).toHaveLength(2);
    expect(group?.items[0]).toMatchObject({
      title: "Dashboard Global",
      url: "/dashboard/superadmin/dashboard",
    });
    expect(group?.items[1]).toMatchObject({
      title: "Alertas & Salud",
      url: "/dashboard/superadmin/alertas",
    });
  });

  it("should contain all Gestión de Plataforma items", () => {
    const group = superAdminNav.find((g) => g.label === "Gestión de Plataforma");
    expect(group).toBeDefined();
    expect(group?.items).toHaveLength(3);
    expect(group?.items[0]).toMatchObject({
      title: "Empresas Clientes",
      url: "/dashboard/superadmin/clientes",
    });
    expect(group?.items[1]).toMatchObject({
      title: "Prospectos (Leads)",
      url: "/dashboard/superadmin/prospectos",
    });
    expect(group?.items[2]).toMatchObject({
      title: "Cobros & Planes",
      url: "/dashboard/superadmin/facturacion",
    });
  });

  it("should contain all Dev & Operaciones items with correct external links", () => {
    const group = superAdminNav.find((g) => g.label === "Dev & Operaciones");
    expect(group).toBeDefined();
    expect(group?.items).toHaveLength(4);

    const configItem = group?.items.find((i) => i.title === "Configuración Sistema");
    expect(configItem).toMatchObject({
      title: "Configuración Sistema",
      url: "/dashboard/superadmin/dev/config",
    });
    expect(configItem?.external).toBeFalsy();

    const umamiItem = group?.items.find((i) => i.title === "Umami Analytics");
    expect(umamiItem).toMatchObject({
      title: "Umami Analytics",
      url: "http://localhost:3002",
      external: true,
    });

    const pgAdminItem = group?.items.find((i) => i.title === "pgAdmin Database");
    expect(pgAdminItem).toMatchObject({
      title: "pgAdmin Database",
      url: "http://localhost:5050",
      external: true,
    });

    const portainerItem = group?.items.find((i) => i.title === "Portainer Docker");
    expect(portainerItem).toMatchObject({
      title: "Portainer Docker",
      url: "http://localhost:9000",
      external: true,
    });
  });

  it("should map SUPER_ADMIN to superAdminNav in navByRole", () => {
    expect(navByRole.SUPER_ADMIN).toBe(superAdminNav);
  });

  it("should maintain regular adminNav for ADMIN_EMPRESA", () => {
    expect(navByRole.ADMIN_EMPRESA).toBe(adminNav);
  });
});
