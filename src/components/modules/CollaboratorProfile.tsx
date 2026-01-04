import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  User, 
  ClipboardCheck, 
  Star, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Trophy,
  Target,
  GraduationCap,
  CheckCircle2,
  XCircle,
  History,
  Award,
  Crown,
  Plus,
  MinusCircle,
  Settings2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface CollaboratorData {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  is_supervisor: boolean;
}

interface ScoreData {
  checklists_sent: number;
  perfect_checklists: number;
  delays: number;
  critical_errors: number;
  trainings_completed: number;
  total_points: number;
  ranking_position: number;
  previous_points?: number;
}

interface TrainingProgress {
  id: string;
  title: string;
  is_mandatory: boolean;
  completed: boolean;
}

interface HistoryEntry {
  id: string;
  type: 'checklist' | 'alert' | 'event';
  description: string;
  date: string;
  status?: 'positive' | 'negative' | 'neutral';
}

interface CollaboratorProfileProps {
  collaboratorId?: string;
}

export function CollaboratorProfile({ collaboratorId }: CollaboratorProfileProps) {
  const { user } = useAuth();
  const [collaborator, setCollaborator] = useState<CollaboratorData | null>(null);
  const [scores, setScores] = useState<ScoreData | null>(null);
  const [trainings, setTrainings] = useState<TrainingProgress[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPointsControl, setShowPointsControl] = useState(false);
  const [rankingPoints, setRankingPoints] = useState<string>("");
  const [racePoints, setRacePoints] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [raceConfig, setRaceConfig] = useState<{ id: string; current_position: number } | null>(null);

  const targetId = collaboratorId || user?.id;

  useEffect(() => {
    if (targetId) {
      loadCollaboratorData();
    }
  }, [targetId]);

  const loadCollaboratorData = async () => {
    setLoading(true);
    try {
      // Load profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();

      if (profile) {
        setCollaborator({
          id: profile.id,
          full_name: profile.full_name || 'Colaborador',
          role: profile.role || 'colaborador',
          is_supervisor: profile.is_supervisor || false
        });
      }

      // Load user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }

      // Load scores
      const currentPeriod = new Date();
      currentPeriod.setDate(1);
      const periodStart = currentPeriod.toISOString().split('T')[0];

      const { data: scoreData } = await supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', targetId)
        .eq('period_start', periodStart)
        .single();

      if (scoreData) {
        // Get ranking position
        const { data: allScores } = await supabase
          .from('user_scores')
          .select('user_id, total_points')
          .eq('period_start', periodStart)
          .order('total_points', { ascending: false });

        const position = allScores?.findIndex(s => s.user_id === targetId) ?? -1;

        setScores({
          checklists_sent: scoreData.checklists_sent,
          perfect_checklists: scoreData.perfect_checklists,
          delays: scoreData.delays,
          critical_errors: scoreData.critical_errors,
          trainings_completed: scoreData.trainings_completed,
          total_points: scoreData.total_points || 0,
          ranking_position: position + 1
        });
      } else {
        setScores({
          checklists_sent: 0,
          perfect_checklists: 0,
          delays: 0,
          critical_errors: 0,
          trainings_completed: 0,
          total_points: 0,
          ranking_position: 0
        });
      }

      // Load trainings
      const { data: allTrainings } = await supabase
        .from('trainings')
        .select('*');

      const { data: completedTrainings } = await supabase
        .from('training_progress')
        .select('training_id, completed_at')
        .eq('user_id', targetId);

      const completedIds = new Set(completedTrainings?.map(t => t.training_id) || []);

      setTrainings(
        allTrainings?.map(t => ({
          id: t.id,
          title: t.title,
          is_mandatory: t.is_mandatory,
          completed: completedIds.has(t.id)
        })) || []
      );

      // Load history (recent checklists and events)
      const { data: recentChecklists } = await supabase
        .from('daily_checklists')
        .select('id, checklist_date, is_perfect, submitted_by_name')
        .eq('submitted_by', targetId)
        .order('checklist_date', { ascending: false })
        .limit(5);

      const { data: recentEvents } = await supabase
        .from('goals_race_events')
        .select('id, event_type, description, created_at, points')
        .eq('related_user_id', targetId)
        .order('created_at', { ascending: false })
        .limit(5);

      const historyItems: HistoryEntry[] = [
        ...(recentChecklists?.map(c => ({
          id: c.id,
          type: 'checklist' as const,
          description: c.is_perfect 
            ? `Checklist perfeito enviado` 
            : `Checklist enviado`,
          date: c.checklist_date,
          status: c.is_perfect ? 'positive' as const : 'neutral' as const
        })) || []),
        ...(recentEvents?.map(e => ({
          id: e.id,
          type: 'event' as const,
          description: e.description || e.event_type,
          date: new Date(e.created_at).toISOString().split('T')[0],
          status: e.points > 0 ? 'positive' as const : 'negative' as const
        })) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      setHistory(historyItems);

      // Load race config for manager controls
      const { data: raceData } = await supabase
        .from('goals_race_config')
        .select('id, current_position')
        .eq('is_active', true)
        .maybeSingle();

      if (raceData) {
        setRaceConfig(raceData);
      }

    } catch (error) {
      console.error('Error loading collaborator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustRankingPoints = async (amount: number) => {
    if (!targetId) return;
    
    setIsUpdating(true);
    try {
      const currentPeriod = new Date();
      currentPeriod.setDate(1);
      const periodStart = currentPeriod.toISOString().split('T')[0];

      // Check if user has a score record
      const { data: existingScore } = await supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', targetId)
        .eq('period_start', periodStart)
        .maybeSingle();

      if (existingScore) {
        const newTotal = Math.max(0, (existingScore.total_points || 0) + amount);
        await supabase
          .from('user_scores')
          .update({ total_points: newTotal })
          .eq('id', existingScore.id);
      } else {
        await supabase
          .from('user_scores')
          .insert({
            user_id: targetId,
            period_start: periodStart,
            total_points: Math.max(0, amount)
          });
      }

      toast({
        title: "Pontuação atualizada",
        description: `${amount > 0 ? '+' : ''}${amount} pontos no ranking`,
      });

      loadCollaboratorData();
    } catch (error) {
      console.error('Error adjusting ranking points:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ajustar os pontos",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
      setRankingPoints("");
    }
  };

  const handleAdjustRacePoints = async (amount: number) => {
    if (!raceConfig) {
      toast({
        title: "Erro",
        description: "Nenhuma corrida da meta ativa",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const newPosition = Math.max(0, raceConfig.current_position + amount);

      await supabase
        .from('goals_race_config')
        .update({ current_position: newPosition })
        .eq('id', raceConfig.id);

      // Register event
      await supabase
        .from('goals_race_events')
        .insert({
          race_id: raceConfig.id,
          event_type: amount > 0 ? 'checklist_sent' : 'delay',
          points: amount,
          description: `Ajuste manual: ${amount > 0 ? '+' : ''}${amount} casas`,
          related_user_id: targetId
        });

      toast({
        title: "Corrida da Meta atualizada",
        description: `${amount > 0 ? '+' : ''}${amount} casas na corrida`,
      });

      setRaceConfig({ ...raceConfig, current_position: newPosition });
    } catch (error) {
      console.error('Error adjusting race points:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ajustar a corrida",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
      setRacePoints("");
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getEvolutionIcon = () => {
    if (!scores?.previous_points) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (scores.total_points > scores.previous_points) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (scores.total_points < scores.previous_points) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const completedTrainings = trainings.filter(t => t.completed).length;
  const mandatoryTrainings = trainings.filter(t => t.is_mandatory);
  const completedMandatory = mandatoryTrainings.filter(t => t.completed).length;
  const trainingProgress = trainings.length > 0 
    ? Math.round((completedTrainings / trainings.length) * 100) 
    : 0;

  const canViewFullProfile = userRole === 'gestora' || userRole === 'supervisora' || targetId === user?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!canViewFullProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Você não tem permissão para visualizar este perfil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-24 gradient-primary" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={collaborator?.avatar_url} />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {collaborator ? getInitials(collaborator.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-foreground">
                  {collaborator?.full_name || 'Colaborador'}
                </h2>
                {collaborator?.is_supervisor && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Supervisora da Semana
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Badge variant="outline" className="capitalize">
                  {collaborator?.role || 'Colaborador'}
                </Badge>
                <span className="text-sm">•</span>
                <span className="text-sm">Turno Integral</span>
              </div>
            </div>

            {scores && scores.ranking_position > 0 && scores.ranking_position <= 3 && (
              <div className="flex items-center gap-2">
                <Trophy className={cn(
                  "h-8 w-8",
                  scores.ranking_position === 1 && "text-yellow-500",
                  scores.ranking_position === 2 && "text-gray-400",
                  scores.ranking_position === 3 && "text-amber-600"
                )} />
                <span className="text-lg font-bold">Top {scores.ranking_position}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Rotina e Comportamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Rotina e Comportamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-3xl font-bold text-foreground">{scores?.checklists_sent || 0}</div>
                <div className="text-sm text-muted-foreground">Checklists Participados</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-5 w-5 text-green-500" />
                  <span className="text-3xl font-bold text-green-600">{scores?.perfect_checklists || 0}</span>
                </div>
                <div className="text-sm text-muted-foreground">Checklists Perfeitos</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-amber-500/10">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <span className="text-3xl font-bold text-amber-600">{scores?.delays || 0}</span>
                </div>
                <div className="text-sm text-muted-foreground">Atrasos</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-500/10">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-3xl font-bold text-red-600">{scores?.critical_errors || 0}</span>
                </div>
                <div className="text-sm text-muted-foreground">Erros Críticos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Performance
              </div>
              {userRole === 'gestora' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPointsControl(!showPointsControl)}
                >
                  <Settings2 className="h-4 w-4 mr-1" />
                  Ajustar Pontos
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manager Points Control Panel */}
            {showPointsControl && userRole === 'gestora' && (
              <div className="p-4 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Settings2 className="h-4 w-4" />
                  Controle Manual de Pontuação
                </div>

                {/* Ranking Points Control */}
                <div className="space-y-2">
                  <Label className="text-sm">Pontos no Ranking Individual</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Ex: 10 ou -5"
                      value={rankingPoints}
                      onChange={(e) => setRankingPoints(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      disabled={isUpdating || !rankingPoints}
                      onClick={() => handleAdjustRankingPoints(parseInt(rankingPoints) || 0)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isUpdating || !rankingPoints}
                      onClick={() => handleAdjustRankingPoints(-(Math.abs(parseInt(rankingPoints)) || 0))}
                    >
                      <MinusCircle className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>

                {/* Race Points Control */}
                <div className="space-y-2">
                  <Label className="text-sm">Casas na Corrida da Meta (Equipe)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Ex: 3 ou -2"
                      value={racePoints}
                      onChange={(e) => setRacePoints(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      disabled={isUpdating || !racePoints}
                      onClick={() => handleAdjustRacePoints(parseInt(racePoints) || 0)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Avançar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isUpdating || !racePoints}
                      onClick={() => handleAdjustRacePoints(-(Math.abs(parseInt(racePoints)) || 0))}
                    >
                      <MinusCircle className="h-4 w-4 mr-1" />
                      Recuar
                    </Button>
                  </div>
                  {raceConfig && (
                    <p className="text-xs text-muted-foreground">
                      Posição atual da equipe: {raceConfig.current_position} casas
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
              <div>
                <div className="text-sm text-muted-foreground">Pontuação Atual</div>
                <div className="text-4xl font-bold text-primary">{scores?.total_points || 0}</div>
              </div>
              <Award className="h-12 w-12 text-primary/50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Posição no Ranking</div>
                <div className="text-2xl font-bold text-foreground">
                  #{scores?.ranking_position || '-'}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Evolução</div>
                <div className="flex items-center gap-2">
                  {getEvolutionIcon()}
                  <span className="text-lg font-medium">
                    {!scores?.previous_points ? 'Novo período' : 
                      scores.total_points > scores.previous_points ? 'Subindo' : 
                      scores.total_points < scores.previous_points ? 'Caindo' : 'Estável'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Target className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium">Impacto na Corrida da Meta</div>
                <div className="text-xs text-muted-foreground">
                  Contribuiu com +{(scores?.checklists_sent || 0) + (scores?.perfect_checklists || 0)} casas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treinamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Treinamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso Geral</span>
                <span className="font-medium">{trainingProgress}%</span>
              </div>
              <Progress value={trainingProgress} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-foreground">{trainings.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <div className="text-2xl font-bold text-green-600">{completedTrainings}</div>
                <div className="text-xs text-muted-foreground">Concluídos</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10">
                <div className="text-2xl font-bold text-amber-600">{trainings.length - completedTrainings}</div>
                <div className="text-xs text-muted-foreground">Pendentes</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-medium">Obrigatórios ({completedMandatory}/{mandatoryTrainings.length})</div>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {mandatoryTrainings.map((training) => (
                    <div 
                      key={training.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      {training.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        "text-sm",
                        training.completed ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {training.title}
                      </span>
                    </div>
                  ))}
                  {mandatoryTrainings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum treinamento obrigatório cadastrado
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {history.map((entry) => (
                  <div 
                    key={entry.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border-l-4",
                      entry.status === 'positive' && "bg-green-500/5 border-green-500",
                      entry.status === 'negative' && "bg-red-500/5 border-red-500",
                      entry.status === 'neutral' && "bg-muted/50 border-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 p-1.5 rounded-full",
                      entry.status === 'positive' && "bg-green-500/20",
                      entry.status === 'negative' && "bg-red-500/20",
                      entry.status === 'neutral' && "bg-muted"
                    )}>
                      {entry.type === 'checklist' ? (
                        <ClipboardCheck className={cn(
                          "h-4 w-4",
                          entry.status === 'positive' && "text-green-500",
                          entry.status === 'negative' && "text-red-500",
                          entry.status === 'neutral' && "text-muted-foreground"
                        )} />
                      ) : entry.type === 'alert' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Target className={cn(
                          "h-4 w-4",
                          entry.status === 'positive' && "text-green-500",
                          entry.status === 'negative' && "text-red-500"
                        )} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CollaboratorProfile;
