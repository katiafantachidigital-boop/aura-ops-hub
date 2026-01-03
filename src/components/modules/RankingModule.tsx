import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Medal, 
  Award,
  TrendingUp, 
  TrendingDown,
  Minus,
  CheckCircle2,
  Star,
  Clock,
  AlertTriangle,
  BookOpen,
  Info,
  Users,
  Target
} from 'lucide-react';

// Mock data - será substituído por dados reais do banco
const mockCollaborators = [
  { 
    id: 1, 
    name: 'Maria Silva', 
    role: 'Esteticista', 
    points: 156,
    checklistsSent: 20,
    perfectChecklists: 15,
    delays: 1,
    criticalErrors: 0,
    trainingsCompleted: 5
  },
  { 
    id: 2, 
    name: 'Ana Costa', 
    role: 'Recepcionista', 
    points: 142,
    checklistsSent: 18,
    perfectChecklists: 12,
    delays: 2,
    criticalErrors: 0,
    trainingsCompleted: 4
  },
  { 
    id: 3, 
    name: 'Juliana Santos', 
    role: 'Esteticista', 
    points: 128,
    checklistsSent: 17,
    perfectChecklists: 10,
    delays: 3,
    criticalErrors: 1,
    trainingsCompleted: 3
  },
  { 
    id: 4, 
    name: 'Carla Oliveira', 
    role: 'Supervisora', 
    points: 115,
    checklistsSent: 15,
    perfectChecklists: 8,
    delays: 2,
    criticalErrors: 0,
    trainingsCompleted: 4
  },
  { 
    id: 5, 
    name: 'Fernanda Lima', 
    role: 'Esteticista', 
    points: 98,
    checklistsSent: 14,
    perfectChecklists: 6,
    delays: 4,
    criticalErrors: 1,
    trainingsCompleted: 2
  },
];

const teamStats = {
  currentScore: 639,
  previousScore: 580,
  goalPosition: 12,
  totalGoal: 20,
};

const RankingModule: React.FC = () => {
  const sortedCollaborators = [...mockCollaborators].sort((a, b) => b.points - a.points);
  const maxPoints = sortedCollaborators[0]?.points || 100;
  
  const scoreDifference = teamStats.currentScore - teamStats.previousScore;
  const scorePercentChange = ((scoreDifference / teamStats.previousScore) * 100).toFixed(1);
  
  const getTeamStatus = () => {
    const progressPercent = (teamStats.goalPosition / teamStats.totalGoal) * 100;
    if (progressPercent >= 70) return { status: 'Bom', color: 'bg-green-500', textColor: 'text-green-700' };
    if (progressPercent >= 40) return { status: 'Atenção', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { status: 'Crítico', color: 'bg-red-500', textColor: 'text-red-700' };
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
                <span className="text-3xl font-bold text-foreground">{teamStats.currentScore}</span>
                <span className="text-sm text-muted-foreground">pontos</span>
              </div>
            </div>

            {/* Comparação com Período Anterior */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">vs. Período Anterior</p>
              <div className="flex items-center gap-2">
                {scoreDifference > 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-xl font-bold text-green-600">+{scoreDifference}</span>
                    <span className="text-sm text-green-600">(+{scorePercentChange}%)</span>
                  </>
                ) : scoreDifference < 0 ? (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <span className="text-xl font-bold text-red-600">{scoreDifference}</span>
                    <span className="text-sm text-red-600">({scorePercentChange}%)</span>
                  </>
                ) : (
                  <>
                    <Minus className="h-5 w-5 text-gray-500" />
                    <span className="text-xl font-bold text-gray-600">0</span>
                    <span className="text-sm text-gray-600">(0%)</span>
                  </>
                )}
              </div>
            </div>

            {/* Status Visual */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Status da Equipe</p>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${teamStatus.color}`} />
                <span className={`text-xl font-bold ${teamStatus.textColor}`}>{teamStatus.status}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Corrida: Casa {teamStats.goalPosition}/{teamStats.totalGoal}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking Individual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Ranking Individual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedCollaborators.map((collaborator, index) => {
              const position = index + 1;
              const progressPercent = (collaborator.points / maxPoints) * 100;
              
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
                      </div>

                      {/* Barra de Progresso */}
                      <div className="mt-2">
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    </div>

                    {/* Pontos */}
                    <div className="flex-shrink-0 text-right">
                      <span className="text-2xl font-bold text-primary">{collaborator.points}</span>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
                  <span className="w-8 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center">+5</span>
                  <span className="text-foreground">Checklist enviado no prazo</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-8 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center">+10</span>
                  <span className="text-foreground">Checklist perfeito (100%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-8 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center">+3</span>
                  <span className="text-foreground">Treinamento concluído</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-8 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center">+2</span>
                  <span className="text-foreground">Semana como supervisora</span>
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
                <li className="flex items-center gap-2">
                  <span className="w-8 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold flex items-center justify-center">-2</span>
                  <span className="text-foreground">Item do checklist incompleto</span>
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
                <p>
                  O objetivo é criar uma cultura de <strong>excelência</strong> e 
                  <strong> melhoria contínua</strong>.
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
