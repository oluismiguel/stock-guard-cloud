import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
}

const Products = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    current_stock: 0,
    minimum_stock: 10,
    maximum_stock: 1000,
    unit_price: 0,
    description: "",
    category: "Geral",
    location: "Estoque Principal",
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("products").insert([formData]);

      if (error) throw error;

      toast.success("Produto adicionado com sucesso!");
      setDialogOpen(false);
      setFormData({ 
        name: "", 
        sku: "", 
        current_stock: 0, 
        minimum_stock: 10,
        maximum_stock: 1000,
        unit_price: 0,
        description: "",
        category: "Geral",
        location: "Estoque Principal",
        is_active: true,
      });
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar produto");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Gestão de Estoque" />
      
      <div className="p-4 space-y-4 -mt-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-white rounded-xl border-0 shadow-md"
          />
        </div>

        {/* Product List */}
        <div className="space-y-3">
          {loading ? (
            <Card className="p-6 text-center text-muted-foreground">
              Carregando...
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              Nenhum produto encontrado
            </Card>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className="bg-white rounded-2xl p-5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{product.current_stock}</div>
                    <p className="text-xs text-muted-foreground">Unidades</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="stock">Quantidade Inicial</Label>
              <Input
                id="stock"
                type="number"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) })}
                required
              />
            </div>
            <Button type="submit" className="w-full">Adicionar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
