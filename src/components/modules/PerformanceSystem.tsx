import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  BarChart3,
  Users,
  Star,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  kpis: {
    attendance: number;
    punctuality: number;
    productivity: number;
    satisfaction: number;
    goals: number;
  };
  trend: "up" | "down" | "stable";
  overallScore: number;
}

const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Carla Mendes",
    role: "Esteticista Sênior",
    avatar: "CM",
    kpis: { attendance: 100, punctuality: 98, productivity: 96, satisfaction: 98, goals: 105 },
    trend: "up",
    overallScore: 99,
  },
  {
    id: "2",
    name: "Juliana Santos",
    role: "Esteticista",
    avatar: "JS",
    kpis: { attendance: 95, punctuality: 92, productivity: 88, satisfaction: 94, goals: 92 },
    trend: "up",
    overallScore: 92,
  },
  {
    id: "3",
    name: "Patricia Lima",
    role: "Esteticista",
    avatar: "PL",
    kpis: { attendance: 90, punctuality: 85, productivity: 82, satisfaction: 88, goals: 78 },
    trend: "stable",
    overallScore: 85,
  },
  {
    id: "4",
    name: "Fernanda Costa",
    role: "Esteticista Jr.",
    avatar: "FC",
    kpis: { attendance: 88, punctuality: 80, productivity: 75, satisfaction: 82, goals: 70 },
    trend: "down",
    overallScore: 79,
  },
];

const kpiLabels = {
  attendance: "Assiduidade",
  punctuality: "Pontualidade",
  productivity: "Produtividade",
  satisfaction: "Satisfação Cliente",
  goals: "Metas",
};

export function PerformanceSystem() {
  const avgScore = Math.round(teamMembers.reduce((acc, m) => acc + m.overallScore, 0) / teamMembers.length);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="stat" className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Médio</p>
                <p className="text-2xl font-bold">{avgScore}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-light flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-emerald" />
              </div>
            </div>
            <Progress value={avgScore} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Destaque</p>
                <p className="text-lg font-bold">Carla M.</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gold-light flex items-center justify-center">
                <Award className="h-6 w-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acima da Meta</p>
                <p className="text-2xl font-bold text-emerald">3</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-light flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requer Atenção</p>
                <p className="text-2xl font-bold text-destructive">1</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teamMembers.map((member, index) => (
          <Card 
            key={member.id} 
            variant="glass" 
            className="animate-fade-in"
            style={{ animationDelay: `${400 + index * 100}ms` }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center font-semibold",
                    index === 0 ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}>
                    {member.avatar}
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {member.name}
                      {member.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald" />}
                      {member.trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-2xl font-bold",
                    member.overallScore >= 90 ? "text-emerald" : 
                    member.overallScore >= 80 ? "text-gold" : "text-destructive"
                  )}>
                    {member.overallScore}%
                  </p>
                  <p className="text-xs text-muted-foreground">Score Geral</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(member.kpis).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{kpiLabels[key as keyof typeof kpiLabels]}</span>
                    <span className={cn(
                      "font-medium",
                      value >= 90 ? "text-emerald" : value >= 80 ? "text-gold" : "text-destructive"
                    )}>
                      {value}%
                    </span>
                  </div>
                  <Progress value={value} className="h-1.5" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Detalhes
                </Button>
                <Button size="sm" className="flex-1">
                  Dar Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
