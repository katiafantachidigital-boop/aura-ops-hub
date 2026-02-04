import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  DollarSign, 
  Plus, 
  Trash2,
  Loader2,
  History,
  ShoppingCart,
  Hash,
  CalendarIcon,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SalesGoalsConfig {
  id: string;
  current_value: number;
}

interface SalesEvent {
  id: string;
  config_id: string;
  sale_value: number;
  sales_quantity: number | null;
  description: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export function SalesRegistrationModule() {
  const { user, profile, isManager } = useAuth();
  const [config, setConfig] = useState<SalesGoalsConfig | null>(null);
  const [events, setEvents] = useState<SalesEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Form states - simplified: just value and optional quantity
  const [totalValue, setTotalValue] = useState("");
  const [salesQuantity, setSalesQuantity] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load active sales config
      const { data: configData, error: configError } = await supabase
        .from("sales_goals_config")
        .select("id, current_value")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (configError) throw configError;
      setConfig(configData);

      // Load all sales events (we'll filter client-side for better UX)
      if (configData) {
        const { data: eventsData, error: eventsError } = await supabase
          .from("sales_events")
          .select("*")
          .eq("config_id", configData.id)
          .order("created_at", { ascending: false });

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSale = async () => {
    if (!config) {
      toast.error("Nenhuma meta de vendas configurada. Aguarde a gestora configurar.");
      return;
    }

    const value = parseFloat(totalValue) || 0;
    const quantity = parseInt(salesQuantity) || 0;

    if (value <= 0) {
      toast.error("Digite o valor total das vendas");
      return;
    }

    setIsSubmitting(true);
    try {
      // Build description
      const description = quantity > 0 
        ? `${quantity} venda(s) - R$ ${value.toFixed(2)}`
        : `R$ ${value.toFixed(2)}`;

      // Add sale event (just for tracking individual sales for commission purposes)
      const { data: eventData, error: eventError } = await supabase
        .from("sales_events")
        .insert({
          config_id: config.id,
          sale_value: value,
          sales_quantity: quantity > 0 ? quantity : null,
          description,
          created_by: user?.id,
          created_by_name: profile?.full_name || "Usuário",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Add points to user score (5 points per sale registration)
      if (user?.id) {
        const currentPeriod = new Date();
        currentPeriod.setDate(1);
        const periodStart = currentPeriod.toISOString().split('T')[0];

        // Try to update existing record or insert new one
        const { data: existingScore } = await supabase
          .from('user_scores')
          .select('id, sales_registered')
          .eq('user_id', user.id)
          .eq('period_start', periodStart)
          .maybeSingle();

        if (existingScore) {
          await supabase
            .from('user_scores')
            .update({ 
              sales_registered: (existingScore.sales_registered || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingScore.id);
        } else {
          await supabase
            .from('user_scores')
            .insert({
              user_id: user.id,
              period_start: periodStart,
              sales_registered: 1
            });
        }
      }

      setEvents([eventData, ...events]);
      
      // Reset form
      setTotalValue("");
      setSalesQuantity("");
      
      toast.success(`Venda de R$ ${value.toFixed(2)} registrada! (+5 pontos)`);
    } catch (error) {
      console.error("Error adding sale:", error);
      toast.error("Erro ao registrar vendas");
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

      setEvents(events.filter(e => e.id !== event.id));
      toast.success("Registro removido");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Erro ao remover registro");
    }
  };

  // Filter events by selected month and search query
  const filteredEvents = events.filter(event => {
    const eventDate = parseISO(event.created_at);
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    const isInMonth = isWithinInterval(eventDate, { start: monthStart, end: monthEnd });
    
    if (!isInMonth) return false;
    
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const matchesName = event.created_by_name.toLowerCase().includes(query);
    const matchesDescription = event.description?.toLowerCase().includes(query);
    const matchesValue = event.sale_value.toString().includes(query);
    const matchesDate = format(eventDate, "dd/MM/yyyy").includes(query);
    
    return matchesName || matchesDescription || matchesValue || matchesDate;
  });

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
        <h2 className="text-2xl font-bold gradient-text">Registrar Venda</h2>
        <p className="text-muted-foreground">Registre suas vendas para acompanhamento de comissões (+5 pontos por registro)</p>
      </div>

      {!config ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma meta configurada</h3>
            <p className="text-muted-foreground">
              Aguarde a gestora configurar as metas de vendas para poder registrar vendas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sale Registration Form - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Registrar Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Required field: Value */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor da Venda (R$) *
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
                <p className="text-xs text-muted-foreground">
                  Este valor serve para registro de comissão. O faturamento oficial é lançado no Caixa.
                </p>
              </div>

              {/* Optional field: Quantity */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="w-4 h-4" />
                  Quantidade de Vendas (opcional)
                </Label>
                <Input
                  type="number"
                  value={salesQuantity}
                  onChange={(e) => setSalesQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <Button 
                onClick={handleSubmitSale} 
                disabled={isSubmitting || !totalValue || parseFloat(totalValue) <= 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Registrar Venda
              </Button>
            </CardContent>
          </Card>

          {/* Sales History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="w-5 h-5" />
                Histórico de Registros
              </CardTitle>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                {/* Month picker */}
                <Popover open={showMonthPicker} onOpenChange={setShowMonthPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !selectedMonth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedMonth(date);
                          setShowMonthPicker(false);
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, valor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum registro encontrado</p>
                </div>
              ) : (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-2">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-600">
                              R$ {event.sale_value.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {event.created_by_name}
                          </Badge>
                          {isManager && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
