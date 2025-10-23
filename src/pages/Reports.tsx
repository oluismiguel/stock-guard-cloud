import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { FileDown, TrendingUp, TrendingDown, Package } from "lucide-react";
import { toast } from "sonner";

interface ReportData {
  topProducts: Array<{ name: string; sku: string; movements: number }>;
  stockTurnover: number;
  totalEntries: number;
  totalExits: number;
  recentMovements: Array<{
    product_name: string;
    movement_type: string;
    quantity: number;
    created_at: string;
  }>;
}

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchReportData();
  }, [user]);

  const fetchReportData = async () => {
    try {
      // Fetch stock movements for analysis
      const { data: movements } = await supabase
        .from("stock_movements")
        .select(`
          *,
          products (name, sku)
        `)
        .order("created_at", { ascending: false });

      if (!movements) {
        setLoading(false);
        return;
      }

      // Calculate top products by movement count
      const productMovements = movements.reduce((acc: any, mov: any) => {
        const key = mov.product_id;
        if (!acc[key]) {
          acc[key] = {
            name: mov.products?.name || "N/A",
            sku: mov.products?.sku || "N/A",
            movements: 0,
          };
        }
        acc[key].movements++;
        return acc;
      }, {});

      const topProducts = Object.values(productMovements)
        .sort((a: any, b: any) => b.movements - a.movements)
        .slice(0, 10);

      // Calculate entries and exits
      const totalEntries = movements.filter((m) => m.movement_type === "entry").length;
      const totalExits = movements.filter((m) => m.movement_type === "exit").length;

      // Format recent movements
      const recentMovements = movements.slice(0, 20).map((m: any) => ({
        product_name: m.products?.name || "N/A",
        movement_type: m.movement_type,
        quantity: m.quantity,
        created_at: m.created_at,
      }));

      setReportData({
        topProducts: topProducts as any,
        stockTurnover: totalExits > 0 ? (totalExits / (totalEntries || 1)) * 100 : 0,
        totalEntries,
        totalExits,
        recentMovements,
      });
    } catch (error: any) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csv = [
      ["Produto", "SKU", "Movimentações"],
      ...reportData.topProducts.map((p) => [p.name, p.sku, p.movements]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-estoque-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Relatório exportado com sucesso");
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
                <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
                <p className="text-muted-foreground">
                  Análise de desempenho e movimentações
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button onClick={exportToCSV} disabled={!reportData}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Gerando relatório...</div>
          ) : !reportData ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum dado disponível para relatório
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Giro de Estoque</CardTitle>
                    <Package className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reportData.stockTurnover.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Taxa de movimentação
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {reportData.totalEntries}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Movimentações</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {reportData.totalExits}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Movimentações</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Movimentados</CardTitle>
                  <CardDescription>
                    Top 10 produtos com mais entradas e saídas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.topProducts.map((product, index) => (
                      <div
                        key={product.sku}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              SKU: {product.sku}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{product.movements}</p>
                          <p className="text-xs text-muted-foreground">movimentações</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico Recente de Movimentações</CardTitle>
                  <CardDescription>Últimas 20 movimentações registradas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportData.recentMovements.map((movement, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{movement.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {movement.movement_type === "entry" ? "Entrada" : "Saída"} •{" "}
                            {new Date(movement.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <p
                          className={`font-bold ${
                            movement.movement_type === "entry"
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {movement.movement_type === "entry" ? "+" : "-"}
                          {movement.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reports;
