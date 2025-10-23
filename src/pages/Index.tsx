import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingDown, AlertTriangle, Activity } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  openIncidents: number;
  totalMovements: number;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    openIncidents: 0,
    totalMovements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const [productsRes, incidentsRes, movementsRes] = await Promise.all([
          supabase.from("products").select("id", { count: "exact" }),
          supabase.from("incidents").select("id", { count: "exact" }).eq("status", "open"),
          supabase.from("stock_movements").select("id", { count: "exact" }),
        ]);

        // Fetch low stock products separately with filter
        const { data: allProducts } = await supabase
          .from("products")
          .select("current_stock, minimum_stock");
        
        const lowStockCount = allProducts?.filter(
          (p) => p.current_stock <= p.minimum_stock
        ).length || 0;

        setStats({
          totalProducts: productsRes.count || 0,
          lowStockProducts: lowStockCount,
          openIncidents: incidentsRes.count || 0,
          totalMovements: movementsRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Visão geral do seu estoque</p>
              </div>
            </div>
            <NotificationBell />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.totalProducts}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Produtos cadastrados
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <TrendingDown className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-warning">{stats.lowStockProducts}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Produtos abaixo do mínimo
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ocorrências Abertas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-destructive">{stats.openIncidents}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requerem atenção
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
                <Activity className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.totalMovements}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total de operações
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Produtos com Estoque Baixo</CardTitle>
                <CardDescription>
                  Produtos que precisam de reposição urgente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LowStockProducts />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas Movimentações</CardTitle>
                <CardDescription>
                  Histórico recente de entradas e saídas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentMovements />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

function LowStockProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStock = async () => {
      const { data } = await supabase
        .from("products")
        .select("name, sku, current_stock, minimum_stock")
        .order("current_stock", { ascending: true });

      const lowStock = data?.filter(
        (p) => p.current_stock <= p.minimum_stock
      ).slice(0, 5) || [];

      setProducts(lowStock);
      setLoading(false);
    };

    fetchLowStock();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhum produto com estoque baixo
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div
          key={product.sku}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
        >
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-warning">{product.current_stock}</p>
            <p className="text-xs text-muted-foreground">Mín: {product.minimum_stock}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentMovements() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      const { data } = await supabase
        .from("stock_movements")
        .select(`
          *,
          products (name, sku)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      setMovements(data || []);
      setLoading(false);
    };

    fetchMovements();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhuma movimentação registrada
      </p>
    );
  }

  const typeLabels = {
    entry: "Entrada",
    exit: "Saída",
    adjustment: "Ajuste",
  };

  return (
    <div className="space-y-3">
      {movements.map((movement) => (
        <div
          key={movement.id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
        >
          <div>
            <p className="font-medium">{movement.products?.name}</p>
            <p className="text-sm text-muted-foreground">
              {typeLabels[movement.movement_type as keyof typeof typeLabels]}
            </p>
          </div>
          <div className="text-right">
            <p className={`font-bold ${movement.movement_type === 'entry' ? 'text-success' : 'text-destructive'}`}>
              {movement.movement_type === 'entry' ? '+' : '-'}{Math.abs(movement.quantity)}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(movement.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Index;
