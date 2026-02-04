import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target, 
  Trophy, 
  Flag, 
  Plus, 
  Minus, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  Loader2,
  Settings2,
  MinusCircle,
  Calendar,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RaceEvent {
  id: string;
  event_type: string;
  points: number;
  description: string | null;
  created_at: string;
}

interface GoalsRaceConfig {
  id: string;
  current_position: number;
  goal_target: number;
}

interface GoalsRaceHistory {
  period_month: string;
  final_position: number;
  goal_target: number;
  total_advances: number;
  total_retreats: number;
  perfect_checklists: number;
  regular_checklists: number;
}

export function GoalsRaceModule() {
  const { toast } = useToast();
  const { isManager } = useAuth();
  const [config, setConfig] = useState<GoalsRaceConfig | null>(null);
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [showRaceControl, setShowRaceControl] = useState(false);
  const [racePointsToAdjust, setRacePointsToAdjust] = useState<string>("");
  const [isUpdatingRace, setIsUpdatingRace] = useState(false);
  
  // Month selection for historical data
  const [selectedMonth, setSelectedMonth] = useState<string>("current");
  const [availableMonths, setAvailableMonths] = useState<{value: string, label: string}[]>([]);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [historyData, setHistoryData] = useState<GoalsRaceHistory | null>(null);

  useEffect(() => {
    generateAvailableMonths();
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMonth === "current") {
      setIsViewingHistory(false);
      setHistoryData(null);
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
    
    const { data, error } = await supabase
      .from('goals_race_history')
      .select('*')
      .eq('period_month', monthDate)
      .maybeSingle();

    if (error) {
      console.error('Error loading historical race:', error);
      setHistoryData(null);
    } else {
      setHistoryData(data);
    }
    
    setLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    
    // Load active config
    const { data: configData } = await supabase
      .from('goals_race_config')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (configData) {
      setConfig(configData);
      setNewGoalTarget(configData.goal_target.toString());

      // Load events
      const { data: eventsData } = await supabase
        .from('goals_race_events')
        .select('*')
        .eq('race_id', configData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setEvents(eventsData || []);
    }
    
    setLoading(false);
  };

  const handleArchiveCurrentMonth = async () => {
    if (!isManager || !config) return;
    
    setIsUpdatingRace(true);
    try {
      const currentPeriod = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      
      // Calculate totals from events
      const advances = events.filter(e => e.points > 0).reduce((acc, e) => acc + e.points, 0);
      const retreats = Math.abs(events.filter(e => e.points < 0).reduce((acc, e) => acc + e.points, 0));
      const perfectChecklists = events.filter(e => e.event_type === 'checklist_perfect').length;
      const regularChecklists = events.filter(e => e.event_type === 'checklist_sent').length;

      // Archive current race data
      await supabase
        .from('goals_race_history')
        .upsert({
          period_month: currentPeriod,
          final_position: config.current_position,
          goal_target: config.goal_target,
          total_advances: advances,
          total_retreats: retreats,
          perfect_checklists: perfectChecklists,
          regular_checklists: regularChecklists
        }, {
          onConflict: 'period_month'
        });

      // Reset current race position to 0
      await supabase
        .from('goals_race_config')
        .update({ current_position: 0 })
        .eq('id', config.id);

      // Delete current month's events
      await supabase
        .from('goals_race_events')
        .delete()
        .eq('race_id', config.id);

      toast({
        title: "Corrida arquivada",
        description: "A corrida do mês foi salva e zerada para o novo período",
      });

      setConfig({ ...config, current_position: 0 });
      setEvents([]);
      loadData();
    } catch (error) {
      console.error('Error archiving race:', error);
      toast({
        title: "Erro",
        description: "Não foi possível arquivar a corrida",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingRace(false);
    }
  };

  const currentPosition = isViewingHistory 
    ? (historyData?.final_position || 0) 
    : (config?.current_position || 0);
  const goalTarget = isViewingHistory 
    ? (historyData?.goal_target || 20) 
    : (config?.goal_target || 20);
  const progressPercentage = Math.min((currentPosition / goalTarget) * 100, 100);
  const housesRemaining = goalTarget - currentPosition;

  const handleSaveGoal = async () => {
    const newTarget = parseInt(newGoalTarget);
    if (isNaN(newTarget) || newTarget < 1) {
      toast({
        title: "Valor inválido",
        description: "A meta deve ser um número maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (config) {
      const { error } = await supabase
        .from('goals_race_config')
        .update({ goal_target: newTarget })
        .eq('id', config.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a meta.",
          variant: "destructive",
        });
        return;
      }

      setConfig({ ...config, goal_target: newTarget });
    }
    
    setIsConfiguring(false);
    toast({
      title: "Meta atualizada!",
      description: `Nova meta definida: ${newTarget} casas`,
    });
  };

  const handleAdjustRacePosition = async (amount: number) => {
    if (!config) {
      toast({
        title: "Erro",
        description: "Nenhuma corrida da meta ativa",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingRace(true);
    try {
      const newPosition = Math.max(0, config.current_position + amount);

      const { error: updateError } = await supabase
        .from('goals_race_config')
        .update({ current_position: newPosition })
        .eq('id', config.id);

      if (updateError) throw updateError;

      const { error: eventError } = await supabase
        .from('goals_race_events')
        .insert({
          race_id: config.id,
          event_type: amount > 0 ? 'checklist_sent' : 'delay',
          points: amount,
          description: `Ajuste manual: ${amount > 0 ? '+' : ''}${amount} casas`
        });

      if (eventError) throw eventError;

      toast({
        title: "Corrida atualizada",
        description: `${amount > 0 ? '+' : ''}${amount} casas`,
      });

      setConfig({ ...config, current_position: newPosition });
      loadData();
    } catch (error) {
      console.error('Error adjusting race:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ajustar a corrida",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingRace(false);
      setRacePointsToAdjust("");
    }
  };

  // Generate house indicators
  const renderHouses = () => {
    const houses = [];
    const maxVisibleHouses = Math.min(goalTarget, 20);
    const step = goalTarget > 20 ? Math.ceil(goalTarget / 20) : 1;
    
    for (let i = 0; i <= maxVisibleHouses; i++) {
      const houseNumber = i * step;
      if (houseNumber > goalTarget) break;
      
      const isCompleted = currentPosition >= houseNumber;
      const isCurrent = currentPosition === houseNumber || 
        (currentPosition > houseNumber && currentPosition < (i + 1) * step);
      const isGoal = houseNumber === goalTarget;
      
      houses.push(
        <div 
          key={houseNumber}
          className={cn(
            "relative flex flex-col items-center",
            i > 0 && "flex-1"
          )}
        >
          {/* Connection line */}
          {i > 0 && (
            <div className={cn(
              "absolute top-4 right-1/2 w-full h-1 -z-10",
              isCompleted ? "bg-primary" : "bg-muted"
            )} />
          )}
          
          {/* House marker */}
          <div className={cn(
            "relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
            isGoal && "w-10 h-10",
            isCompleted && !isCurrent ? "bg-primary text-primary-foreground" : "",
            isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/30 scale-125" : "",
            !isCompleted && !isCurrent ? "bg-muted text-muted-foreground" : "",
            isGoal && isCompleted ? "bg-emerald text-white" : ""
          )}>
            {isGoal ? <Trophy className="h-4 w-4" /> : houseNumber}
            
            {/* Current position indicator */}
            {isCurrent && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <div className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium">
                  Posição atual
                </div>
              </div>
            )}
          </div>
          
          {/* House number label */}
          <span className={cn(
            "text-[10px] mt-1",
            isCompleted ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {houseNumber}
          </span>
        </div>
      );
    }
    return houses;
  };

  const getEventIcon = (event: RaceEvent) => {
    const isAdvance = event.points > 0;
    if (isAdvance) {
      switch (event.event_type) {
        case "checklist_perfect":
          return <Sparkles className="h-4 w-4 text-emerald" />;
        case "checklist_sent":
          return <CheckCircle2 className="h-4 w-4 text-emerald" />;
        case "training_completed":
          return <TrendingUp className="h-4 w-4 text-emerald" />;
        default:
          return <TrendingUp className="h-4 w-4 text-emerald" />;
      }
    } else {
      switch (event.event_type) {
        case "delay":
          return <Clock className="h-4 w-4 text-amber-500" />;
        case "critical_error":
          return <AlertTriangle className="h-4 w-4 text-destructive" />;
        case "checklist_missing":
          return <XCircle className="h-4 w-4 text-destructive" />;
        default:
          return <TrendingDown className="h-4 w-4 text-destructive" />;
      }
    }
  };

  const getEventLabel = (type: string) => {
    const labels: Record<string, string> = {
      checklist_sent: "Checklist enviado",
      checklist_perfect: "Checklist perfeito",
      delay: "Atraso",
      critical_error: "Erro crítico",
      checklist_missing: "Checklist não enviado",
      training_completed: "Treinamento concluído"
    };
    return labels[type] || type;
  };

  const advances = isViewingHistory 
    ? (historyData?.total_advances || 0) 
    : events.filter(e => e.points > 0).reduce((acc, e) => acc + e.points, 0);
  const retreats = isViewingHistory 
    ? (historyData?.total_retreats || 0) 
    : Math.abs(events.filter(e => e.points < 0).reduce((acc, e) => acc + e.points, 0));
  const checklistEvents = isViewingHistory 
    ? (historyData?.regular_checklists || 0) 
    : events.filter(e => e.event_type.includes('checklist') && e.points > 0).length;
  const perfectEvents = isViewingHistory 
    ? (historyData?.perfect_checklists || 0) 
    : events.filter(e => e.event_type === 'checklist_perfect').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Corrida da Meta</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o progresso da equipe em direção à meta
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
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
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchiveCurrentMonth}
                disabled={isUpdatingRace}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                Arquivar Mês
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowRaceControl(!showRaceControl)}
              >
                <Settings2 className="h-4 w-4" />
                Ajustar Casas
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setIsConfiguring(!isConfiguring)}
              >
                <Settings className="h-4 w-4" />
                Configurar Meta
              </Button>
            </>
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

      {/* Race Position Control Panel */}
      {showRaceControl && isManager && !isViewingHistory && (
        <Card variant="glass" className="animate-fade-in border-2 border-dashed border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Ajustar Posição na Corrida
            </CardTitle>
            <CardDescription>Adicione ou remova casas manualmente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="raceAdjust">Número de casas</Label>
                <Input
                  id="raceAdjust"
                  type="number"
                  placeholder="Ex: 5"
                  value={racePointsToAdjust}
                  onChange={(e) => setRacePointsToAdjust(e.target.value)}
                />
              </div>
              <Button
                disabled={isUpdatingRace || !racePointsToAdjust}
                onClick={() => handleAdjustRacePosition(parseInt(racePointsToAdjust) || 0)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Avançar
              </Button>
              <Button
                variant="destructive"
                disabled={isUpdatingRace || !racePointsToAdjust}
                onClick={() => handleAdjustRacePosition(-(Math.abs(parseInt(racePointsToAdjust)) || 0))}
              >
                <MinusCircle className="h-4 w-4 mr-1" />
                Recuar
              </Button>
              <Button variant="ghost" onClick={() => setShowRaceControl(false)}>Fechar</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Posição atual: <strong>{config?.current_position || 0}</strong> casas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configuration Panel */}
      {isConfiguring && !isViewingHistory && (
        <Card variant="glass" className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Configurar Meta</CardTitle>
            <CardDescription>Defina o número de casas para a meta da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="goalTarget">Número de casas</Label>
                <Input
                  id="goalTarget"
                  type="number"
                  min="1"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-32"
                />
              </div>
              <Button onClick={handleSaveGoal}>Salvar</Button>
              <Button variant="ghost" onClick={() => setIsConfiguring(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Progress Card */}
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Target className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>
                  Progresso da Equipe
                  {isViewingHistory && <Badge variant="secondary" className="ml-2">Histórico</Badge>}
                </CardTitle>
                <CardDescription>
                  Casa {currentPosition} de {goalTarget}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{Math.round(progressPercentage)}%</p>
              <p className="text-sm text-muted-foreground">
                {housesRemaining > 0 ? `Faltam ${housesRemaining} casas` : "Meta atingida! 🎉"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Race Track */}
          <div className="relative mb-6 p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center justify-between pt-8 px-2">
              {/* Start flag */}
              <div className="flex flex-col items-center">
                <Flag className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Início</span>
              </div>
              
              {/* Houses track */}
              <div className="flex-1 flex items-center mx-4">
                {renderHouses()}
              </div>
              
              {/* End flag */}
              <div className="flex flex-col items-center">
                <Trophy className="h-5 w-5 text-amber-500 mb-1" />
                <span className="text-[10px] text-muted-foreground">Meta</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald" />
                <span className="text-sm text-muted-foreground">Avanços</span>
              </div>
              <p className="text-2xl font-bold text-emerald">+{advances}</p>
            </div>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Recuos</span>
              </div>
              <p className="text-2xl font-bold text-destructive">-{retreats}</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Checklists</span>
              </div>
              <p className="text-2xl font-bold text-primary">{checklistEvents}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Perfeitos</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">{perfectEvents}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Card - Only show for current month */}
      {!isViewingHistory && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Regras da Corrida</CardTitle>
            <CardDescription>Como a equipe avança ou recua na corrida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Advances */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald/10 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-emerald" />
                  </div>
                  <h3 className="font-semibold text-foreground">Avança</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald/5 border border-emerald/10">
                    <span className="text-sm">Checklist confirmado</span>
                    <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald/20">+1 casa</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald/5 border border-emerald/10">
                    <span className="text-sm">Checklist perfeito (100%)</span>
                    <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald/20">+3 casas</Badge>
                  </div>
                </div>
              </div>

              {/* Retreats */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Minus className="h-4 w-4 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-foreground">Recua</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <span className="text-sm">Atraso de colaborador</span>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">-1 casa</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <span className="text-sm">Erro crítico</span>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">-2 casas</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <span className="text-sm">Checklist não enviado</span>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">-2 casas</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events History - Only show for current month */}
      {!isViewingHistory && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Eventos</CardTitle>
            <CardDescription>Últimos movimentos na corrida</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Flag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium mb-1">Nenhum evento registrado</p>
                <p className="text-sm text-muted-foreground">
                  Os eventos aparecerão aqui quando checklists forem confirmados
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const isAdvance = event.points > 0;
                  return (
                    <div 
                      key={event.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                        isAdvance 
                          ? "bg-emerald/5 border-emerald/10" 
                          : "bg-destructive/5 border-destructive/10"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        isAdvance ? "bg-emerald/10" : "bg-destructive/10"
                      )}>
                        {getEventIcon(event)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{getEventLabel(event.event_type)}</p>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              isAdvance 
                                ? "bg-emerald/10 text-emerald border-emerald/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            )}
                          >
                            {isAdvance ? "+" : ""}{event.points} {Math.abs(event.points) === 1 ? "casa" : "casas"}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(event.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historical Summary - Only show when viewing history */}
      {isViewingHistory && !historyData && (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">Nenhum registro encontrado para este mês</p>
            <p className="text-sm text-muted-foreground mt-1">
              O histórico deste mês pode não ter sido arquivado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
