import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalDeliveries: number;
  delayed: number;
  successRate: number;
  weeklyData: number[];
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalDeliveries: 0,
    delayed: 0,
    successRate: 0,
    weeklyData: [50, 80, 120, 90, 140, 180, 200],
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [movementsRes, incidentsRes] = await Promise.all([
          supabase.from("stock_movements").select("*").order("created_at", { ascending: false }),
          supabase.from("incidents").select("*").order("created_at", { ascending: false }).limit(4),
        ]);

        const movements = movementsRes.data || [];
        const totalDeliveries = movements.filter(m => m.movement_type === "entry").length;
        const delayed = incidentsRes.data?.filter(i => i.status === "open").length || 0;
        const successRate = totalDeliveries > 0 ? Math.round(((totalDeliveries - delayed) / totalDeliveries) * 100) : 0;

        setStats({
          totalDeliveries,
          delayed,
          successRate,
          weeklyData: [50, 80, 120, 90, 140, 180, 200],
        });

        setRecentAlerts(incidentsRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (authLoading || !user) return null;

  const maxValue = Math.max(...stats.weeklyData);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Dashboard" subtitle={format(new Date(), "d 'de' MMMM, yyyy", { locale: ptBR })} />
      
      <div className="p-4 space-y-6 -mt-4">
        {/* Stats Cards */}
        <Card className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{stats.totalDeliveries}</div>
              <div className="text-xs text-muted-foreground mt-1">Entregas<br/>Hoje</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-destructive">{stats.delayed}</div>
              <div className="text-xs text-muted-foreground mt-1">Em Atraso</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success">{stats.successRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">Taxa de Sucesso</div>
            </div>
          </div>
        </Card>

        {/* Deliveries by Status */}
        <Card className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4">Entregas por Status</h3>
          <div className="flex items-center justify-between gap-6">
            {/* Pie Chart Representation */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="20" strokeDasharray="75 100" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#fbbf24" strokeWidth="20" strokeDasharray="15 100" strokeDashoffset="-75" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="20" strokeDasharray="10 100" strokeDashoffset="-90" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">{stats.totalDeliveries}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>

            {/* Legend & Line Chart */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <span>Entrega</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <span>Em Atraso</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span>Pendentes</span>
                </div>
              </div>

              {/* Mini Bar Chart */}
              <div>
                <p className="text-xs font-semibold mb-2">Entregas Semanais</p>
                <div className="flex items-end gap-1 h-16">
                  {stats.weeklyData.map((value, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-primary rounded-t"
                      style={{ height: `${(value / maxValue) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Semana 1</span>
                  <span>Semana 4</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4">Alertas Recentes</h3>
          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum alerta recente</p>
            ) : (
              recentAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  {alert.type === "return" ? (
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  ) : alert.status === "resolved" ? (
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-primary mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(alert.created_at), "dd/MM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
