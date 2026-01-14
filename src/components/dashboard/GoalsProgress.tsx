import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GoalsRaceConfig {
  current_position: number;
  goal_target: number;
}

export function GoalsProgress() {
  const [config, setConfig] = useState<GoalsRaceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase
        .from('goals_race_config')
        .select('current_position, goal_target')
        .eq('is_active', true)
        .maybeSingle();
      
      setConfig(data);
      setLoading(false);
    };

    loadConfig();
  }, []);

  const percentage = config ? Math.round((config.current_position / config.goal_target) * 100) : 0;

  return (
    <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Pontuação
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : config ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Progresso da Equipe</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {percentage}%
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Posição: {config.current_position} casas</span>
              <span>Meta: {config.goal_target} casas</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Configure a Pontuação para ver o progresso
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
