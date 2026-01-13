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
import { format, startOfWeek, endOfWeek } from "date-fns";
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
  const [currentSupervisors, setCurrentSupervisors] = useState<WeeklySupervisor[]>([]);
  const [todayChecklists, setTodayChecklists] = useState<DailyChecklist[]>([]);
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

      // Check current week's supervisors (multiple)
      const { data: supervisorData, error: supervisorError } = await supabase
        .from("weekly_supervisors")
        .select("*")
        .gte("week_start", format(weekStart, "yyyy-MM-dd"))
        .lte("week_end", format(weekEnd, "yyyy-MM-dd"));

      if (supervisorError) throw supervisorError;
      setCurrentSupervisors(supervisorData || []);

      // Check today's checklists (multiple - one per supervisor)
      const { data: checklistData, error: checklistError } = await supabase
        .from("daily_checklists")
        .select("id, checklist_date, submitted_by, submitted_by_name, created_at, is_perfect")
        .eq("checklist_date", format(today, "yyyy-MM-dd"));

      if (checklistError) throw checklistError;
      setTodayChecklists(checklistData || []);

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

  const ensureSupervisorRole = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "supervisora" as any });

    // Ignore duplicates (in case it already exists)
    if (error && (error as any).code !== "23505") throw error;
  };

  const removeSupervisorRole = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "supervisora" as any);

    if (error) throw error;
  };

  const promoteSupervisor = async (profileId: string) => {
    if (!user) return;
    setPromoting(profileId);

    try {
      // Check if this user is already a supervisor this week
      const isAlreadySupervisor = currentSupervisors.some(s => s.user_id === profileId);
      if (isAlreadySupervisor) {
        toast.error("Este colaborador já é supervisor desta semana");
        setPromoting(null);
        return;
      }

      // Create new weekly supervisor record (allowing multiple)
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

      // Ensure this user can actually submit the checklist (RLS uses user_roles)
      await ensureSupervisorRole(profileId);

      toast.success("Supervisor promovido com sucesso!");
      loadData();
    } catch (error) {
      console.error("Error promoting supervisor:", error);
      toast.error("Erro ao promover supervisora");
    } finally {
      setPromoting(null);
    }
  };

  const demoteSupervisor = async (supervisorId: string, userId: string) => {
    setPromoting(userId);

    try {
      // Update profile to is_supervisor = false
      await supabase
        .from("profiles")
        .update({ is_supervisor: false })
        .eq("id", userId);

      // Delete weekly supervisor record
      await supabase
        .from("weekly_supervisors")
        .delete()
        .eq("id", supervisorId);

      // Remove supervisor role
      await removeSupervisorRole(userId);

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

  const getSupervisorProfiles = () => {
    return currentSupervisors.map(supervisor => ({
      ...supervisor,
      profile: profiles.find(p => p.id === supervisor.user_id)
    }));
  };

  // Get checklist for a specific supervisor
  const getChecklistForSupervisor = (userId: string) => {
    return todayChecklists.find(c => c.submitted_by === userId);
  };

  // Count how many supervisors submitted today
  const getSubmittedCount = () => {
    return todayChecklists.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const supervisorProfiles = getSupervisorProfiles();

  return (
    <div className="space-y-6">
      {/* Current Supervisors Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Supervisores da Semana</CardTitle>
              <CardDescription>
                {format(weekStart, "dd/MM", { locale: ptBR })} - {format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}
                {currentSupervisors.length > 0 && ` • ${currentSupervisors.length} supervisor${currentSupervisors.length > 1 ? 'es' : ''}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {supervisorProfiles.length > 0 ? (
            <div className="space-y-3">
              {supervisorProfiles.map(({ id, user_id, profile: supervisorProfile }) => {
                const supervisorChecklist = getChecklistForSupervisor(user_id);
                return (
                  <div key={id} className="flex items-center justify-between p-4 rounded-xl bg-background border">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-primary">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                          {getInitials(supervisorProfile?.full_name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-lg">{supervisorProfile?.full_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{supervisorProfile?.role}</Badge>
                          <Badge variant="secondary">{supervisorProfile?.shift}</Badge>
                          {supervisorChecklist ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Checklist enviado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/20">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => demoteSupervisor(id, user_id)}
                      disabled={promoting === user_id}
                    >
                      {promoting === user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Despromover
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum supervisor designado esta semana</p>
              <p className="text-sm">Selecione colaboradores abaixo para promover</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Checklists Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Status dos Checklists de Hoje</CardTitle>
              <CardDescription>
                {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                {currentSupervisors.length > 0 && ` • ${getSubmittedCount()}/${currentSupervisors.length} enviados`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {todayChecklists.length > 0 ? (
            <div className="space-y-3">
              {todayChecklists.map((checklist) => (
                <div key={checklist.id} className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">
                      Checklist enviado por {checklist.submitted_by_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Enviado às {format(new Date(checklist.created_at), "HH:mm")}
                    </p>
                  </div>
                  {checklist.is_perfect && (
                    <Badge className="bg-emerald-500">Perfeito!</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : currentSupervisors.length === 0 ? (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">
                  Nenhum supervisor designado
                </p>
                <p className="text-sm text-muted-foreground">
                  Promova colaboradores para enviar o checklist
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Checklists pendentes
                </p>
                <p className="text-sm text-muted-foreground">
                  Aguardando envio pelos supervisores ({currentSupervisors.length} supervisor{currentSupervisors.length > 1 ? 'es' : ''})
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
            Selecione colaboradores para promover a supervisor da semana (múltiplos permitidos)
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
                  const isSupervisor = currentSupervisors.some(s => s.user_id === profile.id);
                  
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
