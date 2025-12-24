import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, DollarSign, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  icon: typeof Target;
  color: "emerald" | "rose" | "gold" | "lavender";
}

const goals: Goal[] = [
  {
    id: "1",
    title: "Meta de Faturamento",
    current: 78500,
    target: 100000,
    unit: "R$",
    icon: DollarSign,
    color: "emerald",
  },
  {
    id: "2",
    title: "Atendimentos",
    current: 156,
    target: 200,
    unit: "",
    icon: Users,
    color: "rose",
  },
  {
    id: "3",
    title: "Novos Clientes",
    current: 28,
    target: 40,
    unit: "",
    icon: TrendingUp,
    color: "gold",
  },
];

const colorClasses = {
  emerald: "text-emerald",
  rose: "text-rose-gold-dark",
  gold: "text-gold",
  lavender: "text-lavender-dark",
};

const bgColorClasses = {
  emerald: "bg-emerald-light",
  rose: "bg-rose-gold-light",
  gold: "bg-gold-light",
  lavender: "bg-lavender",
};

export function GoalsProgress() {
  return (
    <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Metas do Mês
          </CardTitle>
          <span className="text-xs font-medium text-muted-foreground">
            12 dias restantes
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {goals.map((goal, index) => {
          const Icon = goal.icon;
          const percentage = Math.round((goal.current / goal.target) * 100);
          const formattedCurrent = goal.unit === "R$" 
            ? `R$ ${goal.current.toLocaleString('pt-BR')}` 
            : goal.current;
          const formattedTarget = goal.unit === "R$" 
            ? `R$ ${goal.target.toLocaleString('pt-BR')}` 
            : goal.target;

          return (
            <div
              key={goal.id}
              className="space-y-3 animate-fade-in"
              style={{ animationDelay: `${500 + index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bgColorClasses[goal.color])}>
                    <Icon className={cn("h-4 w-4", colorClasses[goal.color])} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{goal.title}</span>
                </div>
                <span className={cn("text-sm font-bold", colorClasses[goal.color])}>
                  {percentage}%
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Atual: {formattedCurrent}</span>
                <span>Meta: {formattedTarget}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
