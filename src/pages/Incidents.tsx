import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Incident {
  id: string;
  product_id: string;
  incident_type: string;
  severity: string;
  quantity: number;
  description: string;
  resolution: string;
  status: string;
  created_at: string;
  products?: { name: string; sku: string };
}

const Incidents = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchIncidents();
  }, [user]);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select(`
          *,
          products (name, sku)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar ocorrências");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("incidents")
        .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
        .eq("id", id);

      if (error) throw error;
      toast.success("Status atualizado");
      fetchIncidents();
    } catch (error: any) {
      toast.error("Erro ao atualizar status");
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const typeLabels: Record<string, string> = {
    return: "Devolução",
    damage: "Avaria",
    loss: "Perda",
    theft: "Roubo",
    other: "Outro",
  };

  const severityColors: Record<string, string> = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    open: "Aberta",
    in_progress: "Em Andamento",
    resolved: "Resolvida",
    closed: "Fechada",
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Ocorrências</h1>
                <p className="text-muted-foreground">
                  Gerencie devoluções, avarias e outras ocorrências
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Ocorrência
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nova Ocorrência</DialogTitle>
                    <DialogDescription>
                      Registre uma nova ocorrência no estoque
                    </DialogDescription>
                  </DialogHeader>
                  <IncidentForm
                    onSuccess={() => {
                      setDialogOpen(false);
                      fetchIncidents();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : incidents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma ocorrência registrada
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {incidents.map((incident) => (
                <Card key={incident.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`mt-1 h-2 w-2 rounded-full ${
                            severityColors[incident.severity]
                          }`}
                        />
                        <div>
                          <CardTitle className="text-lg">
                            {typeLabels[incident.incident_type]} -{" "}
                            {incident.products?.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            SKU: {incident.products?.sku} • Quantidade: {incident.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={incident.status === "open" ? "destructive" : "default"}>
                          {statusLabels[incident.status]}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(incident.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-semibold text-sm mb-1">Descrição:</p>
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                    </div>
                    {incident.resolution && (
                      <div>
                        <p className="font-semibold text-sm mb-1">Resolução:</p>
                        <p className="text-sm text-muted-foreground">{incident.resolution}</p>
                      </div>
                    )}
                    {incident.status !== "closed" && (
                      <div className="flex gap-2">
                        <Select
                          defaultValue={incident.status}
                          onValueChange={(value) => updateStatus(incident.id, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Aberta</SelectItem>
                            <SelectItem value="in_progress">Em Andamento</SelectItem>
                            <SelectItem value="resolved">Resolvida</SelectItem>
                            <SelectItem value="closed">Fechada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

function IncidentForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    product_id: "",
    incident_type: "return",
    severity: "low",
    quantity: 1,
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku")
        .eq("is_active", true)
        .order("name");
      setProducts(data || []);
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("incidents")
        .insert({ ...formData, reported_by: user?.id });

      if (error) throw error;
      toast.success("Ocorrência registrada com sucesso");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar ocorrência");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product">Produto *</Label>
        <Select
          value={formData.product_id}
          onValueChange={(value) => setFormData({ ...formData, product_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} (SKU: {product.sku})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="incident_type">Tipo *</Label>
          <Select
            value={formData.incident_type}
            onValueChange={(value) => setFormData({ ...formData, incident_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="return">Devolução</SelectItem>
              <SelectItem value="damage">Avaria</SelectItem>
              <SelectItem value="loss">Perda</SelectItem>
              <SelectItem value="theft">Roubo</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="severity">Severidade *</Label>
          <Select
            value={formData.severity}
            onValueChange={(value) => setFormData({ ...formData, severity: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade *</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Registrando..." : "Registrar Ocorrência"}
      </Button>
    </form>
  );
}

export default Incidents;
