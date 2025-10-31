import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Package2 } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  product_type: string;
  purchase_price: number;
  sale_price: number;
  size: string;
  minimum_stock: number;
  maximum_stock: number;
}

const Products = () => {
  const { user, loading: authLoading } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [removeQuantityDialogOpen, setRemoveQuantityDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wasSold, setWasSold] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderSize, setOrderSize] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [removeQuantity, setRemoveQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    product_type: "",
    size: "",
    current_stock: 0,
    minimum_stock: 10,
    maximum_stock: 1000,
    purchase_price: 0,
    sale_price: 0,
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
        product_type: "",
        size: "",
        current_stock: 0,
        minimum_stock: 10,
        maximum_stock: 1000,
        purchase_price: 0,
        sale_price: 0,
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

  const handleDeleteClick = (product: Product) => {
    if (product.current_stock <= 0) {
      setSelectedProduct(product);
      setDeleteDialogOpen(true);
      return;
    }
    setSelectedProduct(product);
    setRemoveQuantityDialogOpen(true);
  };

  const handleOrderClick = (product: Product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setOrderSize(product.size);
    setOrderNotes("");
    setOrderDialogOpen(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase.from("orders").insert({
        product_id: selectedProduct.id,
        quantity: orderQuantity,
        size: orderSize,
        notes: orderNotes,
        status: "pending",
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Encomenda criada com sucesso!");
      setOrderDialogOpen(false);
      setSelectedProduct(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar encomenda");
    }
  };

  const handleRemoveQuantityConfirm = () => {
    setRemoveQuantityDialogOpen(false);
    setSaleDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    if (selectedProduct && selectedProduct.current_stock <= 0) {
      // Permanently delete product
      handlePermanentDelete();
    } else {
      setSaleDialogOpen(true);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      await supabase
        .from("products")
        .delete()
        .eq("id", selectedProduct.id);

      toast.success("Produto removido permanentemente!");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover produto");
    } finally {
      setSelectedProduct(null);
    }
  };

  const handleSaleResponse = (sold: boolean) => {
    setWasSold(sold);
    setSaleDialogOpen(false);
    
    if (sold) {
      setDiscountDialogOpen(true);
    } else {
      finalizeRemoval(0);
    }
  };

  const handleDiscountSubmit = () => {
    setDiscountDialogOpen(false);
    finalizeRemoval(discount);
  };

  const finalizeRemoval = async (discountValue: number) => {
    if (!selectedProduct) return;

    try {
      if (wasSold) {
        const finalPrice = selectedProduct.sale_price * (1 - discountValue / 100);
        const profit = (finalPrice - selectedProduct.purchase_price) * removeQuantity;

        await supabase.from("sales").insert({
          product_id: selectedProduct.id,
          quantity: removeQuantity,
          sale_price: finalPrice,
          purchase_price: selectedProduct.purchase_price,
          discount: discountValue,
          profit: profit,
          created_by: user?.id,
        });
      }

      const newStock = Math.max(0, selectedProduct.current_stock - removeQuantity);

      await supabase
        .from("products")
        .update({ current_stock: newStock })
        .eq("id", selectedProduct.id);

      await supabase.from("stock_movements").insert({
        product_id: selectedProduct.id,
        movement_type: "saida",
        quantity: removeQuantity,
        previous_stock: selectedProduct.current_stock,
        new_stock: newStock,
        reason: wasSold ? "Venda" : "Remoção",
        created_by: user?.id,
      });

      toast.success(wasSold ? "Venda registrada com sucesso!" : "Itens removidos com sucesso!");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar remoção");
    } finally {
      setSelectedProduct(null);
      setWasSold(false);
      setDiscount(0);
      setRemoveQuantity(1);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Gestão de Estoque" />

      <div className="p-4 space-y-4 -mt-4">
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    <p className="text-sm text-muted-foreground">Tipo: {product.product_type}</p>
                    <p className="text-sm text-muted-foreground">Tamanho: {product.size}</p>
                    <div className="mt-2 flex gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Compra</p>
                        <p className="text-sm font-semibold">R$ {product.purchase_price?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Venda</p>
                        <p className="text-sm font-semibold text-green-600">
                          R$ {product.sale_price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-primary">{product.current_stock}</div>
                    <p className="text-xs text-muted-foreground">Unidades</p>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOrderClick(product)}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Package2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(product)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {role === "admin" && (
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl"
              size="icon"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="product_type">Tipo</Label>
              <Input
                id="product_type"
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="size">Tamanho</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase_price">Preço de Compra</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="sale_price">Preço de Venda</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) =>
                    setFormData({ ...formData, sale_price: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stock">Quantidade Inicial</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) =>
                    setFormData({ ...formData, current_stock: parseInt(e.target.value) })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="min_stock">Qtd. Mínima</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.minimum_stock}
                  onChange={(e) =>
                    setFormData({ ...formData, minimum_stock: parseInt(e.target.value) })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="max_stock">Qtd. Máxima</Label>
                <Input
                  id="max_stock"
                  type="number"
                  value={formData.maximum_stock}
                  onChange={(e) =>
                    setFormData({ ...formData, maximum_stock: parseInt(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Adicionar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedProduct?.current_stock && selectedProduct.current_stock <= 0 
                ? "Remover Produto Permanentemente?" 
                : "Confirmar Remoção"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedProduct?.current_stock && selectedProduct.current_stock <= 0
                ? `O produto "${selectedProduct?.name}" está sem estoque. Deseja removê-lo permanentemente do sistema?`
                : `Tem certeza que deseja remover uma unidade de "${selectedProduct?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {selectedProduct?.current_stock && selectedProduct.current_stock <= 0 ? "Remover Permanentemente" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Item Vendido?</AlertDialogTitle>
            <AlertDialogDescription>
              Este item foi vendido ou apenas removido do estoque?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleSaleResponse(false)}>
              Apenas Removido
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSaleResponse(true)}>
              Foi Vendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconto Aplicado?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="discount">Desconto (%)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value))}
            />
            <Button onClick={handleDiscountSubmit} className="w-full">
              Confirmar Venda
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Encomenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="order-quantity">Quantidade</Label>
              <Input
                id="order-quantity"
                type="number"
                min="1"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="order-size">Tamanho</Label>
              <Input
                id="order-size"
                value={orderSize}
                onChange={(e) => setOrderSize(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="order-notes">Observações</Label>
              <Input
                id="order-notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Adicione observações (opcional)"
              />
            </div>
            <Button onClick={handleCreateOrder} className="w-full">
              Criar Encomenda
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeQuantityDialogOpen} onOpenChange={setRemoveQuantityDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quantidade a Remover</AlertDialogTitle>
            <AlertDialogDescription>
              Quantas unidades de "{selectedProduct?.name}" deseja remover?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="remove-qty">Quantidade</Label>
            <Input
              id="remove-qty"
              type="number"
              min="1"
              max={selectedProduct?.current_stock || 1}
              value={removeQuantity}
              onChange={(e) => setRemoveQuantity(parseInt(e.target.value))}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveQuantityConfirm}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Products;
