import { auth } from "@/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import HideOnScroll from "@/components/layout/hide-on-scroll";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Truck } from "lucide-react";

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
              <SidebarTrigger className="md:hidden" />
              <div className="flex items-center gap-2 md:hidden">
                <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-sm">
                  <Truck className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  TrackOps
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono hidden md:block">
                TRACKOPS / DASHBOARD
              </div>
            </div>
            <div className="text-sm flex items-center gap-3">
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
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
