import { useEffect, useState } from "react";
import { DollarSign, Calendar, Users, TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";
import { TeamPerformance } from "./TeamPerformance";
import { RecentActivity } from "./RecentActivity";
import { QuickActions } from "./QuickActions";
import { GoalsProgress } from "./GoalsProgress";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  monthlyRevenue: number;
  activeClients: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    monthlyRevenue: 0,
    activeClients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get current month boundaries
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Get monthly revenue from cash_register (the official source of truth)
      const { data: cashEntries } = await supabase
        .from("cash_register")
        .select("total_value, register_date")
        .gte("register_date", startOfMonth.toISOString().split('T')[0])
        .lte("register_date", endOfMonth.toISOString().split('T')[0]);

      let monthlyRevenue = 0;
      if (cashEntries) {
        monthlyRevenue = cashEntries.reduce((sum, entry) => sum + entry.total_value, 0);
      }

      // Get total active clients (all clients in the system)
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      setStats({
        monthlyRevenue,
        activeClients: clientsCount || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const statCards = [
    {
      title: "Faturamento Mensal",
      value: loading ? "..." : formatCurrency(stats.monthlyRevenue),
      change: "0%",
      changeType: "neutral" as const,
      icon: DollarSign,
      iconColor: "emerald" as const,
    },
    {
      title: "Agendamentos",
      value: "0",
      change: "0%",
      changeType: "neutral" as const,
      icon: Calendar,
      iconColor: "rose" as const,
    },
    {
      title: "Clientes Ativos",
      value: loading ? "..." : String(stats.activeClients),
      change: "0%",
      changeType: "neutral" as const,
      icon: Users,
      iconColor: "gold" as const,
    },
    {
      title: "Taxa de Retorno",
      value: "0%",
      change: "0%",
      changeType: "neutral" as const,
      icon: TrendingUp,
      iconColor: "lavender" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 100} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Team Performance */}
        <div className="lg:col-span-2">
          <TeamPerformance />
        </div>

        {/* Right Column - Quick Actions & Goals */}
        <div className="space-y-6">
          <QuickActions />
          <GoalsProgress />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1">
        <RecentActivity />
      </div>
    </div>
  );
}
