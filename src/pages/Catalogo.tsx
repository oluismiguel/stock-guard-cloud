import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import MobileHeader from "@/components/MobileHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const Catalogo = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <div className="md:hidden">
            <MobileHeader 
              title="Catálogo de Produtos"
              subtitle="Visualize os produtos disponíveis"
            />
          </div>
          
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold text-foreground">Catálogo de Produtos</h1>
                <p className="text-muted-foreground">Visualize os produtos disponíveis</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Produtos Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Tamanho</TableHead>
                            <TableHead>Estoque</TableHead>
                            <TableHead className="text-right">Preço</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products?.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">
                                {product.name}
                              </TableCell>
                              <TableCell>{product.sku}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {product.category || "N/A"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {product.size || "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    product.current_stock <= product.minimum_stock
                                      ? "destructive"
                                      : "default"
                                  }
                                >
                                  {product.current_stock} unidades
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                R$ {product.sale_price?.toFixed(2) || "0.00"}
                              </TableCell>
                            </TableRow>
                          ))}
                          {!products?.length && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center text-muted-foreground py-8"
                              >
                                Nenhum produto disponível no momento
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Catalogo;
