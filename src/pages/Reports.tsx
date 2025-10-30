import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
  profit: number;
  sale_date: string;
  product_id: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  product_type: string;
  current_stock: number;
}

const COLORS = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [periodType, setPeriodType] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, periodType, selectedDate]);

  const fetchData = async () => {
    try {
      let startDate: Date;
      let endDate: Date;

      switch (periodType) {
        case "daily":
          startDate = startOfDay(selectedDate);
          endDate = endOfDay(selectedDate);
          break;
        case "monthly":
          startDate = startOfMonth(selectedDate);
          endDate = endOfMonth(selectedDate);
          break;
        case "yearly":
          startDate = startOfYear(selectedDate);
          endDate = endOfYear(selectedDate);
          break;
      }

      const { data: salesData } = await supabase
        .from("sales")
        .select("*")
        .gte("sale_date", startDate.toISOString())
        .lte("sale_date", endDate.toISOString());

      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, product_type, current_stock");

      const { data: movementsData } = await supabase
        .from("stock_movements")
        .select("*, products(name)")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      setSales(salesData || []);
      setProducts(productsData || []);
      setStockMovements(movementsData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setLoading(false);
    }
  };

  const getFilteredSales = () => {
    let filtered = sales;
    
    if (filterProduct !== "all") {
      filtered = filtered.filter(s => s.product_id === filterProduct);
    }
    
    if (filterType !== "all") {
      const productsOfType = products.filter(p => p.product_type === filterType).map(p => p.id);
      filtered = filtered.filter(s => productsOfType.includes(s.product_id));
    }
    
    return filtered;
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    if (filterProduct !== "all") {
      filtered = filtered.filter(p => p.id === filterProduct);
    }
    
    if (filterType !== "all") {
      filtered = filtered.filter(p => p.product_type === filterType);
    }
    
    return filtered;
  };

  const getSalesChartData = () => {
    const filteredSales = getFilteredSales();
    const salesByProduct = filteredSales.reduce((acc, sale) => {
      const product = products.find(p => p.id === sale.product_id);
      const productName = product?.name || "Desconhecido";
      
      if (!acc[productName]) {
        acc[productName] = 0;
      }
      acc[productName] += sale.quantity;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(salesByProduct).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getStockPercentageData = () => {
    const filteredProducts = getFilteredProducts();
    const totalStock = filteredProducts.reduce((sum, p) => sum + p.current_stock, 0);
    
    const data = filteredProducts.map(product => ({
      name: product.name,
      value: totalStock > 0 ? (product.current_stock / totalStock) * 100 : 0,
    }));

    // Ensure values are between 0 and 100
    return data.map(item => ({
      ...item,
      value: Math.min(100, Math.max(0, item.value))
    }));
  };

  const getProfitChartData = () => {
    const filteredSales = getFilteredSales();
    const profitByProduct = filteredSales.reduce((acc, sale) => {
      const product = products.find(p => p.id === sale.product_id);
      const productName = product?.name || "Desconhecido";
      
      if (!acc[productName]) {
        acc[productName] = 0;
      }
      acc[productName] += sale.profit;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(profitByProduct).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));
  };

  const getTotalProfit = () => {
    const filteredSales = getFilteredSales();
    return filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
  };

  const exportToPDF = async (tableData: any[], filename: string, headers: string[]) => {
    try {
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...tableData.map(row => headers.map(h => {
          const value = row[h.toLowerCase().replace(/ /g, '_')];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const uniqueTypes = [...new Set(products.map(p => p.product_type).filter(Boolean))];

  if (authLoading || !user) return null;

  const salesData = getSalesChartData();
  const stockData = getStockPercentageData();
  const profitData = getProfitChartData();

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Relatórios" />

      <div className="p-4 space-y-6 -mt-4">
        <Card className="bg-white rounded-3xl p-4 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4">Filtros</h3>
          
          <div className="space-y-4">
            <div>
              <Label>Período</Label>
              <Select value={periodType} onValueChange={(v: any) => setPeriodType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filtrar por Produto</Label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Produtos</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filtrar por Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Vendas por Produto</h3>
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={salesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {salesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">% de Estoque por Produto</h3>
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={stockData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {stockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Lucro por Produto</h3>
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Lucro Total</p>
            <div className="text-4xl font-bold text-green-600">
              R$ {getTotalProfit().toFixed(2)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={profitData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: R$ ${entry.value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {profitData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Relatórios Detalhados */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-foreground">Relatórios Detalhados</h2>

          {/* Relatório de Vendas */}
          <Card className="p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Transações de Vendas</h3>
              <Button
                size="sm"
                onClick={() => exportToPDF(
                  sales.map(s => ({
                    produto: products.find(p => p.id === s.product_id)?.name || 'N/A',
                    quantidade: s.quantity,
                    lucro: `R$ ${s.profit.toFixed(2)}`,
                    data: format(new Date(s.sale_date), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  })),
                  'vendas',
                  ['Produto', 'Quantidade', 'Lucro', 'Data']
                )}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.slice(0, 10).map((sale, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{products.find(p => p.id === sale.product_id)?.name || 'N/A'}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell className="text-green-600 font-medium">R$ {sale.profit.toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Relatório de Movimentações */}
          <Card className="p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Modificações no Estoque</h3>
              <Button
                size="sm"
                onClick={() => exportToPDF(
                  stockMovements.map(m => ({
                    produto: m.products?.name || 'N/A',
                    tipo: m.movement_type === 'entrada' ? 'Entrada' : 'Saída',
                    quantidade: m.quantity,
                    motivo: m.reason || '-',
                    data: format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  })),
                  'movimentacoes',
                  ['Produto', 'Tipo', 'Quantidade', 'Motivo', 'Data']
                )}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.slice(0, 10).map((movement, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{movement.products?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={movement.movement_type === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                          {movement.movement_type === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{movement.reason || '-'}</TableCell>
                      <TableCell>{format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Status do Sistema */}
          <Card className="p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Status do Sistema</h3>
              <Button
                size="sm"
                onClick={() => exportToPDF(
                  products.map(p => ({
                    nome: p.name,
                    estoque: p.current_stock,
                    tipo: p.product_type,
                    status: p.current_stock === 0 ? 'Esgotado' : p.current_stock < 10 ? 'Baixo' : 'Normal'
                  })),
                  'status-sistema',
                  ['Nome', 'Estoque', 'Tipo', 'Status']
                )}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.slice(0, 10).map((product, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.current_stock}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{product.product_type}</TableCell>
                      <TableCell>
                        <span className={
                          product.current_stock === 0 ? 'text-red-600' :
                          product.current_stock < 10 ? 'text-yellow-600' :
                          'text-green-600'
                        }>
                          {product.current_stock === 0 ? 'Esgotado' : product.current_stock < 10 ? 'Baixo' : 'Normal'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
