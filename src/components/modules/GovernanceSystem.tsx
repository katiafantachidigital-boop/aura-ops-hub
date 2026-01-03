import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  GitBranch,
  Users,
  FileText,
  CheckSquare,
  Clock,
  TrendingUp,
  Target,
  AlertCircle,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Decision {
  id: string;
  title: string;
  type: "strategic" | "operational" | "tactical";
  status: "approved" | "pending" | "review" | "implemented";
  date: string;
  owner: string;
  impact: "high" | "medium" | "low";
}

interface Process {
  id: string;
  name: string;
  owner: string;
  status: "active" | "review" | "draft";
  efficiency: number;
  lastUpdate: string;
}

const decisions: Decision[] = [
  { id: "1", title: "Expansão para nova unidade", type: "strategic", status: "approved", date: "20/12/2024", owner: "Diretoria", impact: "high" },
  { id: "2", title: "Novo sistema de agendamento", type: "tactical", status: "implemented", date: "15/12/2024", owner: "TI", impact: "medium" },
  { id: "3", title: "Revisão de preços Q1 2025", type: "operational", status: "pending", date: "10/12/2024", owner: "Comercial", impact: "high" },
  { id: "4", title: "Programa de fidelidade", type: "tactical", status: "review", date: "05/12/2024", owner: "Marketing", impact: "medium" },
];

const processes: Process[] = [
  { id: "1", name: "Atendimento ao Cliente", owner: "Recepção", status: "active", efficiency: 94, lastUpdate: "15/12/2024" },
  { id: "2", name: "Gestão de Estoque", owner: "Operações", status: "active", efficiency: 87, lastUpdate: "10/12/2024" },
  { id: "3", name: "Faturamento", owner: "Financeiro", status: "review", efficiency: 91, lastUpdate: "18/12/2024" },
  { id: "4", name: "Capacitação", owner: "RH", status: "active", efficiency: 82, lastUpdate: "12/12/2024" },
];

const statusColors = {
  approved: "bg-emerald-light text-emerald",
  pending: "bg-gold-light text-gold",
  review: "bg-lavender text-lavender-dark",
  implemented: "bg-primary/10 text-primary",
  active: "bg-emerald-light text-emerald",
  draft: "bg-muted text-muted-foreground",
};

const impactColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-gold-light text-gold border-gold/20",
  low: "bg-muted text-muted-foreground border-border",
};

const typeLabels = {
  strategic: "Estratégica",
  operational: "Operacional",
  tactical: "Tática",
};

export function GovernanceSystem() {
  const avgEfficiency = Math.round(processes.reduce((acc, p) => acc + p.efficiency, 0) / processes.length);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="stat" className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eficiência Geral</p>
                <p className="text-2xl font-bold">{avgEfficiency}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-light flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald" />
              </div>
            </div>
            <Progress value={avgEfficiency} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processos Ativos</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gold-light flex items-center justify-center">
                <GitBranch className="h-6 w-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Decisões Pendentes</p>
                <p className="text-2xl font-bold text-gold">2</p>
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
                <p className="text-sm text-muted-foreground">Metas Atingidas</p>
                <p className="text-2xl font-bold text-emerald">8/10</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-light flex items-center justify-center">
                <Target className="h-6 w-6 text-emerald" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decisions */}
        <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Decisões e Deliberações
              </CardTitle>
              <Button size="sm" variant="outline">
                Nova Decisão
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {decisions.map((decision, index) => (
              <div
                key={decision.id}
                className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-soft transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${500 + index * 50}ms` }}
              >
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", statusColors[decision.status])}>
                  <CheckSquare className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{decision.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{typeLabels[decision.type]}</Badge>
                    <span>•</span>
                    <span>{decision.owner}</span>
                    <span>•</span>
                    <span>{decision.date}</span>
                  </div>
                </div>

                <Badge variant="outline" className={cn("text-[10px]", impactColors[decision.impact])}>
                  {decision.impact === "high" ? "Alto" : decision.impact === "medium" ? "Médio" : "Baixo"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Processes */}
        <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "450ms" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Processos Organizacionais
              </CardTitle>
              <Button size="sm" variant="outline">
                Mapear Processo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {processes.map((process, index) => (
              <div
                key={process.id}
                className="p-4 rounded-xl border bg-card hover:shadow-soft transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${550 + index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{process.name}</p>
                    <Badge variant="secondary" className={cn("text-[10px]", statusColors[process.status])}>
                      {process.status === "active" ? "Ativo" : process.status === "review" ? "Em Revisão" : "Rascunho"}
                    </Badge>
                  </div>
                  <span className={cn(
                    "text-lg font-bold",
                    process.efficiency >= 90 ? "text-emerald" : process.efficiency >= 80 ? "text-gold" : "text-destructive"
                  )}>
                    {process.efficiency}%
                  </span>
                </div>
                <Progress value={process.efficiency} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {process.owner}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Atualizado: {process.lastUpdate}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
