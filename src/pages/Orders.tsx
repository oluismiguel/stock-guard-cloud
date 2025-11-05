import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MobileHeader from "@/components/MobileHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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

interface Order {
  id: string;
  product_id: string;
  quantity: number;
  size?: string;
  status: string;
  notes?: string;
  created_at: string;
  products?: {
    name: string;
    sku: string;
  };
}

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(name, sku)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as encomendas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<{orderId: string; productId: string; quantity: number} | null>(null);

  const handleCompleteOrderClick = (orderId: string, productId: string, quantity: number) => {
    setOrderToComplete({ orderId, productId, quantity });
    setConfirmDialogOpen(true);
  };

  const handleCompleteOrder = async () => {
    if (!orderToComplete) return;
    
    const { orderId, productId, quantity } = orderToComplete;
    setConfirmDialogOpen(false);
    
    try {
      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("current_stock, name")
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      // Update product stock
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          current_stock: product.current_stock + quantity,
          updated_at: new Date().toISOString()
        })
        .eq("id", productId);

      if (updateError) throw updateError;

      // Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          status: "completed",
          delivered_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Log stock movement
      await supabase.from("stock_movements").insert({
        product_id: productId,
        movement_type: "entrada",
        quantity: quantity,
        previous_stock: product.current_stock,
        new_stock: product.current_stock + quantity,
        reason: "Encomenda recebida",
        created_by: user?.id,
      });

      toast({
        title: "Encomenda concluída",
        description: `${quantity} unidade(s) adicionada(s) ao estoque de ${product.name}`,
      });

      fetchOrders();
    } catch (error) {
      console.error("Error completing order:", error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir a encomenda",
        variant: "destructive",
      });
    } finally {
      setOrderToComplete(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Encomenda cancelada",
        description: "A encomenda foi cancelada com sucesso",
      });

      fetchOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a encomenda",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: { label: "Pendente", variant: "secondary", icon: Clock },
      completed: { label: "Concluída", variant: "default", icon: CheckCircle2 },
      cancelled: { label: "Cancelada", variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Encomendas" />

      <div className="p-4">
        <Card className="rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando encomendas...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma encomenda registrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.products?.name}</p>
                          <p className="text-xs text-muted-foreground">{order.products?.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>{order.size || "-"}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(order.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === "pending" && (
                           <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleCompleteOrderClick(order.id, order.product_id, order.quantity)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Encomenda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja confirmar esta encomenda? O estoque será atualizado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteOrder}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orders;
