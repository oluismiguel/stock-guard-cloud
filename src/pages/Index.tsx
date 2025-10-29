import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import MobileHeader from "@/components/MobileHeader";
import { Package, AlertTriangle, TrendingUp, DollarSign, ShoppingCart, PackageCheck } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalValue: 0,
    recentSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data: products } = await supabase
        .from("products")
        .select("*");

      const { data: sales } = await supabase
        .from("sales")
        .select("*, products(name)")
        .gte("sale_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const totalProducts = products?.length || 0;
      const lowStock = products?.filter(p => p.current_stock <= p.minimum_stock).length || 0;
      const totalValue = products?.reduce((sum, p) => sum + (p.current_stock * (p.sale_price || 0)), 0) || 0;
      const recentSales = sales?.reduce((sum, s) => sum + s.profit, 0) || 0;

      // Calculate top selling products
      const productSales = sales?.reduce((acc: any, sale: any) => {
        const productName = sale.products?.name || "Desconhecido";
        if (!acc[productName]) {
          acc[productName] = 0;
        }
        acc[productName] += sale.quantity;
        return acc;
      }, {});

      const topProductsData = Object.entries(productSales || {})
        .map(([name, quantity]) => ({ name, value: quantity as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setTopProducts(topProductsData);
      setStats({ totalProducts, lowStock, totalValue, recentSales, totalOrders: 0, pendingOrders: 0 });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Dashboard" />

      <div className="p-4 space-y-6 -mt-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Total de Produtos</p>
                <p className="text-3xl font-bold text-white">{stats.totalProducts}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-5 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Estoque Baixo</p>
                <p className="text-3xl font-bold text-white">{stats.lowStock}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-5 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Valor em Estoque</p>
                <p className="text-2xl font-bold text-white">R$ {stats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-5 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Lucro (30d)</p>
                <p className="text-2xl font-bold text-white">R$ {stats.recentSales.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {topProducts.length > 0 && (
          <Card className="bg-white rounded-3xl p-6 shadow-lg">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Produtos Mais Vendidos</h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card
            onClick={() => navigate("/inventory")}
            className="bg-white rounded-3xl p-5 shadow-lg cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <PackageCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-center">Encomendas</h3>
            </div>
          </Card>

          <Card
            onClick={() => navigate("/reports")}
            className="bg-white rounded-3xl p-5 shadow-lg cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-center">Relatórios</h3>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
