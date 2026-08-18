"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Fuel,
  MapPin,
  FileText,
  Users,
  Settings,
  CreditCard,
  LogOut,
  ChevronLeft,
  Bell,
  Map,
  ChevronRight,
  Building2,
  UserPlus,
  BarChart3,
  Database,
  Container,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export type NavItem = {
  title: string;
  url: string;
  icon?: any;
  external?: boolean;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const superAdminNav: NavGroup[] = [
  {
    label: "Monitoreo SaaS",
    items: [
      { title: "Dashboard Global", url: "/dashboard/superadmin/dashboard", icon: LayoutDashboard },
      { title: "Alertas & Salud", url: "/dashboard/superadmin/alertas", icon: Bell },
    ],
  },
  {
    label: "Gestión de Plataforma",
    items: [
      { title: "Empresas Clientes", url: "/dashboard/superadmin/clientes", icon: Building2 },
      { title: "Prospectos (Leads)", url: "/dashboard/superadmin/prospectos", icon: UserPlus },
      { title: "Cobros & Planes", url: "/dashboard/superadmin/facturacion", icon: CreditCard },
    ],
  },
  {
    label: "Dev & Operaciones",
    items: [
      { title: "Configuración Sistema", url: "/dashboard/superadmin/dev/config", icon: Settings },
      { title: "Umami Analytics", url: "http://localhost:3002", icon: BarChart3, external: true },
      { title: "pgAdmin Database", url: "http://localhost:5050", icon: Database, external: true },
      { title: "Portainer Docker", url: "http://localhost:9000", icon: Container, external: true },
    ],
  },
];

export const adminNav: NavGroup[] = [
  {
    items: [
      { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
      { title: "Mapa", url: "/dashboard/mapa", icon: Map },
    ]
  },
  {
    label: "Monitoreo",
    items: [
      { title: "Dashboard", url: "/dashboard/monitoreo/dashboard", icon: LayoutDashboard },
      { title: "Alertas", url: "/dashboard/monitoreo/alertas", icon: Bell },
    ]
  },
  {
    label: "Control de Flota",
    items: [
      { title: "Vehículos", url: "/dashboard/control-flota/vehiculos", icon: Truck },
      { title: "Mantenimiento", url: "/dashboard/control-flota/mantenimiento", icon: Wrench },
      { title: "Combustible", url: "/dashboard/control-flota/combustible", icon: Fuel },
      { title: "Sitios", url: "/dashboard/control-flota/sitios", icon: MapPin },
      { title: "Geocercas", url: "/dashboard/control-flota/geocercas", icon: Map },
      { title: "Grupos de vehículos", url: "/dashboard/control-flota/grupos", icon: Users },
    ]
  },
  {
    label: "Reportes",
    items: [
      { title: "Reportes", url: "/dashboard/reportes", icon: FileText },
    ]
  },
  {
    label: "Administración",
    items: [
      { title: "Configuración", url: "/dashboard/administracion/configuracion", icon: Settings },
      { title: "Usuarios", url: "/dashboard/administracion/usuarios", icon: Users },
      { title: "Facturación", url: "/dashboard/administracion/facturacion", icon: CreditCard },
    ]
  }
];

export const navByRole: Record<string, NavGroup[]> = {
  SUPER_ADMIN: superAdminNav,
  ADMIN_EMPRESA: adminNav,
  CHOFER: [
    {
      items: [
        { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
        { title: "Combustible", url: "/dashboard/control-flota/combustible", icon: Fuel },
      ]
    }
  ],
  VENDEDOR_INSTALADOR: [
    {
      items: [
        { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
        { title: "Mapa", url: "/dashboard/mapa", icon: Map },
      ]
    }
  ],
};

interface AppSidebarProps {
  userRole?: string;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const groups = (userRole && navByRole[userRole]) ? navByRole[userRole] : adminNav;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-2 border-b border-border/50">
        <div className="flex items-center justify-between w-full overflow-hidden">
          <div className="flex items-center h-12 overflow-hidden transition-all duration-200 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <img 
              src="/trackopslogo.png" 
              alt="TrackOps Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 hidden md:flex items-center justify-center group-data-[collapsible=icon]:mx-auto"
            title={isCollapsed ? "Expandir panel" : "Colapsar panel"}
          >
            <ChevronLeft className={`h-5 w-5 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {groups.map((group, groupIdx) => {
          if (group.label) {
            return (
              <Collapsible key={`group-${groupIdx}`} defaultOpen className="group/collapsible">
                <SidebarGroup className="p-0 mb-4">
                  <SidebarGroupLabel asChild className="group-data-[collapsible=icon]:hidden">
                    <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground hover:bg-muted/50 p-2 rounded-md transition-all cursor-pointer">
                      {group.label}
                      <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent className="pt-1">
                      <SidebarMenu className="gap-1.5">
                        {group.items.map((item, itemIdx) => {
                          const Icon = item.icon;
                          const isActive = !item.external && (pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url + "/")));
                          return (
                            <SidebarMenuItem key={`${item.title}-${itemIdx}`}>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={item.title}
                                className="h-10 text-sm font-medium transition-all duration-200 ease-in-out"
                              >
                                {item.external ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center w-full"
                                  >
                                    {Icon && <Icon className="h-5 w-5 shrink-0" />}
                                    <span className="whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 flex-1 text-left">
                                      {item.title}
                                    </span>
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-auto group-data-[collapsible=icon]:hidden" />
                                  </a>
                                ) : (
                                  <Link
                                    href={item.url}
                                    className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center w-full"
                                  >
                                    {Icon && <Icon className="h-5 w-5 shrink-0" />}
                                    <span className="whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                                      {item.title}
                                    </span>
                                  </Link>
                                )}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          }

          return (
            <SidebarGroup key={`group-${groupIdx}`} className="p-0 mb-4">
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {group.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    const isActive = !item.external && (pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url + "/")));
                    return (
                      <SidebarMenuItem key={`${item.title}-${itemIdx}`}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className="h-10 text-sm font-medium transition-all duration-200 ease-in-out"
                        >
                          {item.external ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center w-full"
                            >
                              {Icon && <Icon className="h-5 w-5 shrink-0" />}
                              <span className="whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 flex-1 text-left">
                                {item.title}
                              </span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-auto group-data-[collapsible=icon]:hidden" />
                            </a>
                          ) : (
                            <Link
                              href={item.url}
                              className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center w-full"
                            >
                              {Icon && <Icon className="h-5 w-5 shrink-0" />}
                              <span className="whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                                {item.title}
                              </span>
                            </Link>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              tooltip="Cerrar sesión"
              className="h-10 text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 ease-in-out group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                Cerrar sesión
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
