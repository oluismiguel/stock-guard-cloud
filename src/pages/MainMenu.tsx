import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, BarChart3, Warehouse } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MainMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    {
      title: "Dashboard",
      subtitle: "Métricas e indicadores",
      icon: LayoutDashboard,
      path: "/dashboard",
      gradient: "from-[#4169E1] to-[#1E90FF]"
    },
    {
      title: "Entregas",
      subtitle: "Gerenciar pedidos",
      icon: Package,
      path: "/products",
      gradient: "from-[#4169E1] to-[#0066CC]"
    },
    {
      title: "Relatórios",
      subtitle: "Análise e gráficos",
      icon: BarChart3,
      path: "/reports",
      gradient: "from-[#0066CC] to-[#003399]"
    },
    {
      title: "Estoque",
      subtitle: "controle de produtos",
      icon: Warehouse,
      path: "/inventory",
      gradient: "from-[#003399] to-[#000080]"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000080] to-[#0000CD] text-white px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Menu Principal</h1>
        <p className="text-white/80">Bem-vindo, Gestor</p>
      </div>

      {/* Menu Cards */}
      <div className="space-y-4">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full bg-white rounded-2xl p-6 flex items-center gap-4 shadow-lg active:scale-95 transition-transform"
          >
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
              <item.icon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainMenu;
