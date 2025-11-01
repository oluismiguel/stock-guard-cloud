import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, User } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import UserProfile from "@/components/UserProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const Catalogo = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("profile_picture_url")
        .eq("id", user?.id)
        .single();

      if (data?.profile_picture_url) {
        setProfilePicture(data.profile_picture_url);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

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
    <>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="min-h-screen w-full flex" style={{ 
          background: 'linear-gradient(to bottom, hsl(220 80% 15%), hsl(220 70% 25%))'
        }}>
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            {/* Custom Header for Catalogo */}
            <div className="px-4 py-6 pb-8" style={{ 
              background: 'linear-gradient(to bottom, hsl(220 80% 15%), hsl(220 70% 20%))'
            }}>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold" style={{ color: 'hsl(0 0% 95%)' }}>
                  Catálogo de Produtos
                </h1>
                
                <div className="flex gap-2 items-center">
                  <NotificationBell />
                  <button
                    onClick={() => setProfileOpen(true)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profilePicture || undefined} />
                      <AvatarFallback style={{ background: 'hsl(0 0% 100% / 0.2)' }}>
                        <User className="w-4 h-4" style={{ color: 'hsl(0 0% 95%)' }} />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </div>
              </div>
              <p className="text-sm" style={{ color: 'hsl(0 0% 85%)' }}>
                Produtos disponíveis na loja
              </p>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <Card style={{ 
                background: 'hsl(0 0% 95%)',
                border: 'none'
              }}>
                <CardHeader>
                  <CardTitle style={{ color: 'hsl(220 80% 15%)' }}>
                    Produtos Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(220 80% 15%)' }} />
                    </div>
                  ) : products && products.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead style={{ color: 'hsl(220 80% 15%)' }}>Nome</TableHead>
                          <TableHead style={{ color: 'hsl(220 80% 15%)' }}>SKU</TableHead>
                          <TableHead style={{ color: 'hsl(220 80% 15%)' }}>Categoria</TableHead>
                          <TableHead style={{ color: 'hsl(220 80% 15%)' }}>Tamanho</TableHead>
                          <TableHead style={{ color: 'hsl(220 80% 15%)' }}>Estoque</TableHead>
                          <TableHead style={{ color: 'hsl(220 80% 15%)' }}>Preço</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium" style={{ color: 'hsl(220 80% 15%)' }}>
                              {product.name}
                            </TableCell>
                            <TableCell style={{ color: 'hsl(220 80% 15%)' }}>
                              {product.sku}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" style={{ 
                                borderColor: 'hsl(220 80% 15%)', 
                                color: 'hsl(220 80% 15%)' 
                              }}>
                                {product.category}
                              </Badge>
                            </TableCell>
                            <TableCell style={{ color: 'hsl(220 80% 15%)' }}>
                              {product.size || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={product.current_stock <= 5 ? "destructive" : "default"}
                                style={product.current_stock > 5 ? { 
                                  background: 'hsl(220 80% 15%)',
                                  color: 'hsl(0 0% 95%)'
                                } : undefined}
                              >
                                {product.current_stock} un.
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold" style={{ color: 'hsl(220 80% 15%)' }}>
                              R$ {product.sale_price?.toFixed(2) || "0.00"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8" style={{ color: 'hsl(220 80% 15% / 0.6)' }}>
                      Nenhum produto disponível no momento.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarProvider>
      
      <UserProfile open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
};

export default Catalogo;
