import { Home, Package, AlertTriangle, FileText, LogOut, ShoppingBag, ListOrdered } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { role } = useUserRole();

  const getMenuItems = () => {
    if (role === "cliente") {
      return [
        { title: "Catálogo", url: "/catalogo", icon: ShoppingBag },
      ];
    }

    if (role === "funcionario") {
      return [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Produtos", url: "/products", icon: Package },
        { title: "Encomendas", url: "/orders", icon: ListOrdered },
        { title: "Ocorrências", url: "/incidents", icon: AlertTriangle },
      ];
    }

    // admin
    return [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Produtos", url: "/products", icon: Package },
      { title: "Encomendas", url: "/orders", icon: ListOrdered },
      { title: "Ocorrências", url: "/incidents", icon: AlertTriangle },
      { title: "Relatórios", url: "/reports", icon: FileText },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            D-DIK SPORTS
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
