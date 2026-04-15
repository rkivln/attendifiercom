import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Search } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top bar */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 rounded-full px-4 py-2 frosted-surface">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-32"
                />
              </div>
              <button className="h-9 w-9 rounded-full frosted-surface flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>

          {/* Footer */}
          <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t border-border/50">
            © 2026 Attendifier — Designed by GOKULAN
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
