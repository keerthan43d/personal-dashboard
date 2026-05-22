import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppProvider } from "@/components/layout/app-provider";
import { AuthGate } from "@/components/auth/auth-gate";
import { PuckWidget } from "@/components/puck/PuckWidget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppProvider>
        <SidebarProvider defaultOpen={true}>
          <div className="flex h-screen w-full overflow-hidden bg-background">
            <SidebarNav />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {children}
            </main>
          </div>
          <PuckWidget />
        </SidebarProvider>
      </AppProvider>
    </AuthGate>
  );
}
