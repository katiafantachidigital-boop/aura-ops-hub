import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, TrendingUp, TrendingDown, Minus, Trophy, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  currentPosition: number;
  previousPosition: number;
  points: number;
  criticalErrors: number;
  delays: number;
}

const teamMembers: TeamMember[] = [
  { id: "1", name: "Carla Mendes", avatar: "CM", currentPosition: 12, previousPosition: 10, points: 45, criticalErrors: 0, delays: 1 },
  { id: "2", name: "Juliana Santos", avatar: "JS", currentPosition: 10, previousPosition: 9, points: 38, criticalErrors: 0, delays: 2 },
  { id: "3", name: "Patricia Lima", avatar: "PL", currentPosition: 8, previousPosition: 8, points: 32, criticalErrors: 1, delays: 1 },
  { id: "4", name: "Fernanda Costa", avatar: "FC", currentPosition: 5, previousPosition: 7, points: 22, criticalErrors: 2, delays: 3 },
  { id: "5", name: "Ana Oliveira", avatar: "AO", currentPosition: 7, previousPosition: 6, points: 28, criticalErrors: 0, delays: 2 },
];

const TOTAL_POSITIONS = 20;

const rules = [
  { icon: TrendingUp, text: "Checklist completo no prazo: +2 casas", color: "text-emerald" },
  { icon: Trophy, text: "Meta atingida: +3 casas", color: "text-gold" },
  { icon: AlertTriangle, text: "Erro crítico: -2 casas", color: "text-destructive" },
  { icon: TrendingDown, text: "Atraso no checklist: -1 casa", color: "text-destructive" },
];

export function GoalsRaceModule() {
  const sortedMembers = [...teamMembers].sort((a, b) => b.currentPosition - a.currentPosition);

  const getTrend = (current: number, previous: number) => {
    if (current > previous) return { icon: TrendingUp, color: "text-emerald", label: `+${current - previous}` };
    if (current < previous) return { icon: TrendingDown, color: "text-destructive", label: `${current - previous}` };
    return { icon: Minus, color: "text-muted-foreground", label: "0" };
  };

  return (
    <div className="space-y-6">
      {/* Regras do Jogo */}
      <Card variant="glass" className="animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-5 w-5 text-primary" />
            Regras da Corrida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {rules.map((rule, index) => {
              const Icon = rule.icon;
              return (
                <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Icon className={cn("h-4 w-4 shrink-0", rule.color)} />
                  <span className="text-sm">{rule.text}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabuleiro Visual */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gold" />
              Tabuleiro da Corrida
            </CardTitle>
            <Badge variant="outline">Meta: Casa {TOTAL_POSITIONS}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Track visual */}
            <div className="relative">
              <div className="flex gap-1 overflow-x-auto pb-4">
                {Array.from({ length: TOTAL_POSITIONS }, (_, i) => i + 1).map((pos) => {
                  const membersAtPosition = sortedMembers.filter(m => m.currentPosition === pos);
                  const isFinish = pos === TOTAL_POSITIONS;
                  
                  return (
                    <div
                      key={pos}
                      className={cn(
                        "flex flex-col items-center gap-1 min-w-[40px]",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-all",
                          isFinish ? "bg-gold border-gold text-white" : "bg-muted border-border",
                          membersAtPosition.length > 0 && "ring-2 ring-primary ring-offset-2"
                        )}
                      >
                        {isFinish ? <Flag className="h-4 w-4" /> : pos}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {membersAtPosition.map(member => (
                          <div
                            key={member.id}
                            className="w-8 h-8 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-glow"
                            title={member.name}
                          >
                            {member.avatar}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking Detalhado */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
        <CardHeader className="pb-4">
          <CardTitle>Posição Detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedMembers.map((member, index) => {
              const trend = getTrend(member.currentPosition, member.previousPosition);
              const TrendIcon = trend.icon;
              const progressPercentage = (member.currentPosition / TOTAL_POSITIONS) * 100;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  {/* Posição */}
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm shrink-0",
                    index === 0 ? "bg-gold text-white" : 
                    index === 1 ? "bg-muted-foreground/30 text-foreground" :
                    index === 2 ? "bg-rose-gold text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}º
                  </div>

                  {/* Avatar */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-primary-foreground font-semibold text-sm shrink-0">
                    {member.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name}</span>
                        <div className={cn("flex items-center gap-1", trend.color)}>
                          <TrendIcon className="h-3 w-3" />
                          <span className="text-xs">{trend.label}</span>
                        </div>
                      </div>
                      <span className="font-bold">Casa {member.currentPosition}</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{member.points} pontos</span>
                      {member.criticalErrors > 0 && (
                        <span className="text-destructive">{member.criticalErrors} erros críticos</span>
                      )}
                      {member.delays > 0 && (
                        <span className="text-gold">{member.delays} atrasos</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
