import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import MobileHeader from "@/components/MobileHeader";
import { Package, AlertTriangle, TrendingUp, ShoppingCart, Clock, CheckCircle2, Trophy, Activity } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStock: 0,
    totalValue: 0,
    totalSales: 0,
    totalProfit: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalOrders: 0,
    topProduct: { name: '-', quantity: 0 },
    avgResponseTime: 0,
    systemStatus: 'good' as 'good' | 'medium' | 'bad',
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [stockStatusData, setStockStatusData] = useState<any[]>([]);

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
    const startTime = performance.now();
    try {
      const { data: products } = await supabase
        .from("products")
        .select("*");

      const { data: sales } = await supabase
        .from("sales")
        .select("*");

      const { data: orders } = await supabase
        .from("orders")
        .select("*");

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.is_active).length || 0;
      const lowStock = products?.filter(p => p.current_stock <= p.minimum_stock && p.is_active).length || 0;
      const totalValue = products?.reduce((sum, p) => sum + (p.current_stock * (p.sale_price || 0)), 0) || 0;
      const totalSales = sales?.length || 0;
      const totalProfit = sales?.reduce((sum, s) => sum + s.profit, 0) || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
      const totalOrders = orders?.length || 0;

      // Find top selling product
      const productSales = sales?.reduce((acc: any, sale) => {
        const productId = sale.product_id;
        if (!acc[productId]) {
          acc[productId] = { productId, quantity: 0 };
        }
        acc[productId].quantity += sale.quantity;
        return acc;
      }, {});

      const topProductData = Object.values(productSales || {})
        .sort((a: any, b: any) => b.quantity - a.quantity)[0] as any;

      const topProduct = topProductData
        ? {
            name: products?.find(p => p.id === topProductData.productId)?.name || '-',
            quantity: topProductData.quantity,
          }
        : { name: '-', quantity: 0 };

      // Determine system status based on response time
      let systemStatus: 'good' | 'medium' | 'bad' = 'good';
      if (responseTime > 1000) systemStatus = 'bad';
      else if (responseTime > 500) systemStatus = 'medium';

      // Category distribution
      const categories = products?.reduce((acc: any, p) => {
        const cat = p.category || 'Sem Categoria';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      const categoryChartData = Object.entries(categories || {})
        .map(([name, value]) => ({ name, value: value as number }))
        .slice(0, 4);

      // Stock status
      const stockStatus = {
        normal: products?.filter(p => p.current_stock > p.minimum_stock).length || 0,
        low: lowStock,
        out: products?.filter(p => p.current_stock === 0).length || 0,
      };

      const stockChartData = [
        { name: 'Normal', value: stockStatus.normal },
        { name: 'Baixo', value: stockStatus.low },
        { name: 'Esgotado', value: stockStatus.out },
      ].filter(item => item.value > 0);

      setCategoryData(categoryChartData);
      setStockStatusData(stockChartData);
      setStats({ 
        totalProducts, 
        activeProducts, 
        lowStock, 
        totalValue, 
        totalSales, 
        totalProfit,
        pendingOrders,
        completedOrders,
        totalOrders,
        topProduct,
        avgResponseTime: responseTime,
        systemStatus,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (authLoading || !user) return null;

  const StatCard = ({ icon: Icon, label, value, subtitle, gradient }: any) => (
    <Card className={`${gradient} p-4 rounded-2xl shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );

  const ChartCard = ({ title, data }: any) => (
    <Card className="p-5 rounded-2xl shadow-sm bg-card">
      <h3 className="font-semibold mb-3 text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-2">
        {data.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Dashboard" />

      <div className="p-4 space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Package}
            label="Total Produtos"
            value={stats.totalProducts}
            subtitle={`${stats.activeProducts} ativos`}
            gradient="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
          />
          <StatCard
            icon={AlertTriangle}
            label="Estoque Baixo"
            value={stats.lowStock}
            subtitle="Requer atenção"
            gradient="bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground"
          />
          <StatCard
            icon={TrendingUp}
            label="Valor Total"
            value={`R$ ${stats.totalValue.toFixed(0)}`}
            subtitle="Em estoque"
            gradient="bg-gradient-to-br from-chart-2 to-chart-2/80 text-white"
          />
          <StatCard
            icon={TrendingUp}
            label="Lucro Total"
            value={`R$ ${stats.totalProfit.toFixed(0)}`}
            subtitle={`${stats.totalSales} vendas`}
            gradient="bg-gradient-to-br from-chart-3 to-chart-3/80 text-white"
          />
        </div>

        {/* Orders Summary */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Clock}
            label="Pendentes"
            value={stats.pendingOrders}
            subtitle="Encomendas"
            gradient="bg-gradient-to-br from-chart-4 to-chart-4/80 text-white"
          />
          <StatCard
            icon={CheckCircle2}
            label="Concluídas"
            value={stats.completedOrders}
            subtitle="Encomendas"
            gradient="bg-gradient-to-br from-chart-1 to-chart-1/80 text-white"
          />
        </div>

        {/* New Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 rounded-2xl shadow-sm bg-gradient-to-br from-violet-500 to-violet-600 text-white">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm opacity-90">Quantidade de Encomendas</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs opacity-75">Total de pedidos</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 rounded-2xl shadow-sm bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm opacity-90">Item mais vendido</p>
                <p className="text-lg font-bold truncate">{stats.topProduct.name}</p>
                <p className="text-xs opacity-75">{stats.topProduct.quantity} vendidos</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 rounded-2xl shadow-sm bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm opacity-90">Tempo de resposta médio do sistema em ms</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime}</p>
                <p className="text-xs opacity-75">Milissegundos</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </Card>
          
          <Card className={`p-4 rounded-2xl shadow-sm ${
            stats.systemStatus === 'good' 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
              : stats.systemStatus === 'medium'
              ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
              : 'bg-gradient-to-br from-red-500 to-red-600'
          } text-white`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm opacity-90">Status de funcionamento do sistema</p>
                <p className="text-lg font-bold">
                  {stats.systemStatus === 'good' ? 'Bom' : stats.systemStatus === 'medium' ? 'Médio' : 'Ruim'}
                </p>
                <p className="text-xs opacity-75">
                  {stats.systemStatus === 'good' ? '(verde)' : stats.systemStatus === 'medium' ? '(amarelo)' : '(vermelho)'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        {categoryData.length > 0 && (
          <ChartCard title="Distribuição por Categoria" data={categoryData} />
        )}
        
        {stockStatusData.length > 0 && (
          <ChartCard title="Status do Estoque" data={stockStatusData} />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Card
            onClick={() => navigate("/orders")}
            className="p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-all bg-card"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium text-sm">Encomendas</span>
            </div>
          </Card>
          <Card
            onClick={() => navigate("/inventory")}
            className="p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-all bg-card"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-chart-2" />
              </div>
              <span className="font-medium text-sm">Estoque</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
