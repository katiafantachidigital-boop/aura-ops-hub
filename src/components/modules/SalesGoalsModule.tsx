import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  Plus, 
  Trash2, 
  DollarSign, 
  Target,
  TrendingUp,
  Trophy,
  Star,
  Crown,
  Loader2,
  History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalesGoalsConfig {
  id: string;
  min_goal: number;
  mid_goal: number;
  max_goal: number;
  current_value: number;
  is_active: boolean;
  period_start: string;
}

interface SalesEvent {
  id: string;
  config_id: string;
  sale_value: number;
  description: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export function SalesGoalsModule() {
  const { user, profile, isManager } = useAuth();
  const [config, setConfig] = useState<SalesGoalsConfig | null>(null);
  const [events, setEvents] = useState<SalesEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // Form states
  const [minGoal, setMinGoal] = useState("20");
  const [midGoal, setMidGoal] = useState("50");
  const [maxGoal, setMaxGoal] = useState("100");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load active config
      const { data: configData, error: configError } = await supabase
        .from("sales_goals_config")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (configError) throw configError;
      
      if (configData) {
        setConfig(configData);
        setMinGoal(String(configData.min_goal));
        setMidGoal(String(configData.mid_goal));
        setMaxGoal(String(configData.max_goal));

        // Load events for this config
        const { data: eventsData, error: eventsError } = await supabase
          .from("sales_events")
          .select("*")
          .eq("config_id", configData.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);
      }
    } catch (error) {
      console.error("Error loading sales goals:", error);
      toast.error("Erro ao carregar metas de vendas");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    const min = parseFloat(minGoal);
    const mid = parseFloat(midGoal);
    const max = parseFloat(maxGoal);

    if (isNaN(min) || isNaN(mid) || isNaN(max)) {
      toast.error("Por favor, insira valores numéricos válidos");
      return;
    }

    if (min >= mid || mid >= max) {
      toast.error("As metas devem ser em ordem crescente: Mínima < Média < Máxima");
      return;
    }

    setIsSubmitting(true);
    try {
      if (config) {
        // Update existing config
        const { error } = await supabase
          .from("sales_goals_config")
          .update({
            min_goal: min,
            mid_goal: mid,
            max_goal: max,
          })
          .eq("id", config.id);

        if (error) throw error;
        setConfig({ ...config, min_goal: min, mid_goal: mid, max_goal: max });
        toast.success("Metas atualizadas com sucesso!");
      } else {
        // Create new config
        const { data, error } = await supabase
          .from("sales_goals_config")
          .insert({
            min_goal: min,
            mid_goal: mid,
            max_goal: max,
            current_value: 0,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        setConfig(data);
        toast.success("Metas criadas com sucesso!");
      }
      setIsConfiguring(false);
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erro ao salvar metas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (event: SalesEvent) => {
    if (!config) return;

    try {
      const { error: deleteError } = await supabase
        .from("sales_events")
        .delete()
        .eq("id", event.id);

      if (deleteError) throw deleteError;

      // Update current_value
      const newValue = Math.max(0, config.current_value - event.sale_value);
      const { error: updateError } = await supabase
        .from("sales_goals_config")
        .update({ current_value: newValue })
        .eq("id", config.id);

      if (updateError) throw updateError;

      setConfig({ ...config, current_value: newValue });
      setEvents(events.filter(e => e.id !== event.id));
      toast.success("Venda removida");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Erro ao remover venda");
    }
  };

  const handleResetGoals = async () => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from("sales_goals_config")
        .update({ is_active: false })
        .eq("id", config.id);

      if (error) throw error;

      setConfig(null);
      setEvents([]);
      toast.success("Metas resetadas. Crie uma nova configuração.");
    } catch (error) {
      console.error("Error resetting goals:", error);
      toast.error("Erro ao resetar metas");
    }
  };

  const handleManualAdjust = async (amount: number) => {
    if (!config) return;

    const newValue = Math.max(0, config.current_value + amount);
    try {
      // Add event for manual adjustment
      const { data: eventData, error: eventError } = await supabase
        .from("sales_events")
        .insert({
          config_id: config.id,
          sale_value: amount,
          description: amount > 0 ? "Ajuste manual (+)" : "Ajuste manual (-)",
          created_by: user?.id,
          created_by_name: profile?.full_name || "Gestora",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      const { error: updateError } = await supabase
        .from("sales_goals_config")
        .update({ current_value: newValue })
        .eq("id", config.id);

      if (updateError) throw updateError;

      setConfig({ ...config, current_value: newValue });
      setEvents([eventData, ...events]);
      toast.success(`Valor ajustado para R$ ${newValue.toFixed(2)}`);
    } catch (error) {
      console.error("Error adjusting value:", error);
      toast.error("Erro ao ajustar valor");
    }
  };

  const renderTrack = () => {
    if (!config) return null;

    const totalHouses = Math.ceil(config.max_goal);
    const currentHouse = Math.min(Math.floor(config.current_value), totalHouses);
    const minPosition = Math.floor(config.min_goal);
    const midPosition = Math.floor(config.mid_goal);
    const maxPosition = totalHouses;

    // Calculate how many houses to show per row based on total
    const housesPerRow = totalHouses <= 50 ? 10 : 20;
    const rows = Math.ceil(totalHouses / housesPerRow);

    const getHouseClass = (index: number) => {
      const house = index + 1;
      const isCurrent = house === currentHouse;
      const isPassed = house <= currentHouse;
      const isMinGoal = house === minPosition;
      const isMidGoal = house === midPosition;
      const isMaxGoal = house === maxPosition;

      let baseClass = "relative flex items-center justify-center text-[8px] font-bold transition-all duration-300 ";
      
      if (isMaxGoal) {
        baseClass += isPassed 
          ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg" 
          : "bg-yellow-100 text-yellow-700 border-2 border-yellow-400";
      } else if (isMidGoal) {
        baseClass += isPassed 
          ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg" 
          : "bg-purple-100 text-purple-700 border-2 border-purple-400";
      } else if (isMinGoal) {
        baseClass += isPassed 
          ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg" 
          : "bg-green-100 text-green-700 border-2 border-green-400";
      } else if (isPassed) {
        baseClass += "bg-primary/80 text-primary-foreground";
      } else {
        baseClass += "bg-muted text-muted-foreground";
      }

      if (isCurrent && !isMinGoal && !isMidGoal && !isMaxGoal) {
        baseClass += " ring-2 ring-primary ring-offset-1 scale-110";
      }

      return baseClass;
    };

    const getHouseSize = () => {
      if (totalHouses <= 30) return "w-8 h-8 rounded-lg";
      if (totalHouses <= 50) return "w-6 h-6 rounded-md";
      if (totalHouses <= 100) return "w-5 h-5 rounded-md";
      return "w-4 h-4 rounded-sm";
    };

    const renderHouseContent = (index: number) => {
      const house = index + 1;
      const isMinGoal = house === minPosition;
      const isMidGoal = house === midPosition;
      const isMaxGoal = house === maxPosition;

      if (isMaxGoal) return <Crown className="w-3 h-3" />;
      if (isMidGoal) return <Star className="w-3 h-3" />;
      if (isMinGoal) return <Target className="w-3 h-3" />;
      return null;
    };

    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap gap-1 justify-center">
            {Array.from({ length: housesPerRow }).map((_, colIndex) => {
              const houseIndex = rowIndex * housesPerRow + colIndex;
              if (houseIndex >= totalHouses) return null;
              return (
                <div
                  key={houseIndex}
                  className={`${getHouseClass(houseIndex)} ${getHouseSize()}`}
                  title={`Casa ${houseIndex + 1}`}
                >
                  {renderHouseContent(houseIndex)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Metas de Vendas</h2>
          <p className="text-muted-foreground">Acompanhe o progresso da equipe nas vendas</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfiguring(!isConfiguring)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      {isManager && isConfiguring && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurar Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Meta Mínima (R$)
                </Label>
                <Input
                  type="number"
                  value={minGoal}
                  onChange={(e) => setMinGoal(e.target.value)}
                  placeholder="20"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  Meta Média (R$)
                </Label>
                <Input
                  type="number"
                  value={midGoal}
                  onChange={(e) => setMidGoal(e.target.value)}
                  placeholder="50"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Meta Máxima (R$)
                </Label>
                <Input
                  type="number"
                  value={maxGoal}
                  onChange={(e) => setMaxGoal(e.target.value)}
                  placeholder="100"
                  min="1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveConfig} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Target className="w-4 h-4 mr-2" />
                )}
                {config ? "Atualizar Metas" : "Criar Metas"}
              </Button>
              {config && (
                <Button variant="destructive" onClick={handleResetGoals}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Resetar
                </Button>
              )}
              <Button variant="ghost" onClick={() => setIsConfiguring(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* No config state */}
      {!config && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma meta configurada</h3>
            <p className="text-muted-foreground mb-4">
              {isManager 
                ? "Configure as metas de vendas para começar a acompanhar o progresso da equipe."
                : "Aguarde a gestora configurar as metas de vendas."}
            </p>
            {isManager && (
              <Button onClick={() => setIsConfiguring(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Configurar Metas
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {config && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Track Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trilha de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Stats */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-center">
                <div className="px-4 py-2 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">R$ {config.current_value.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Vendido</p>
                </div>
                <div className="text-2xl text-muted-foreground">/</div>
                <div className="px-4 py-2 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">R$ {config.max_goal.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Meta Máxima</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
                    <Target className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span>Meta 1: R$ {config.min_goal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500 flex items-center justify-center">
                    <Star className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span>Meta 2: R$ {config.mid_goal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500 flex items-center justify-center">
                    <Crown className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span>Meta 3: R$ {config.max_goal.toFixed(2)}</span>
                </div>
              </div>

              {/* Track */}
              <div className="p-4 bg-muted/30 rounded-xl">
                {renderTrack()}
              </div>

              {/* Goals Status */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg text-center transition-all ${
                  config.current_value >= config.min_goal 
                    ? "bg-green-500/20 border border-green-500" 
                    : "bg-muted"
                }`}>
                  <Target className={`w-5 h-5 mx-auto mb-1 ${
                    config.current_value >= config.min_goal ? "text-green-500" : "text-muted-foreground"
                  }`} />
                  <p className="text-xs font-medium">Meta 1</p>
                  <p className="text-xs text-muted-foreground">
                    {config.current_value >= config.min_goal ? "✓ Alcançada!" : `Faltam R$ ${(config.min_goal - config.current_value).toFixed(2)}`}
                  </p>
                </div>
                <div className={`p-3 rounded-lg text-center transition-all ${
                  config.current_value >= config.mid_goal 
                    ? "bg-purple-500/20 border border-purple-500" 
                    : "bg-muted"
                }`}>
                  <Star className={`w-5 h-5 mx-auto mb-1 ${
                    config.current_value >= config.mid_goal ? "text-purple-500" : "text-muted-foreground"
                  }`} />
                  <p className="text-xs font-medium">Meta 2</p>
                  <p className="text-xs text-muted-foreground">
                    {config.current_value >= config.mid_goal ? "✓ Alcançada!" : `Faltam R$ ${(config.mid_goal - config.current_value).toFixed(2)}`}
                  </p>
                </div>
                <div className={`p-3 rounded-lg text-center transition-all ${
                  config.current_value >= config.max_goal 
                    ? "bg-yellow-500/20 border border-yellow-500" 
                    : "bg-muted"
                }`}>
                  <Crown className={`w-5 h-5 mx-auto mb-1 ${
                    config.current_value >= config.max_goal ? "text-yellow-500" : "text-muted-foreground"
                  }`} />
                  <p className="text-xs font-medium">Meta 3</p>
                  <p className="text-xs text-muted-foreground">
                    {config.current_value >= config.max_goal ? "✓ Alcançada!" : `Faltam R$ ${(config.max_goal - config.current_value).toFixed(2)}`}
                  </p>
                </div>
              </div>

              {/* Manual Adjust (Manager only) */}
              {isManager && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Ajuste Manual</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => handleManualAdjust(-10)}>-10</Button>
                    <Button size="sm" variant="outline" onClick={() => handleManualAdjust(-5)}>-5</Button>
                    <Button size="sm" variant="outline" onClick={() => handleManualAdjust(-1)}>-1</Button>
                    <Button size="sm" variant="outline" onClick={() => handleManualAdjust(1)}>+1</Button>
                    <Button size="sm" variant="outline" onClick={() => handleManualAdjust(5)}>+5</Button>
                    <Button size="sm" variant="outline" onClick={() => handleManualAdjust(10)}>+10</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="w-5 h-5" />
                Histórico de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma venda registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg bg-muted/50 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant={event.sale_value > 0 ? "default" : "destructive"} className="text-xs">
                            {event.sale_value > 0 ? "+" : ""} R$ {event.sale_value.toFixed(2)}
                          </Badge>
                          {isManager && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDeleteEvent(event)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{event.created_by_name}</span>
                          <span>{format(new Date(event.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
