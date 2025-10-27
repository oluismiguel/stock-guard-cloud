import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("week");
  const [deliveryRate, setDeliveryRate] = useState(94.2);
  const [weeklyData, setWeeklyData] = useState([50, 80, 120, 90, 140, 180, 200]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchReportData = async () => {
      try {
        const { data: movements } = await supabase
          .from("stock_movements")
          .select("*")
          .order("created_at", { ascending: false });

        const totalMovements = movements?.length || 0;
        const successfulMovements = movements?.filter(m => m.movement_type === "entry").length || 0;
        const rate = totalMovements > 0 ? (successfulMovements / totalMovements) * 100 : 0;
        setDeliveryRate(Math.round(rate * 10) / 10);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching report data:", error);
        setLoading(false);
      }
    };

    fetchReportData();
  }, [user]);

  if (authLoading || !user) return null;

  const maxValue = Math.max(...weeklyData);
  const periodChange = selectedPeriod === "week" ? 2.1 : selectedPeriod === "month" ? 5.3 : 0.5;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Relatórios" />
      
      <div className="p-4 space-y-6 -mt-4">
        <Card className="bg-white rounded-3xl p-4 shadow-lg">
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("today")}
              className="flex-1 rounded-full"
            >
              Hoje
            </Button>
            <Button
              variant={selectedPeriod === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("week")}
              className="flex-1 rounded-full"
            >
              Semana
            </Button>
            <Button
              variant={selectedPeriod === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("month")}
              className="flex-1 rounded-full"
            >
              mês
            </Button>
          </div>
        </Card>

        <Card className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4">Desempenho Semanal</h3>
          
          <div className="mb-8">
            <div className="flex items-end justify-between gap-2 h-48 mb-2">
              {weeklyData.map((value, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative">
                    <div
                      className="w-full bg-primary rounded-t-lg transition-all"
                      style={{ height: `${(value / maxValue) * 180}px` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>S1</span>
              <span>S2</span>
              <span>S3</span>
              <span>S4</span>
              <span>S5</span>
              <span>S6</span>
              <span>S7</span>
            </div>
          </div>

          <div className="text-center pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-2">Taxa de Entrega</p>
            <div className="text-5xl font-bold text-primary mb-2">{deliveryRate}%</div>
            <div className="flex items-center justify-center gap-1 text-sm text-success">
              <span>↑</span>
              <span>{periodChange}% vs. Semana anterior</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-2xl border-2"
          >
            <span className="text-2xl">📊</span>
            <span className="text-xs">Vendas</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-2xl border-2"
          >
            <span className="text-2xl">📦</span>
            <span className="text-xs">Storage</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 rounded-2xl border-2"
          >
            <span className="text-2xl">🚚</span>
            <span className="text-xs">Entrega</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
