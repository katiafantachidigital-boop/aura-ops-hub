import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, CheckCircle2, Clock, AlertCircle, Calendar, User, ShieldX, Lock } from "lucide-react";
import { DailyChecklistForm } from "./DailyChecklistForm";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, setHours, isAfter, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubmittedChecklist {
  id: string;
  date: string;
  responsible: string;
  status: "completed" | "pending" | "issues";
  score: number;
  totalItems: number;
}

interface TodayChecklist {
  id: string;
  checklist_date: string;
  submitted_by_name: string;
  created_at: string;
  is_perfect: boolean | null;
}

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
  const [todayChecklist, setTodayChecklist] = useState<TodayChecklist | null>(null);
  const [recentChecklists, setRecentChecklists] = useState<TodayChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const { canSubmitChecklist, isManager } = useAuth();

  const today = new Date();

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      // Check today's checklist
      const { data: todayData, error: todayError } = await supabase
        .from("daily_checklists")
        .select("id, checklist_date, submitted_by_name, created_at, is_perfect")
        .eq("checklist_date", format(today, "yyyy-MM-dd"))
        .maybeSingle();

      if (todayError) throw todayError;
      setTodayChecklist(todayData);

      // Load recent checklists
      const { data: recentData, error: recentError } = await supabase
        .from("daily_checklists")
        .select("id, checklist_date, submitted_by_name, created_at, is_perfect")
        .order("checklist_date", { ascending: false })
        .limit(10);

      if (recentError) throw recentError;
      setRecentChecklists(recentData || []);
    } catch (error) {
      console.error("Error loading checklists:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayChecklist = loadChecklists;

  // Check if it's after 7 AM
  const isAfterSevenAM = () => {
    const now = new Date();
    const sevenAM = setHours(new Date(), 7);
    sevenAM.setMinutes(0);
    sevenAM.setSeconds(0);
    return isAfter(now, sevenAM);
  };

  // Calculate next available time (7 AM tomorrow)
  const getNextAvailableTime = () => {
    const tomorrow = addDays(today, 1);
    return setHours(tomorrow, 7);
  };

  // Can submit: has permission AND no checklist today AND after 7 AM
  const canSubmitNow = canSubmitChecklist && !todayChecklist && isAfterSevenAM();

  if (showForm) {
    return <DailyChecklistForm onBack={() => { setShowForm(false); checkTodayChecklist(); }} />;
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

        {canSubmitNow && (
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

      {/* Today's checklist status */}
      {todayChecklist && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                Checklist de hoje já foi enviado!
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Enviado por {todayChecklist.submitted_by_name} às{" "}
                {format(new Date(todayChecklist.created_at), "HH:mm")}
                {todayChecklist.is_perfect && " • Checklist Perfeito! ⭐"}
              </p>
            </div>
            {!isAfterSevenAM() && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Liberado às 7h
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Access Restricted Message for non-supervisors */}
      {!canSubmitChecklist && !todayChecklist && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-800">
              <ShieldX className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Acesso restrito</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                Apenas a supervisora da semana ou a gestora podem enviar o checklist.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiting for 7 AM */}
      {canSubmitChecklist && !todayChecklist && !isAfterSevenAM() && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-800">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Aguardando horário</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                O checklist pode ser enviado a partir das 7h da manhã.
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
            {recentChecklists.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum checklist enviado ainda
              </p>
            ) : (
              recentChecklists.map((checklist, index) => (
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
                      <p className="font-medium text-foreground">
                        {format(new Date(checklist.checklist_date), "dd/MM/yyyy")}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{checklist.submitted_by_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge className={cn("gap-1.5", checklist.is_perfect 
                      ? "bg-emerald-light text-emerald border-emerald/20"
                      : "bg-blue-100 text-blue-700 border-blue-200"
                    )}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {checklist.is_perfect ? "Perfeito" : "Concluído"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
