import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface RaceEvent {
  id: string;
  type: "advance" | "retreat";
  reason: string;
  houses: number;
  date: string;
  description: string;
}

export function GoalsRaceModule() {
  const { toast } = useToast();
  const { isManager } = useAuth();
  const [currentPosition, setCurrentPosition] = useState(7);
  const [goalTarget, setGoalTarget] = useState(20);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState(goalTarget.toString());

  const [events] = useState<RaceEvent[]>([
    { id: "1", type: "advance", reason: "Checklist enviado", houses: 1, date: "02/01/2026", description: "Checklist do dia enviado por Maria" },
    { id: "2", type: "advance", reason: "Checklist perfeito", houses: 2, date: "01/01/2026", description: "100% de conformidade - Ana" },
    { id: "3", type: "retreat", reason: "Atraso", houses: 1, date: "31/12/2025", description: "Colaboradora chegou atrasada" },
    { id: "4", type: "advance", reason: "Checklist enviado", houses: 1, date: "30/12/2025", description: "Checklist do dia enviado por Carla" },
    { id: "5", type: "retreat", reason: "Checklist não enviado", houses: 2, date: "29/12/2025", description: "Dia sem checklist registrado" },
  ]);

  const progressPercentage = Math.min((currentPosition / goalTarget) * 100, 100);
  const housesRemaining = goalTarget - currentPosition;

  const handleSaveGoal = () => {
    const newTarget = parseInt(newGoalTarget);
    if (isNaN(newTarget) || newTarget < 1) {
      toast({
        title: "Valor inválido",
        description: "A meta deve ser um número maior que zero.",
        variant: "destructive",
      });
      return;
    }
    setGoalTarget(newTarget);
    setIsConfiguring(false);
    toast({
      title: "Meta atualizada!",
      description: `Nova meta definida: ${newTarget} casas`,
    });
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
    if (event.type === "advance") {
      switch (event.reason) {
        case "Checklist perfeito":
          return <Sparkles className="h-4 w-4 text-emerald" />;
        case "Checklist enviado":
          return <CheckCircle2 className="h-4 w-4 text-emerald" />;
        default:
          return <TrendingUp className="h-4 w-4 text-emerald" />;
      }
    } else {
      switch (event.reason) {
        case "Atraso":
          return <Clock className="h-4 w-4 text-amber-500" />;
        case "Erro crítico":
          return <AlertTriangle className="h-4 w-4 text-destructive" />;
        case "Checklist não enviado":
          return <XCircle className="h-4 w-4 text-destructive" />;
        default:
          return <TrendingDown className="h-4 w-4 text-destructive" />;
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Corrida da Meta</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o progresso da equipe em direção à meta
          </p>
        </div>
        {isManager && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsConfiguring(!isConfiguring)}
          >
            <Settings className="h-4 w-4" />
            Configurar Meta
          </Button>
        )}
      </div>

      {/* Configuration Panel */}
      {isConfiguring && (
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
                <CardTitle>Progresso da Equipe</CardTitle>
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
              <p className="text-2xl font-bold text-emerald">
                +{events.filter(e => e.type === "advance").reduce((acc, e) => acc + e.houses, 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Recuos</span>
              </div>
              <p className="text-2xl font-bold text-destructive">
                -{events.filter(e => e.type === "retreat").reduce((acc, e) => acc + e.houses, 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Checklists</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {events.filter(e => e.reason.includes("Checklist") && e.type === "advance").length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Perfeitos</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">
                {events.filter(e => e.reason === "Checklist perfeito").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Card */}
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
                  <span className="text-sm">Checklist enviado</span>
                  <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald/20">+1 casa</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald/5 border border-emerald/10">
                  <span className="text-sm">Checklist perfeito (100%)</span>
                  <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald/20">+2 casas</Badge>
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

      {/* Events History */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Eventos</CardTitle>
          <CardDescription>Últimos movimentos na corrida</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => (
              <div 
                key={event.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                  event.type === "advance" 
                    ? "bg-emerald/5 border-emerald/10" 
                    : "bg-destructive/5 border-destructive/10"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  event.type === "advance" ? "bg-emerald/10" : "bg-destructive/10"
                )}>
                  {getEventIcon(event)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{event.reason}</p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        event.type === "advance" 
                          ? "bg-emerald/10 text-emerald border-emerald/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      )}
                    >
                      {event.type === "advance" ? "+" : "-"}{event.houses} {event.houses === 1 ? "casa" : "casas"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{event.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
