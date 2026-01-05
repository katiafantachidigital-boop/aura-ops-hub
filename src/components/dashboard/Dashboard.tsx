import { useEffect, useState } from "react";
import { DollarSign, Calendar, Users, TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";
import { TeamPerformance } from "./TeamPerformance";
import { RecentActivity } from "./RecentActivity";
import { QuickActions } from "./QuickActions";
import { GoalsProgress } from "./GoalsProgress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const stats = [
  {
    title: "Faturamento Mensal",
    value: "R$ 0",
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
    value: "0",
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

interface DashboardProps {
  onNavigate?: (module: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [isWeeklySupervisor, setIsWeeklySupervisor] = useState(false);

  useEffect(() => {
    const checkWeeklySupervisor = async () => {
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("weekly_supervisors")
        .select("id")
        .eq("user_id", user.id)
        .lte("week_start", today)
        .gte("week_end", today)
        .maybeSingle();

      setIsWeeklySupervisor(!!data);
    };

    checkWeeklySupervisor();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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
          <QuickActions onNavigate={onNavigate} isWeeklySupervisor={isWeeklySupervisor} />
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
