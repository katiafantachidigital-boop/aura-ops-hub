import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DollarSign, 
  Plus, 
  Loader2,
  History,
  Calendar,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashRegisterEntry {
  id: string;
  total_value: number;
  register_date: string;
  registered_by: string;
  registered_by_name: string;
  created_at: string;
}

export function CaixaModule() {
  const { user, profile, isManager, canSubmitChecklist } = useAuth();
  const [entries, setEntries] = useState<CashRegisterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalValue, setTotalValue] = useState("");

  // Check if user can access this module
  const canAccess = isManager || canSubmitChecklist;

  useEffect(() => {
    if (canAccess) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [canAccess]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from("cash_register")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading cash register data:", error);
      toast.error("Erro ao carregar dados do caixa");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const value = parseFloat(totalValue);
    
    if (!value || value <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    if (!user || !profile) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("cash_register")
        .insert({
          total_value: value,
          registered_by: user.id,
          registered_by_name: profile.full_name || "Usuário",
        })
        .select()
        .single();

      if (error) throw error;

      setEntries([data, ...entries]);
      setTotalValue("");
      toast.success(`Lançamento de R$ ${value.toFixed(2)} registrado!`);
    } catch (error) {
      console.error("Error submitting cash register:", error);
      toast.error("Erro ao registrar lançamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate today's total
  const today = format(new Date(), "yyyy-MM-dd");
  const todaysTotal = entries
    .filter(entry => entry.register_date === today)
    .reduce((sum, entry) => sum + entry.total_value, 0);

  // Calculate current month's total
  const currentMonth = format(new Date(), "yyyy-MM");
  const monthlyTotal = entries
    .filter(entry => entry.register_date.startsWith(currentMonth))
    .reduce((sum, entry) => sum + entry.total_value, 0);

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Apenas gestoras e supervisoras podem acessar o caixa.
          </p>
        </div>
      </div>
    );
  }

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
      <div>
        <h2 className="text-2xl font-bold gradient-text">Caixa</h2>
        <p className="text-muted-foreground">Registre o valor total das vendas do dia</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendas de Hoje</p>
                <p className="text-xl font-bold text-emerald-600">
                  R$ {todaysTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendas do Mês</p>
                <p className="text-xl font-bold text-blue-600">
                  R$ {monthlyTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Register Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Lançar Caixa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor Total das Vendas de Hoje (R$)
              </Label>
              <Input
                type="number"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="text-lg"
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !totalValue || parseFloat(totalValue) <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Lançar no Caixa
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Lançamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum lançamento registrado</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-600">
                            R$ {entry.total_value.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(entry.register_date), "dd/MM/yyyy", { locale: ptBR })}
                            <span className="mx-1">•</span>
                            <User className="w-3 h-3" />
                            {entry.registered_by_name}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
