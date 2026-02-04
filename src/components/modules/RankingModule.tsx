import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, 
  Medal, 
  Award,
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  Star,
  Clock,
  AlertTriangle,
  BookOpen,
  Info,
  Users,
  Target,
  Loader2,
  Settings2,
  Plus,
  MinusCircle,
  DollarSign,
  Calendar,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserScore {
  user_id: string;
  checklists_sent: number;
  perfect_checklists: number;
  delays: number;
  critical_errors: number;
  trainings_completed: number;
  sales_registered: number;
  total_points: number | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  custom_role: string | null;
  role: string | null;
}

interface CollaboratorRanking {
  id: string;
  name: string;
  role: string;
  points: number;
  checklistsSent: number;
  perfectChecklists: number;
  delays: number;
  criticalErrors: number;
  trainingsCompleted: number;
  salesRegistered: number;
}

interface RankingHistoryItem {
  user_id: string;
  user_name: string;
  checklists_sent: number;
  perfect_checklists: number;
  trainings_completed: number;
  sales_registered: number;
  delays: number;
  critical_errors: number;
  total_points: number;
  rank_position: number;
}

interface GoalsRaceConfig {
  current_position: number;
  goal_target: number;
}

const RankingModule: React.FC = () => {
  const { isManager, user } = useAuth();
  const [collaborators, setCollaborators] = useState<CollaboratorRanking[]>([]);
  const [raceConfig, setRaceConfig] = useState<GoalsRaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPointsControl, setShowPointsControl] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pointsToAdjust, setPointsToAdjust] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Month selection for historical data
  const [selectedMonth, setSelectedMonth] = useState<string>("current");
  const [availableMonths, setAvailableMonths] = useState<{value: string, label: string}[]>([]);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  useEffect(() => {
    generateAvailableMonths();
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMonth === "current") {
      setIsViewingHistory(false);
      loadData();
    } else {
      setIsViewingHistory(true);
      loadHistoricalData(selectedMonth);
    }
  }, [selectedMonth]);

  const generateAvailableMonths = () => {
    const months = [{ value: "current", label: "Mês Atual" }];
    
    // Generate last 12 months
    for (let i = 1; i <= 12; i++) {
      const date = subMonths(new Date(), i);
      const monthValue = format(date, "yyyy-MM-01");
      const monthLabel = format(date, "MMMM 'de' yyyy", { locale: ptBR });
      months.push({ value: monthValue, label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) });
    }
    
    setAvailableMonths(months);
  };

  const loadHistoricalData = async (monthDate: string) => {
    setLoading(true);
    
    const { data: historyData, error } = await supabase
      .from('ranking_history')
      .select('*')
      .eq('period_month', monthDate)
      .order('rank_position', { ascending: true });

    if (error) {
      console.error('Error loading historical ranking:', error);
      setCollaborators([]);
      setLoading(false);
      return;
    }

    if (historyData && historyData.length > 0) {
      const combined: CollaboratorRanking[] = historyData.map((item: RankingHistoryItem) => ({
        id: item.user_id,
        name: item.user_name,
        role: 'Colaborador',
        points: item.total_points,
        checklistsSent: item.checklists_sent,
        perfectChecklists: item.perfect_checklists,
        delays: item.delays,
        criticalErrors: item.critical_errors,
        trainingsCompleted: item.trainings_completed,
        salesRegistered: item.sales_registered,
      }));

      setCollaborators(combined);
    } else {
      setCollaborators([]);
    }
    
    setLoading(false);
  };

  const loadData = async () => {
    setLoading(true);

    // Load race config
    const { data: raceData } = await supabase
      .from('goals_race_config')
      .select('current_position, goal_target')
      .eq('is_active', true)
      .maybeSingle();

    setRaceConfig(raceData);

    // Load profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, custom_role, role')
      .eq('profile_completed', true);

    // Load scores for current month
    const currentPeriod = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    
    const { data: scores } = await supabase
      .from('user_scores')
      .select('*')
      .eq('period_start', currentPeriod);

    // Combine data
    const combined: CollaboratorRanking[] = (profiles || []).map((profile: Profile) => {
      const score = scores?.find((s: UserScore) => s.user_id === profile.id);
      // Point formula: checklist=3, perfect=5, training=5, sale=5
      const points = score ? (
        (score.checklists_sent * 3) +
        (score.perfect_checklists * 5) +
        (score.trainings_completed * 5) +
        (score.sales_registered || 0) * 5 -
        (score.delays * 3) -
        (score.critical_errors * 5)
      ) : 0;

      return {
        id: profile.id,
        name: profile.full_name || 'Sem nome',
        role: profile.custom_role || profile.role || 'Colaborador',
        points,
        checklistsSent: score?.checklists_sent || 0,
        perfectChecklists: score?.perfect_checklists || 0,
        delays: score?.delays || 0,
        criticalErrors: score?.critical_errors || 0,
        trainingsCompleted: score?.trainings_completed || 0,
        salesRegistered: score?.sales_registered || 0,
      };
    });

    setCollaborators(combined.sort((a, b) => b.points - a.points));
    setLoading(false);
  };

  const handleArchiveMonth = async (monthToArchive: string) => {
    if (!isManager) return;
    
    setIsUpdating(true);
    try {
      // Get current ranking data
      const rankedCollaborators = [...collaborators].sort((a, b) => b.points - a.points);
      
      // Archive each collaborator's ranking for the selected month
      for (let i = 0; i < rankedCollaborators.length; i++) {
        const collab = rankedCollaborators[i];
        await supabase
          .from('ranking_history')
          .upsert({
            user_id: collab.id,
            user_name: collab.name,
            period_month: monthToArchive,
            checklists_sent: collab.checklistsSent,
            perfect_checklists: collab.perfectChecklists,
            trainings_completed: collab.trainingsCompleted,
            sales_registered: collab.salesRegistered,
            delays: collab.delays,
            critical_errors: collab.criticalErrors,
            total_points: collab.points,
            rank_position: i + 1
          }, {
            onConflict: 'user_id,period_month'
          });
      }

      // Reset current month scores
      const currentPeriod = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      await supabase
        .from('user_scores')
        .delete()
        .eq('period_start', currentPeriod);

      const monthLabel = format(new Date(monthToArchive), "MMMM 'de' yyyy", { locale: ptBR });
      toast({
        title: "Ranking arquivado",
        description: `O ranking de ${monthLabel} foi salvo e zerado para o novo período`,
      });

      loadData();
    } catch (error) {
      console.error('Error archiving ranking:', error);
      toast({
        title: "Erro",
        description: "Não foi possível arquivar o ranking",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Archive current month's data as the previous month (January if we're in February)
  const handleArchivePreviousMonth = async () => {
    const previousMonth = subMonths(new Date(), 1);
    const previousMonthDate = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
    await handleArchiveMonth(previousMonthDate);
  };

  const handleAdjustPoints = async (userId: string, amount: number) => {
    setIsUpdating(true);
    try {
      const currentPeriod = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      const { data: existingScore } = await supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('period_start', currentPeriod)
        .maybeSingle();

      if (existingScore) {
        const newTotal = Math.max(0, (existingScore.total_points || 0) + amount);
        const { error } = await supabase
          .from('user_scores')
          .update({ total_points: newTotal })
          .eq('id', existingScore.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_scores')
          .insert({
            user_id: userId,
            period_start: currentPeriod,
            total_points: Math.max(0, amount)
          });

        if (error) throw error;
      }

      toast({
        title: "Pontuação atualizada",
        description: `${amount > 0 ? '+' : ''}${amount} pontos`,
      });

      loadData();
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ajustar os pontos",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
      setPointsToAdjust("");
      setSelectedUser(null);
    }
  };

  const maxPoints = collaborators[0]?.points || 100;
  const totalScore = collaborators.reduce((acc, c) => acc + c.points, 0);
  
  const getTeamStatus = () => {
    if (!raceConfig) return { status: 'Aguardando', color: 'bg-muted', textColor: 'text-muted-foreground' };
    const progressPercent = (raceConfig.current_position / raceConfig.goal_target) * 100;
    if (progressPercent >= 70) return { status: 'Bom', color: 'bg-green-500', textColor: 'text-green-700' };
    if (progressPercent >= 40) return { status: 'Atenção', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { status: 'Início', color: 'bg-blue-500', textColor: 'text-blue-700' };
  };
  
  const teamStatus = getTeamStatus();

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="h-6 w-6 flex items-center justify-center text-muted-foreground font-medium">{position}º</span>;
    }
  };

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300 dark:from-yellow-950/30 dark:to-yellow-900/20 dark:border-yellow-700';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 dark:from-gray-800/30 dark:to-gray-700/20 dark:border-gray-600';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-700';
      default:
        return 'bg-card border-border';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ranking</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho individual e da equipe</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isManager && !isViewingHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchivePreviousMonth}
              disabled={isUpdating}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Arquivar {format(subMonths(new Date(), 1), "MMMM", { locale: ptBR })}
            </Button>
          )}
        </div>
      </div>

      {isViewingHistory && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <History className="h-4 w-4" />
              <span className="text-sm font-medium">
                Visualizando histórico de {availableMonths.find(m => m.value === selectedMonth)?.label}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Ranking - Only show for current month */}
      {!isViewingHistory && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Ranking da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Pontuação Total</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{totalScore}</span>
                  <span className="text-sm text-muted-foreground">pontos</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Colaboradores</p>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-xl font-bold text-foreground">{collaborators.length}</span>
                  <span className="text-sm text-muted-foreground">ativos</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Status da Equipe</p>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${teamStatus.color}`} />
                  <span className={`text-xl font-bold ${teamStatus.textColor}`}>{teamStatus.status}</span>
                </div>
                {raceConfig && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Corrida: Casa {raceConfig.current_position}/{raceConfig.goal_target}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Ranking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Ranking Individual
              {isViewingHistory && (
                <Badge variant="secondary">Histórico</Badge>
              )}
            </div>
            {isManager && !isViewingHistory && (
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
        <CardContent>
          {collaborators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">
                {isViewingHistory ? "Nenhum registro encontrado para este mês" : "Nenhum colaborador no ranking"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isViewingHistory 
                  ? "O histórico deste mês pode não ter sido arquivado"
                  : "O ranking será preenchido quando colaboradoras completarem o perfil"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {collaborators.map((collaborator, index) => {
                const position = index + 1;
                const progressPercent = maxPoints > 0 ? (collaborator.points / maxPoints) * 100 : 0;
                
                return (
                  <div
                    key={collaborator.id}
                    className={`p-4 rounded-lg border-2 transition-all ${getPositionStyle(position)}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                        {getRankIcon(position)}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{collaborator.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {collaborator.role}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>{collaborator.checklistsSent} enviados</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{collaborator.perfectChecklists} perfeitos</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 text-orange-500" />
                            <span>{collaborator.delays} atrasos</span>
                          </div>
                          {collaborator.criticalErrors > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-500">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{collaborator.criticalErrors} erros</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <BookOpen className="h-3 w-3 text-blue-500" />
                            <span>{collaborator.trainingsCompleted} treinamentos</span>
                          </div>
                          {collaborator.salesRegistered > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <DollarSign className="h-3 w-3 text-emerald-500" />
                              <span>{collaborator.salesRegistered} vendas</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2">
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right flex items-center gap-2">
                        {showPointsControl && isManager && !isViewingHistory && (
                          <div className="flex items-center gap-1">
                            {selectedUser === collaborator.id ? (
                              <>
                                <Input
                                  type="number"
                                  placeholder="Pts"
                                  value={pointsToAdjust}
                                  onChange={(e) => setPointsToAdjust(e.target.value)}
                                  className="w-16 h-8 text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isUpdating || !pointsToAdjust}
                                  onClick={() => handleAdjustPoints(collaborator.id, parseInt(pointsToAdjust) || 0)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isUpdating || !pointsToAdjust}
                                  onClick={() => handleAdjustPoints(collaborator.id, -(Math.abs(parseInt(pointsToAdjust)) || 0))}
                                  className="h-8 w-8 p-0"
                                >
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedUser(collaborator.id)}
                                className="h-8 text-xs"
                              >
                                <Settings2 className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            )}
                          </div>
                        )}
                        <div>
                          <span className="text-2xl font-bold text-primary">{collaborator.points}</span>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How Ranking Works - Only show for current month */}
      {!isViewingHistory && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Info className="h-5 w-5" />
              Como Funciona o Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Como Ganhar Pontos
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-8 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center">+3</span>
                    <span className="text-foreground">Checklist enviado no prazo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-8 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center">+5</span>
                    <span className="text-foreground">Checklist perfeito (100%)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-8 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center">+5</span>
                    <span className="text-foreground">Treinamento concluído</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-8 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center">+5</span>
                    <span className="text-foreground">Venda registrada</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Como Perder Pontos
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-8 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold flex items-center justify-center">-3</span>
                    <span className="text-foreground">Atraso registrado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-8 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold flex items-center justify-center">-5</span>
                    <span className="text-foreground">Erro crítico</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-8 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold flex items-center justify-center">-8</span>
                    <span className="text-foreground">Checklist não enviado</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Ciclo Mensal
                </h4>
                <div className="text-sm text-foreground space-y-2">
                  <p>
                    O ranking é <strong>zerado</strong> todo primeiro dia do mês.
                  </p>
                  <p>
                    Os dados anteriores ficam salvos no <strong>histórico</strong> para consulta.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RankingModule;
