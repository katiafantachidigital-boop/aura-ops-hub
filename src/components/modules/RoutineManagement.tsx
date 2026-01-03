import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, CheckCircle2, Clock, AlertCircle, Calendar, User, ShieldX } from "lucide-react";
import { DailyChecklistForm } from "./DailyChecklistForm";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SubmittedChecklist {
  id: string;
  date: string;
  responsible: string;
  status: "completed" | "pending" | "issues";
  score: number;
  totalItems: number;
}

const submittedChecklists: SubmittedChecklist[] = [
  {
    id: "1",
    date: "03/01/2026",
    responsible: "Carla Mendes",
    status: "completed",
    score: 18,
    totalItems: 19,
  },
  {
    id: "2",
    date: "02/01/2026",
    responsible: "Juliana Santos",
    status: "completed",
    score: 19,
    totalItems: 19,
  },
  {
    id: "3",
    date: "01/01/2026",
    responsible: "Patricia Lima",
    status: "issues",
    score: 14,
    totalItems: 19,
  },
  {
    id: "4",
    date: "31/12/2025",
    responsible: "Carla Mendes",
    status: "completed",
    score: 17,
    totalItems: 19,
  },
  {
    id: "5",
    date: "30/12/2025",
    responsible: "Fernanda Costa",
    status: "pending",
    score: 0,
    totalItems: 19,
  },
];

const statusConfig = {
  completed: {
    label: "Concluído",
    icon: CheckCircle2,
    className: "bg-emerald-light text-emerald border-emerald/20",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-gold-light text-gold border-gold/20",
  },
  issues: {
    label: "Com Pendências",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function RoutineManagement() {
  const [showForm, setShowForm] = useState(false);
  // TEMPORARILY DISABLED: Auth check - always allow access for testing
  // const { canSubmitChecklist } = useAuth();
  const canSubmitChecklist = true;

  if (showForm) {
    return <DailyChecklistForm onBack={() => setShowForm(false)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <ClipboardList className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rotina Operacional</h1>
            <p className="text-muted-foreground mt-1">
              Execução diária e padrão da clínica
            </p>
          </div>
        </div>

        {canSubmitChecklist && (
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-5 w-5" />
            Enviar Checklist Diário
          </Button>
        )}
      </div>

      {/* Access Restricted Message */}
      {!canSubmitChecklist && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <ShieldX className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">Acesso restrito</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Apenas a supervisora da semana pode enviar o checklist.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Checklists Este Mês</p>
                <p className="text-2xl font-bold text-foreground mt-1">23</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-light flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-emerald" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conformidade</p>
                <p className="text-2xl font-bold text-foreground mt-1">94.2%</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gold-light flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendências</p>
                <p className="text-2xl font-bold text-foreground mt-1">2</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submitted Checklists */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Checklists Enviados</CardTitle>
          <CardDescription>Histórico de checklists diários submetidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {submittedChecklists.map((checklist, index) => {
              const config = statusConfig[checklist.status];
              const StatusIcon = config.icon;
              const percentage = Math.round((checklist.score / checklist.totalItems) * 100);

              return (
                <div
                  key={checklist.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{checklist.date}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{checklist.responsible}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {checklist.status !== "pending" && (
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-foreground">
                          {checklist.score}/{checklist.totalItems}
                        </p>
                        <p className="text-xs text-muted-foreground">{percentage}% conforme</p>
                      </div>
                    )}
                    <Badge className={cn("gap-1.5", config.className)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {config.label}
                    </Badge>
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
