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
  Map
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type NavItem = {
  title: string;
  url: string;
  icon?: any;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const adminNav: NavGroup[] = [
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

const navByRole: Record<string, NavGroup[]> = {
  SUPER_ADMIN: adminNav,
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

  const groups = navByRole[userRole || ""] || navByRole["CHOFER"];

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
        {groups.map((group, groupIdx) => (
          <SidebarGroup key={`group-${groupIdx}`} className="p-0 mb-4">
            {group.label && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={`${item.title}-${itemIdx}`}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"))}
                        tooltip={item.title}
                        className="h-10 text-sm font-medium transition-all duration-200 ease-in-out"
                      >
                        <Link
                          href={item.url}
                          className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center w-full"
                        >
                          {Icon && <Icon className="h-5 w-5 shrink-0" />}
                          <span className="whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
