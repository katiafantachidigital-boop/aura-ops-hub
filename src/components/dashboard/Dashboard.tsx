import { ClipboardCheck, Clock, AlertTriangle, CheckCircle2, Flag, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChecklistStat {
  label: string;
  value: number;
  icon: typeof ClipboardCheck;
  color: "emerald" | "gold" | "destructive" | "muted";
}

const checklistStats: ChecklistStat[] = [
  { label: "Enviados Hoje", value: 1, icon: CheckCircle2, color: "emerald" },
  { label: "Pendentes", value: 2, icon: Clock, color: "gold" },
  { label: "Atrasados", value: 1, icon: AlertTriangle, color: "destructive" },
];

const alerts = [
  { id: 1, message: "Checklist da manhã não foi enviado", type: "warning", time: "Há 2h" },
  { id: 2, message: "Fernanda está 3 casas atrás na corrida", type: "info", time: "Há 1h" },
];

const colorClasses = {
  emerald: "bg-emerald-light text-emerald",
  gold: "bg-gold-light text-gold",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats - Visão Geral do Dia */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {checklistStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              variant="stat"
              className="p-5 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", colorClasses[stat.color])}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-gold" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  alert.type === "warning" ? "bg-gold-light" : "bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className={cn("h-4 w-4", alert.type === "warning" ? "text-gold" : "text-muted-foreground")} />
                  <span className="text-sm font-medium">{alert.message}</span>
                </div>
                <span className="text-xs text-muted-foreground">{alert.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          variant="gradient"
          className="p-6 cursor-pointer hover:shadow-lg transition-all animate-fade-in"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
              <ClipboardCheck className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Checklist Diário</h3>
              <p className="text-sm text-muted-foreground">Preencher checklist de hoje</p>
            </div>
          </div>
        </Card>

        <Card
          variant="gradient"
          className="p-6 cursor-pointer hover:shadow-lg transition-all animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold-light text-gold">
              <Flag className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Corrida das Metas</h3>
              <p className="text-sm text-muted-foreground">Ver progresso da equipe</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Resumo Rápido da Corrida */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "600ms" }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-gold" />
              Líderes da Corrida
            </CardTitle>
            <Badge variant="outline" className="text-xs">Esta semana</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Carla Mendes", position: 12, trend: "+2" },
              { name: "Juliana Santos", position: 10, trend: "+1" },
              { name: "Patricia Lima", position: 8, trend: "0" },
            ].map((member, index) => (
              <div key={member.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                    index === 0 ? "bg-gold text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}º
                  </span>
                  <span className="font-medium">{member.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Casa {member.position}</span>
                  <Badge variant={member.trend.startsWith("+") ? "default" : "secondary"} className="text-xs">
                    {member.trend} casas
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
