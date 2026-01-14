import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DollarSign, 
  Plus, 
  Trash2,
  Loader2,
  History,
  ShoppingCart,
  UserCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
}

interface SalesGoalsConfig {
  id: string;
  current_value: number;
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

export function SalesRegistrationModule() {
  const { user, profile, isManager } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [config, setConfig] = useState<SalesGoalsConfig | null>(null);
  const [events, setEvents] = useState<SalesEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedClientId, setSelectedClientId] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [saleValue, setSaleValue] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

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

      // Load recent sales events
      if (configData) {
        const { data: eventsData, error: eventsError } = await supabase
          .from("sales_events")
          .select("*")
          .eq("config_id", configData.id)
          .order("created_at", { ascending: false })
          .limit(30);

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

    if (!selectedClientId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (!procedureName.trim()) {
      toast.error("Digite o nome do procedimento");
      return;
    }

    const value = parseFloat(saleValue);
    if (isNaN(value) || value <= 0) {
      toast.error("Digite um valor válido para a venda");
      return;
    }

    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (!selectedClient) {
      toast.error("Cliente não encontrado");
      return;
    }

    setIsSubmitting(true);
    try {
      const description = `${procedureName} - Cliente: ${selectedClient.name}`;

      // Add sale event
      const { data: eventData, error: eventError } = await supabase
        .from("sales_events")
        .insert({
          config_id: config.id,
          sale_value: value,
          description,
          created_by: user?.id,
          created_by_name: profile?.full_name || "Usuário",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Update current_value
      const newValue = config.current_value + value;
      const { error: updateError } = await supabase
        .from("sales_goals_config")
        .update({ current_value: newValue })
        .eq("id", config.id);

      if (updateError) throw updateError;

      setConfig({ ...config, current_value: newValue });
      setEvents([eventData, ...events]);
      
      // Reset form
      setSelectedClientId("");
      setProcedureName("");
      setSaleValue("");
      
      toast.success(`Venda de R$ ${value.toFixed(2)} registrada com sucesso!`);
    } catch (error) {
      console.error("Error adding sale:", error);
      toast.error("Erro ao registrar venda");
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
        <p className="text-muted-foreground">Registre as vendas realizadas para contabilizar nas metas</p>
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
          {/* Sale Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Nova Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Cliente *
                </Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum cliente cadastrado
                      </SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Procedimento *</Label>
                <Input
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  placeholder="Ex: Limpeza de pele, Massagem relaxante..."
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor da Venda (R$) *
                </Label>
                <Input
                  type="number"
                  value={saleValue}
                  onChange={(e) => setSaleValue(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                />
              </div>

              <Button 
                onClick={handleSubmitSale} 
                disabled={isSubmitting || !selectedClientId || !procedureName || !saleValue}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Registrar Venda
              </Button>

              {clients.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum cliente cadastrado. Cadastre um cliente primeiro no Dashboard.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sales History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="w-5 h-5" />
                Últimas Vendas
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
