"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  Building2,
  ScrollText,
  AlertTriangle,
  Bell,
  Clock,
  Radio
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type NavItem = {
  title?: string;
  url?: string;
  icon?: any;
  isSeparator?: boolean;
};

const navByRole: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
    { title: "Empresas", url: "/dashboard/superadmin/empresas", icon: Building2 },
    { title: "Suscripciones", url: "/dashboard/superadmin/suscripciones", icon: CreditCard },
    { title: "Auditoría", url: "/dashboard/superadmin/auditoria", icon: ScrollText },
    { isSeparator: true },
    { title: "Flota", url: "/dashboard/flota", icon: Truck },
    { title: "Mantenimiento", url: "/dashboard/mantenimiento", icon: Wrench },
    { title: "Combustible", url: "/dashboard/combustible", icon: Fuel },
    { title: "GPS & Tracking", url: "/dashboard/gps", icon: MapPin },
    { title: "Documentación", url: "/dashboard/documentacion", icon: FileText },
    { title: "Personal", url: "/dashboard/personal", icon: Users },
    { isSeparator: true },
    { title: "Usuarios", url: "/dashboard/configuracion/usuarios", icon: Settings },
  ],
  ADMIN_EMPRESA: [
    { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
    { title: "Flota", url: "/dashboard/flota", icon: Truck },
    { title: "Mantenimiento", url: "/dashboard/mantenimiento", icon: Wrench },
    { title: "Combustible", url: "/dashboard/combustible", icon: Fuel },
    { title: "GPS & Tracking", url: "/dashboard/gps", icon: MapPin },
    { title: "Documentación", url: "/dashboard/documentacion", icon: FileText },
    { title: "Personal", url: "/dashboard/personal", icon: Users },
    { isSeparator: true },
    { title: "Alertas", url: "/dashboard/alertas", icon: Bell },
    { title: "Usuarios", url: "/dashboard/configuracion/usuarios", icon: Settings },
  ],
  CHOFER: [
    { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
    { title: "Mi Jornada", url: "/dashboard/chofer", icon: Clock },
    { title: "Combustible", url: "/dashboard/combustible", icon: Fuel },
  ],
  VENDEDOR_INSTALADOR: [
    { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
    { title: "Instalaciones GPS", url: "/dashboard/instalaciones", icon: Radio },
    { title: "Flota", url: "/dashboard/flota", icon: Truck },
    { title: "GPS & Tracking", url: "/dashboard/gps", icon: MapPin },
  ],
};

interface AppSidebarProps {
  userRole?: string;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const items = navByRole[userRole || ""] || navByRole["CHOFER"];

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-2 border-b border-border/50">
        <div className="flex items-center justify-between w-full overflow-hidden">
          <div className="flex items-center gap-3 overflow-hidden transition-all duration-200 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight whitespace-nowrap">
              TrackOps
            </span>
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
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item, index) => {
                if (item.isSeparator) {
                  return (
                    <div
                      key={`sep-${index}`}
                      className="my-2 h-px bg-border/50 group-data-[collapsible=icon]:hidden"
                    />
                  );
                }

                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={`${item.title}-${index}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className="h-10 text-sm font-medium transition-all duration-200 ease-in-out"
                    >
                      <Link
                        href={item.url!}
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
