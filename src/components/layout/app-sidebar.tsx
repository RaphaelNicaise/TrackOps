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
  Building2,
  UserPlus,
  BarChart3,
  Database,
  Container,
  ExternalLink,
  Clock,
  ShieldAlert,
  Headphones,
  UserCheck,
  Navigation,
  Layers,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      { title: "Dashboard Global", url: "/panel/superadmin/dashboard", icon: LayoutDashboard },
      { title: "Alertas & Salud", url: "/panel/superadmin/alertas", icon: Bell },
    ],
  },
  {
    label: "Gestión de Plataforma",
    items: [
      { title: "Empresas Clientes", url: "/panel/superadmin/clientes", icon: Building2 },
      { title: "Prospectos (Leads)", url: "/panel/superadmin/prospectos", icon: UserPlus },
      { title: "Centro de Soporte", url: "/panel/superadmin/soporte", icon: Headphones },
      { title: "Planes", url: "/panel/superadmin/planes", icon: Layers },
      { title: "Cobros", url: "/panel/superadmin/cobros", icon: Receipt },
    ],
  },
  {
    label: "Dev & Operaciones",
    items: [
      { title: "Configuración Sistema", url: "/panel/superadmin/dev/config", icon: Settings },
      { title: "Umami Analytics", url: "http://localhost:3002", icon: BarChart3, external: true },
      { title: "pgAdmin Database", url: "http://localhost:5050", icon: Database, external: true },
      { title: "Portainer Docker", url: "http://localhost:9000", icon: Container, external: true },
    ],
  },
];

export const adminNav: NavGroup[] = [
  {
    items: [
      { title: "Inicio", url: "/panel", icon: LayoutDashboard },
      { title: "Mapa", url: "/panel/mapa", icon: Map },
    ]
  },
  {
    label: "Monitoreo",
    items: [
      { title: "Dashboard", url: "/panel/monitoreo/dashboard", icon: LayoutDashboard },
      { title: "Alertas", url: "/panel/monitoreo/alertas", icon: Bell },
    ]
  },
  {
    label: "Control de Flota",
    items: [
      { title: "Vehículos", url: "/panel/control-flota/vehiculos", icon: Truck },
      { title: "Choferes", url: "/panel/control-flota/choferes", icon: UserCheck },
      { title: "Viajes", url: "/panel/control-flota/viajes", icon: Navigation },
      { title: "Mantenimiento", url: "/panel/control-flota/mantenimiento", icon: Wrench },
      { title: "Combustible", url: "/panel/control-flota/combustible", icon: Fuel },
      { title: "Sitios", url: "/panel/control-flota/sitios", icon: MapPin },
      { title: "Geocercas", url: "/panel/control-flota/geocercas", icon: Map },
      { title: "Grupos de vehículos", url: "/panel/control-flota/grupos", icon: Users },
      { title: "Horarios de uso", url: "/panel/control-flota/horarios", icon: Clock },
    ]
  },
  {
    label: "Reportes",
    items: [
      { title: "Reportes", url: "/panel/reportes", icon: FileText },
    ]
  },
  {
    label: "Administración",
    items: [
      { title: "Configuración", url: "/panel/administracion/configuracion", icon: Settings },
      { title: "Usuarios", url: "/panel/administracion/usuarios", icon: Users },
      { title: "Facturación", url: "/panel/administracion/facturacion", icon: CreditCard },
    ]
  }
];

export const navByRole: Record<string, NavGroup[]> = {
  SUPER_ADMIN: superAdminNav,
  ADMIN_EMPRESA: adminNav,
  CHOFER: [
    {
      items: [
        { title: "Mi Panel / Mis Viajes", url: "/panel/chofer", icon: Navigation },
        { title: "Combustible", url: "/panel/control-flota/combustible", icon: Fuel },
      ]
    }
  ],
  VENDEDOR_INSTALADOR: [
    {
      items: [
        { title: "Inicio", url: "/panel", icon: LayoutDashboard },
        { title: "Mapa", url: "/panel/mapa", icon: Map },
      ]
    }
  ],
};

interface AppSidebarProps {
  userRole?: string;
  isImpersonating?: boolean;
  impersonatedTenantNombre?: string | null;
}

export function AppSidebar({
  userRole,
  isImpersonating,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  let groups: NavGroup[];
  if (isImpersonating) {
    groups = [
      {
        label: "Modo Soporte",
        items: [
          {
            title: "Volver a SuperAdmin",
            url: "/panel/superadmin/clientes",
            icon: ShieldAlert,
          },
        ],
      },
      ...adminNav,
    ];
  } else if (userRole && navByRole[userRole]) {
    groups = navByRole[userRole];
  } else {
    groups = adminNav;
  }

  const isActive = (url: string) =>
    !url.startsWith("http") &&
    (pathname === url || (url !== "/panel" && pathname.startsWith(url + "/")));

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.warn("SignOut notice:", e);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  const renderNavItem = (item: NavItem, itemIdx: number) => {
    const Icon = item.icon;
    const active = isActive(item.url);

    const content = (
      <>
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <span className="truncate whitespace-nowrap overflow-hidden text-sm font-medium transition-[max-width,opacity,margin] duration-250 ease-in-out max-w-[180px] opacity-100 ml-3 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:ml-0">
          {item.title}
        </span>
        {item.external && (
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-auto transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden" />
        )}
      </>
    );

    return (
      <SidebarMenuItem key={`${item.url}-${itemIdx}`}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.title}
          className="h-10 text-sm font-medium"
        >
          {item.external ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center w-full min-w-0"
            >
              {content}
            </a>
          ) : (
            <Link
              href={item.url}
              className="flex items-center w-full min-w-0"
            >
              {content}
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-2 border-b border-border/50">
        <div className="flex items-center justify-between w-full h-10 overflow-hidden px-1">
          <div className="flex items-center overflow-hidden transition-[max-width,opacity] duration-250 ease-in-out max-w-[180px] opacity-100 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 min-w-0">
            <img 
              src="/trackopslogo.png" 
              alt="TrackOps Logo" 
              className="h-9 w-auto object-contain shrink-0 dark:brightness-0 dark:invert transition-all"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 hidden md:flex items-center justify-center"
            title={isCollapsed ? "Expandir panel" : "Colapsar panel"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300 ease-in-out", isCollapsed && "rotate-180")} />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 gap-0.5">
        {groups.map((group, groupIdx) => (
          <SidebarGroup key={`group-${groupIdx}`} className="p-0 mb-3 group-data-[collapsible=icon]:mb-1.5">
            {group.label && (
              <SidebarGroupLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 h-7">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item, itemIdx) => renderNavItem(item, itemIdx))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar sesión"
              className="h-10 text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="truncate whitespace-nowrap overflow-hidden text-sm font-medium transition-[max-width,opacity,margin] duration-250 ease-in-out max-w-[180px] opacity-100 ml-3 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:ml-0">
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
