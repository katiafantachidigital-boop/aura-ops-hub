import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface UserScore {
  user_id: string;
  checklists_sent: number;
  perfect_checklists: number;
  delays: number;
  critical_errors: number;
  trainings_completed: number;
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

interface GoalsRaceConfig {
  current_position: number;
  goal_target: number;
}

const RankingModule: React.FC = () => {
  const { isManager } = useAuth();
  const [collaborators, setCollaborators] = useState<CollaboratorRanking[]>([]);
  const [raceConfig, setRaceConfig] = useState<GoalsRaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPointsControl, setShowPointsControl] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pointsToAdjust, setPointsToAdjust] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Carregar configuração da corrida
    const { data: raceData } = await supabase
      .from('goals_race_config')
      .select('current_position, goal_target')
      .eq('is_active', true)
      .maybeSingle();

    setRaceConfig(raceData);

    // Carregar perfis
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, custom_role, role')
      .eq('profile_completed', true);

    // Carregar pontuações
    const { data: scores } = await supabase
      .from('user_scores')
      .select('*');

    // Combinar dados
    const combined: CollaboratorRanking[] = (profiles || []).map((profile: Profile) => {
      const score = scores?.find((s: UserScore) => s.user_id === profile.id);
      // Nova fórmula de pontos: checklist=3, perfeito=5, treinamento=5, venda=5
      const points = score ? (
        (score.checklists_sent * 3) +
        (score.perfect_checklists * 5) +
        (score.trainings_completed * 5) +
        ((score as any).sales_registered || 0) * 5 -
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
        salesRegistered: (score as any)?.sales_registered || 0,
      };
    });

    setCollaborators(combined.sort((a, b) => b.points - a.points));
    setLoading(false);
  };

  const handleAdjustPoints = async (userId: string, amount: number) => {
    setIsUpdating(true);
    try {
      const currentPeriod = new Date();
      currentPeriod.setDate(1);
      const periodStart = currentPeriod.toISOString().split('T')[0];

      const { data: existingScore } = await supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('period_start', periodStart)
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
            period_start: periodStart,
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ranking</h1>
        <p className="text-muted-foreground">Acompanhe o desempenho individual e da equipe</p>
      </div>

      {/* Ranking da Equipe */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Ranking da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pontuação Total */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Pontuação Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{totalScore}</span>
                <span className="text-sm text-muted-foreground">pontos</span>
              </div>
            </div>

            {/* Colaboradores */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Colaboradores</p>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xl font-bold text-foreground">{collaborators.length}</span>
                <span className="text-sm text-muted-foreground">ativos</span>
              </div>
            </div>

            {/* Status Visual */}
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

      {/* Ranking Individual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Ranking Individual
            </div>
            {isManager && (
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
              <p className="text-muted-foreground font-medium mb-1">Nenhum colaborador no ranking</p>
              <p className="text-sm text-muted-foreground">
                O ranking será preenchido quando colaboradoras completarem o perfil
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
                      {/* Posição */}
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                        {getRankIcon(position)}
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{collaborator.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {collaborator.role}
                          </Badge>
                        </div>
                        
                        {/* Indicadores de Comportamento */}
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

                        {/* Barra de Progresso */}
                        <div className="mt-2">
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      </div>

                      {/* Pontos */}
                      <div className="flex-shrink-0 text-right flex items-center gap-2">
                        {showPointsControl && isManager && (
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

      {/* Como Funciona o Ranking */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Info className="h-5 w-5" />
            Como Funciona o Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Como Ganhar Pontos */}
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

            {/* Como Perder Pontos */}
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

            {/* Por que o Ranking Existe */}
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Por que o Ranking Existe
              </h4>
              <div className="text-sm text-foreground space-y-2">
                <p>
                  O ranking existe para <strong>reconhecer</strong> e <strong>valorizar</strong> o esforço 
                  de cada colaboradora.
                </p>
                <p>
                  Ele promove uma competição <strong>saudável</strong> e <strong>transparente</strong>, 
                  onde todos sabem como melhorar.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingModule;
