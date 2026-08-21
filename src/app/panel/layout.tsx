import { auth } from "@/auth";
import { getEffectiveTenantContext } from "@/lib/impersonation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardMain } from "@/components/layout/dashboard-main";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SupportTicketHeaderButton } from "@/components/soporte/support-ticket-header-button";
import { ForcePasswordChangeModal } from "@/components/auth/ForcePasswordChangeModal";
import { SuperadminImpersonationBanner } from "@/components/layout/SuperadminImpersonationBanner";
import Image from "next/image";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const tenantContext = await getEffectiveTenantContext();

  return (
    <SidebarProvider className="h-svh max-h-svh overflow-hidden w-full">
      <ForcePasswordChangeModal
        mustChangePassword={session?.user?.mustChangePassword}
        userName={session?.user?.name || session?.user?.email}
      />
      <AppSidebar
        userRole={session?.user?.role}
        isImpersonating={tenantContext?.isImpersonating}
        impersonatedTenantNombre={tenantContext?.empresaNombre}
      />
      <div className="flex-1 flex flex-col h-svh max-h-svh overflow-hidden min-w-0 bg-background">
        {/* Fixed Header & Impersonation Banner Container */}
        <header className="shrink-0 z-30 w-full flex flex-col border-b bg-card">
          {tenantContext?.isImpersonating && tenantContext.empresaId && (
            <SuperadminImpersonationBanner
              empresaId={tenantContext.empresaId}
              empresaNombre={tenantContext.empresaNombre || `Empresa #${tenantContext.empresaId}`}
            />
          )}
          <div className="h-14 flex items-center justify-between px-4 md:px-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden h-10 w-10 [&>svg]:!size-6" />
              <div className="flex items-center gap-2 md:hidden">
                <img 
                  src="/trackopslogo.png" 
                  alt="TrackOps Logo" 
                  className="h-9 w-auto object-contain"
                />
              </div>
              <div className="text-xs text-muted-foreground font-mono hidden md:block">
                TRACKOPS / PANEL
              </div>
            </div>
            <div className="text-sm flex items-center gap-3">
              <SupportTicketHeaderButton
                userName={session?.user?.name}
                userEmail={session?.user?.email}
                empresaNombre={tenantContext?.empresaNombre}
                empresaId={tenantContext?.empresaId ?? (session?.user as any)?.empresaId}
                userRole={session?.user?.role}
              />
              <ThemeToggle />
              <span className="bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hidden sm:inline-flex">
                {session?.user?.role || "GUEST"}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm hidden sm:block">
                  {session?.user?.name || session?.user?.email}
                </span>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 sm:hidden">
                  <span className="font-bold text-xs text-primary">
                    {(session?.user?.name || session?.user?.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport for Dashboard Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col">
          <DashboardMain>
            {children}
          </DashboardMain>
        </div>
      </div>
    </SidebarProvider>
  );
}
