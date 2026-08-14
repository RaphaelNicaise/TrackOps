import { auth } from "@/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardMain } from "@/components/layout/dashboard-main";
import HideOnScroll from "@/components/layout/hide-on-scroll";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SidebarProvider>
      <AppSidebar userRole={session?.user?.role} />
      <main className="flex-1 w-full bg-background min-h-screen flex flex-col">
        <HideOnScroll>
          <div className="h-14 flex items-center justify-between border-b bg-card px-4 md:px-6 shadow-sm">
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
                TRACKOPS / DASHBOARD
              </div>
            </div>
            <div className="text-sm flex items-center gap-3">
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
        </HideOnScroll>
        <DashboardMain>
          {children}
        </DashboardMain>
      </main>
    </SidebarProvider>
  );
}
