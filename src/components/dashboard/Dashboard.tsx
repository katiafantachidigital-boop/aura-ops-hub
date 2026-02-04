import { useEffect, useState } from "react";
import { DollarSign, Calendar, Users, TrendingUp, MapPin } from "lucide-react";
import { StatCard } from "./StatCard";
import { TeamPerformance } from "./TeamPerformance";
import { RecentActivity } from "./RecentActivity";
import { QuickActions } from "./QuickActions";
import { GoalsProgress } from "./GoalsProgress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  monthlyRevenue: number;
  monthlyRevenueBatel: number;
  monthlyRevenueCapaoRaso: number;
  activeClients: number;
}

const clinicLabels: Record<string, string> = {
  capao_raso: "Capão Raso",
  batel: "Batel",
};

export function Dashboard() {
  const { isManager, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    monthlyRevenue: 0,
    monthlyRevenueBatel: 0,
    monthlyRevenueCapaoRaso: 0,
    activeClients: 0,
  });
  const [loading, setLoading] = useState(true);

  const userClinic = profile?.clinic;

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
        .select("total_value, register_date, clinic")
        .gte("register_date", startOfMonth.toISOString().split('T')[0])
        .lte("register_date", endOfMonth.toISOString().split('T')[0]);

      let monthlyRevenue = 0;
      let monthlyRevenueBatel = 0;
      let monthlyRevenueCapaoRaso = 0;
      
      if (cashEntries) {
        monthlyRevenue = cashEntries.reduce((sum, entry) => sum + entry.total_value, 0);
        monthlyRevenueBatel = cashEntries
          .filter(entry => entry.clinic === 'batel')
          .reduce((sum, entry) => sum + entry.total_value, 0);
        monthlyRevenueCapaoRaso = cashEntries
          .filter(entry => entry.clinic === 'capao_raso')
          .reduce((sum, entry) => sum + entry.total_value, 0);
      }

      // Get total active clients (all clients in the system)
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      setStats({
        monthlyRevenue,
        monthlyRevenueBatel,
        monthlyRevenueCapaoRaso,
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

  // Get the revenue value based on user's role and clinic
  const getRevenueDisplay = () => {
    if (isManager) {
      return null; // Will show separate cards
    }
    // For supervisors, show only their clinic's revenue
    if (userClinic === 'batel') {
      return stats.monthlyRevenueBatel;
    } else if (userClinic === 'capao_raso') {
      return stats.monthlyRevenueCapaoRaso;
    }
    return stats.monthlyRevenue;
  };

  const singleRevenueValue = getRevenueDisplay();

  const baseStatCards = [
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
      {isManager ? (
        // Manager sees both clinics' revenue separately
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              title="Faturamento Batel"
              value={loading ? "..." : formatCurrency(stats.monthlyRevenueBatel)}
              change="0%"
              changeType="neutral"
              icon={DollarSign}
              iconColor="emerald"
              delay={0}
            />
            <StatCard
              title="Faturamento Capão Raso"
              value={loading ? "..." : formatCurrency(stats.monthlyRevenueCapaoRaso)}
              change="0%"
              changeType="neutral"
              icon={DollarSign}
              iconColor="emerald"
              delay={100}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {baseStatCards.map((stat, index) => (
              <StatCard key={stat.title} {...stat} delay={(index + 2) * 100} />
            ))}
          </div>
        </>
      ) : (
        // Non-managers see single revenue for their clinic
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={userClinic ? `Faturamento ${clinicLabels[userClinic]}` : "Faturamento Mensal"}
            value={loading ? "..." : formatCurrency(singleRevenueValue ?? 0)}
            change="0%"
            changeType="neutral"
            icon={DollarSign}
            iconColor="emerald"
            delay={0}
          />
          {baseStatCards.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={(index + 1) * 100} />
          ))}
        </div>
      )}

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
