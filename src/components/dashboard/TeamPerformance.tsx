import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  performance: number;
  trend: "up" | "down" | "stable";
  appointments: number;
  revenue: string;
}

const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Carla Mendes",
    role: "Esteticista Sênior",
    avatar: "CM",
    performance: 94,
    trend: "up",
    appointments: 48,
    revenue: "R$ 28.400",
  },
  {
    id: "2",
    name: "Juliana Santos",
    role: "Esteticista",
    avatar: "JS",
    performance: 87,
    trend: "up",
    appointments: 42,
    revenue: "R$ 22.100",
  },
  {
    id: "3",
    name: "Patricia Lima",
    role: "Esteticista",
    avatar: "PL",
    performance: 78,
    trend: "stable",
    appointments: 35,
    revenue: "R$ 18.500",
  },
  {
    id: "4",
    name: "Fernanda Costa",
    role: "Esteticista Jr.",
    avatar: "FC",
    performance: 72,
    trend: "down",
    appointments: 28,
    revenue: "R$ 12.800",
  },
];

const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export function TeamPerformance() {
  return (
    <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Performance da Equipe</CardTitle>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            Este mês
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {teamMembers.map((member, index) => (
          <div
            key={member.id}
            className="group flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${300 + index * 100}ms` }}
          >
            {/* Avatar */}
            <div className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold text-sm transition-all duration-200",
              index === 0 ? "gradient-primary text-primary-foreground shadow-glow" : "bg-secondary text-secondary-foreground"
            )}>
              {member.avatar}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{member.name}</p>
                  <TrendIcon trend={member.trend} />
                </div>
                <span className="text-sm font-bold text-foreground">{member.performance}%</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{member.role}</p>
                <p className="text-xs text-muted-foreground">
                  {member.appointments} atend. • {member.revenue}
                </p>
              </div>
              <Progress 
                value={member.performance} 
                className="h-1.5"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
