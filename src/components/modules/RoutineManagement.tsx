import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ListChecks,
  Calendar,
  User,
  MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  assignee: string;
  time: string;
  status: "completed" | "in-progress" | "pending" | "overdue";
  priority: "high" | "medium" | "low";
}

const dailyTasks: Task[] = [
  { id: "1", title: "Abertura da clínica - Checklist", assignee: "Recepção", time: "07:30", status: "completed", priority: "high" },
  { id: "2", title: "Verificação de estoque de insumos", assignee: "Carla M.", time: "08:00", status: "completed", priority: "medium" },
  { id: "3", title: "Preparação das salas de atendimento", assignee: "Equipe", time: "08:15", status: "in-progress", priority: "high" },
  { id: "4", title: "Confirmação de agendamentos do dia", assignee: "Recepção", time: "08:30", status: "pending", priority: "high" },
  { id: "5", title: "Reunião de alinhamento matinal", assignee: "Todos", time: "09:00", status: "pending", priority: "medium" },
  { id: "6", title: "Atualização do sistema de prontuários", assignee: "Admin", time: "17:00", status: "pending", priority: "low" },
  { id: "7", title: "Fechamento de caixa", assignee: "Financeiro", time: "18:30", status: "pending", priority: "high" },
  { id: "8", title: "Checklist de encerramento", assignee: "Recepção", time: "19:00", status: "pending", priority: "high" },
];

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-emerald bg-emerald-light", label: "Concluído" },
  "in-progress": { icon: Clock, color: "text-gold bg-gold-light", label: "Em andamento" },
  pending: { icon: ListChecks, color: "text-muted-foreground bg-muted", label: "Pendente" },
  overdue: { icon: AlertTriangle, color: "text-destructive bg-destructive/10", label: "Atrasado" },
};

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-gold-light text-gold border-gold/20",
  low: "bg-muted text-muted-foreground border-border",
};

export function RoutineManagement() {
  const completedTasks = dailyTasks.filter(t => t.status === "completed").length;
  const totalTasks = dailyTasks.length;
  const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="stat" className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progresso do Dia</p>
                <p className="text-2xl font-bold">{progressPercentage}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-light flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald" />
              </div>
            </div>
            <Progress value={progressPercentage} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tarefas Concluídas</p>
                <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gold-light flex items-center justify-center">
                <ListChecks className="h-6 w-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próxima Tarefa</p>
                <p className="text-lg font-bold truncate">Prep. Salas</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-lavender flex items-center justify-center">
                <Clock className="h-6 w-6 text-lavender-dark" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atrasadas</p>
                <p className="text-2xl font-bold text-destructive">0</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Tasks */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Rotina Operacional do Dia
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dailyTasks.map((task, index) => {
              const status = statusConfig[task.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-soft animate-fade-in",
                    task.status === "completed" ? "bg-muted/30 opacity-70" : "bg-card"
                  )}
                  style={{ animationDelay: `${500 + index * 50}ms` }}
                >
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", status.color)}>
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn("font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                        {task.title}
                      </p>
                      <Badge variant="outline" className={cn("text-[10px] px-1.5", priorityColors[task.priority])}>
                        {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignee}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.time}
                      </span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-xs">
                    {status.label}
                  </Badge>

                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
