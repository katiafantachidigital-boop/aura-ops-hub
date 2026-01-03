import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Crown, UserCheck, UserMinus, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, isAfter, setHours, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  full_name: string | null;
  role: string | null;
  shift: string | null;
  is_supervisor: boolean;
}

interface WeeklySupervisor {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
}

interface DailyChecklist {
  id: string;
  checklist_date: string;
  submitted_by: string;
  submitted_by_name: string;
  created_at: string;
  is_perfect: boolean | null;
}

export function SupervisorManagement() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentSupervisor, setCurrentSupervisor] = useState<WeeklySupervisor | null>(null);
  const [todayChecklist, setTodayChecklist] = useState<DailyChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const loadData = async () => {
    try {
      // Load all profiles (except manager)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, role, shift, is_supervisor")
        .eq("profile_completed", true);

      if (profilesError) throw profilesError;

      // Filter out the manager
      const filteredProfiles = (profilesData || []).filter(
        p => p.id !== user?.id
      );
      setProfiles(filteredProfiles);

      // Check current week's supervisor
      const { data: supervisorData, error: supervisorError } = await supabase
        .from("weekly_supervisors")
        .select("*")
        .gte("week_start", format(weekStart, "yyyy-MM-dd"))
        .lte("week_end", format(weekEnd, "yyyy-MM-dd"))
        .maybeSingle();

      if (supervisorError) throw supervisorError;
      setCurrentSupervisor(supervisorData);

      // Check today's checklist
      const { data: checklistData, error: checklistError } = await supabase
        .from("daily_checklists")
        .select("id, checklist_date, submitted_by, submitted_by_name, created_at, is_perfect")
        .eq("checklist_date", format(today, "yyyy-MM-dd"))
        .maybeSingle();

      if (checklistError) throw checklistError;
      setTodayChecklist(checklistData);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const promoteSupervisor = async (profileId: string) => {
    if (!user) return;
    setPromoting(profileId);

    try {
      // First, demote any current supervisor
      if (currentSupervisor) {
        await supabase
          .from("profiles")
          .update({ is_supervisor: false })
          .eq("id", currentSupervisor.user_id);

        await supabase
          .from("weekly_supervisors")
          .delete()
          .eq("id", currentSupervisor.id);
      }

      // Create new weekly supervisor record
      const { error: insertError } = await supabase
        .from("weekly_supervisors")
        .insert({
          user_id: profileId,
          week_start: format(weekStart, "yyyy-MM-dd"),
          week_end: format(weekEnd, "yyyy-MM-dd"),
          assigned_by: user.id,
        });

      if (insertError) throw insertError;

      // Update profile to is_supervisor = true
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_supervisor: true })
        .eq("id", profileId);

      if (updateError) throw updateError;

      toast.success("Supervisor promovido com sucesso!");
      loadData();
    } catch (error) {
      console.error("Error promoting supervisor:", error);
      toast.error("Erro ao promover supervisora");
    } finally {
      setPromoting(null);
    }
  };

  const demoteSupervisor = async () => {
    if (!currentSupervisor) return;
    setPromoting(currentSupervisor.user_id);

    try {
      // Update profile to is_supervisor = false
      await supabase
        .from("profiles")
        .update({ is_supervisor: false })
        .eq("id", currentSupervisor.user_id);

      // Delete weekly supervisor record
      await supabase
        .from("weekly_supervisors")
        .delete()
        .eq("id", currentSupervisor.id);

      toast.success("Supervisor removido com sucesso!");
      loadData();
    } catch (error) {
      console.error("Error demoting supervisor:", error);
      toast.error("Erro ao remover supervisora");
    } finally {
      setPromoting(null);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getCurrentSupervisorProfile = () => {
    if (!currentSupervisor) return null;
    return profiles.find(p => p.id === currentSupervisor.user_id);
  };

  // Check if checklist can be submitted (after 7 AM)
  const canSubmitChecklist = () => {
    const now = new Date();
    const sevenAM = setHours(new Date(), 7);
    sevenAM.setMinutes(0);
    sevenAM.setSeconds(0);
    
    // If there's no checklist today and it's after 7 AM, can submit
    if (!todayChecklist && isAfter(now, sevenAM)) {
      return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const supervisorProfile = getCurrentSupervisorProfile();

  return (
    <div className="space-y-6">
      {/* Current Supervisor Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Supervisor da Semana</CardTitle>
              <CardDescription>
                {format(weekStart, "dd/MM", { locale: ptBR })} - {format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {supervisorProfile ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-background border">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {getInitials(supervisorProfile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{supervisorProfile.full_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{supervisorProfile.role}</Badge>
                    <Badge variant="secondary">{supervisorProfile.shift}</Badge>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Crown className="h-3 w-3 mr-1" />
                      Supervisor
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={demoteSupervisor}
                disabled={promoting === currentSupervisor?.user_id}
              >
                {promoting === currentSupervisor?.user_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Despromover
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum supervisor designado esta semana</p>
              <p className="text-sm">Selecione um colaborador abaixo para promover</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Checklist Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Status do Checklist de Hoje</CardTitle>
              <CardDescription>{format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {todayChecklist ? (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div className="flex-1">
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  Checklist enviado com sucesso!
                </p>
                <p className="text-sm text-muted-foreground">
                  Enviado por {todayChecklist.submitted_by_name} às{" "}
                  {format(new Date(todayChecklist.created_at), "HH:mm")}
                </p>
              </div>
              {todayChecklist.is_perfect && (
                <Badge className="bg-emerald-500">Perfeito!</Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Checklist pendente
                </p>
                <p className="text-sm text-muted-foreground">
                  {canSubmitChecklist()
                    ? "Aguardando envio pela supervisora"
                    : "Disponível a partir das 7h da manhã"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Colaboradores</CardTitle>
          <CardDescription>
            Selecione um colaborador para promover a supervisor da semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {profiles.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum colaborador cadastrado
                </p>
              ) : (
                profiles.map((profile) => {
                  const isSupervisor = profile.id === currentSupervisor?.user_id;
                  
                  return (
                    <div
                      key={profile.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isSupervisor
                          ? "bg-primary/5 border-primary/20"
                          : "bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className={isSupervisor ? "border-2 border-primary" : ""}>
                          <AvatarFallback className={isSupervisor ? "bg-primary/10 text-primary" : ""}>
                            {getInitials(profile.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile.full_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {profile.role}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {profile.shift}
                            </Badge>
                            {isSupervisor && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Supervisor
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {!isSupervisor && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => promoteSupervisor(profile.id)}
                          disabled={promoting === profile.id}
                          className="gap-2"
                        >
                          {promoting === profile.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4" />
                              Promover
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
