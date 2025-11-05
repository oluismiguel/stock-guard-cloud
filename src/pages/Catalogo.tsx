import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
  id: string;
  name: string;
  description: string | null;
  sale_price: number;
  current_stock: number;
  image_url: string | null;
  category: string | null;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
}

const Catalogo = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [productImages, setProductImages] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const productsData = data || [];
      setProducts(productsData);
      
      // Fetch images for all products
      if (productsData.length > 0) {
        const productIds = productsData.map(p => p.id);
        const { data: imagesData, error: imagesError } = await supabase
          .from('product_images')
          .select('*')
          .in('product_id', productIds)
          .order('display_order');

        if (!imagesError && imagesData) {
          const imagesByProduct: Record<string, string[]> = {};
          imagesData.forEach((img: ProductImage) => {
            if (!imagesByProduct[img.product_id]) {
              imagesByProduct[img.product_id] = [];
            }
            imagesByProduct[img.product_id].push(img.image_url);
          });
          setProductImages(imagesByProduct);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1e3a8a] to-[#0f172a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] to-[#0f172a]">
      {/* Header */}
      <header className="bg-[#0f172a]/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-black text-2xl tracking-wider">
              D-DIK SPORTS
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={user?.email || ''} />
                    <AvatarFallback className="bg-white/10 text-white">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Minha Conta</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Catálogo de Produtos</h2>
          <p className="text-white/70">Confira nossos produtos disponíveis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardHeader>
                <ImageCarousel 
                  images={productImages[product.id] || (product.image_url ? [product.image_url] : [])}
                  alt={product.name}
                  autoRotate={true}
                  interval={3000}
                />
                <CardTitle className="text-white text-lg">{product.name}</CardTitle>
                {product.description && (
                  <CardDescription className="text-white/70 line-clamp-2">
                    {product.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      R$ {product.sale_price.toFixed(2)}
                    </p>
                    <p className="text-sm text-white/60">
                      {product.current_stock > 0 ? (
                        <>
                          {product.current_stock} {product.current_stock === 1 ? 'unidade' : 'unidades'}
                        </>
                      ) : (
                        <span className="text-red-300">Esgotado</span>
                      )}
                    </p>
                  </div>
                  {product.current_stock <= 5 && product.current_stock > 0 && (
                    <Badge variant="destructive" className="bg-red-500/20 text-red-200 border-red-500/30">
                      Últimas unidades!
                    </Badge>
                  )}
                </div>
                {product.category && (
                  <Badge variant="outline" className="mt-3 border-white/30 text-white/80">
                    {product.category}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg">Nenhum produto disponível no momento.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalogo;
