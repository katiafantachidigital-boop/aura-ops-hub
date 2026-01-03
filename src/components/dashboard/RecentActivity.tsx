import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "appointment" | "completed" | "cancelled" | "scheduled";
  title: string;
  description: string;
  time: string;
  professional?: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "completed",
    title: "Limpeza de Pele Profunda",
    description: "Cliente: Maria Silva",
    time: "Há 15 min",
    professional: "Carla Mendes",
  },
  {
    id: "2",
    type: "scheduled",
    title: "Novo agendamento",
    description: "Microagulhamento - Ana Costa",
    time: "Há 32 min",
    professional: "Juliana Santos",
  },
  {
    id: "3",
    type: "cancelled",
    title: "Cancelamento",
    description: "Peeling Químico - João Pedro",
    time: "Há 1h",
    professional: "Patricia Lima",
  },
  {
    id: "4",
    type: "appointment",
    title: "Em atendimento",
    description: "Drenagem Linfática - Paula Reis",
    time: "Iniciou há 20 min",
    professional: "Fernanda Costa",
  },
  {
    id: "5",
    type: "completed",
    title: "Harmonização Facial",
    description: "Cliente: Roberto Alves",
    time: "Há 2h",
    professional: "Carla Mendes",
  },
];

const activityConfig = {
  appointment: {
    icon: Clock,
    color: "text-gold bg-gold-light",
    badge: "Em andamento",
    badgeVariant: "outline" as const,
  },
  completed: {
    icon: CheckCircle2,
    color: "text-emerald bg-emerald-light",
    badge: "Concluído",
    badgeVariant: "secondary" as const,
  },
  cancelled: {
    icon: XCircle,
    color: "text-destructive bg-destructive/10",
    badge: "Cancelado",
    badgeVariant: "destructive" as const,
  },
  scheduled: {
    icon: Calendar,
    color: "text-lavender-dark bg-lavender",
    badge: "Agendado",
    badgeVariant: "outline" as const,
  },
};

export function RecentActivity() {
  return (
    <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Atividade Recente</CardTitle>
          <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            Ver todas
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="group flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${400 + index * 80}ms` }}
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {activity.title}
                    </p>
                    <Badge variant={config.badgeVariant} className="shrink-0 text-[10px] px-2 py-0.5">
                      {config.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                    {activity.professional && (
                      <>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="text-[10px] text-muted-foreground">{activity.professional}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
