import { Home, Package, AlertTriangle, FileText, LogOut, ShoppingCart } from "lucide-react";
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

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home, roles: ['gerente', 'admin'] },
  { title: "Produtos", url: "/products", icon: Package, roles: ['funcionario', 'gerente', 'admin'] },
  { title: "Pedidos", url: "/orders", icon: ShoppingCart, roles: ['funcionario', 'gerente', 'admin'] },
  { title: "Ocorrências", url: "/incidents", icon: AlertTriangle, roles: ['funcionario', 'gerente', 'admin'] },
  { title: "Relatórios", url: "/reports", icon: FileText, roles: ['gerente', 'admin'] },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, role } = useAuth();
  
  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || (role && item.roles.includes(role))
  );

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            StockFlow
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
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
