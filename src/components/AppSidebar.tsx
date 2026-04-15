import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ClipboardCheck, LayoutDashboard, LogOut, User, BarChart3,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const teacherItems = [
  { title: "Dashboard", url: "/teacher", icon: LayoutDashboard },
  { title: "Analytics", url: "/teacher/analytics", icon: BarChart3 },
];

const studentItems = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (!user) return null;

  const items = user.role === "teacher" ? teacherItems : studentItems;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
              Attendifier
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <div className="flex flex-col items-center py-6">
          <div className="h-14 w-14 rounded-full frosted-surface flex items-center justify-center mb-3">
            <User className="h-7 w-7 text-muted-foreground" />
          </div>
          {!collapsed && (
            <>
              <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="rounded-lg"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
