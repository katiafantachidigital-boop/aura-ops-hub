import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Plus, 
  Trash2,
  Loader2,
  History,
  ShoppingCart,
  CreditCard,
  Banknote,
  Receipt,
  Wallet,
  Hash
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalesGoalsConfig {
  id: string;
  current_value: number;
}

interface SalesEvent {
  id: string;
  config_id: string;
  sale_value: number;
  sales_quantity: number | null;
  payment_pix: number | null;
  payment_credit: number | null;
  payment_debit: number | null;
  payment_boleto: number | null;
  payment_cash: number | null;
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

  // Form states
  const [salesQuantity, setSalesQuantity] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [paymentPix, setPaymentPix] = useState("");
  const [paymentCredit, setPaymentCredit] = useState("");
  const [paymentDebit, setPaymentDebit] = useState("");
  const [paymentBoleto, setPaymentBoleto] = useState("");
  const [paymentCash, setPaymentCash] = useState("");

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

    const quantity = parseInt(salesQuantity) || 0;
    const value = parseFloat(totalValue) || 0;
    const pix = parseInt(paymentPix) || 0;
    const credit = parseInt(paymentCredit) || 0;
    const debit = parseInt(paymentDebit) || 0;
    const boleto = parseInt(paymentBoleto) || 0;
    const cash = parseInt(paymentCash) || 0;

    if (quantity <= 0) {
      toast.error("Digite a quantidade de vendas");
      return;
    }

    if (value <= 0) {
      toast.error("Digite o valor total das vendas");
      return;
    }

    const totalPayments = pix + credit + debit + boleto + cash;
    if (totalPayments !== quantity) {
      toast.error(`A soma dos métodos de pagamento (${totalPayments}) deve ser igual à quantidade de vendas (${quantity})`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Build description
      const paymentDetails: string[] = [];
      if (pix > 0) paymentDetails.push(`${pix} PIX`);
      if (credit > 0) paymentDetails.push(`${credit} Crédito`);
      if (debit > 0) paymentDetails.push(`${debit} Débito`);
      if (boleto > 0) paymentDetails.push(`${boleto} Boleto`);
      if (cash > 0) paymentDetails.push(`${cash} Dinheiro`);
      
      const description = `${quantity} venda(s) - ${paymentDetails.join(", ")}`;

      // Add sale event
      const { data: eventData, error: eventError } = await supabase
        .from("sales_events")
        .insert({
          config_id: config.id,
          sale_value: value,
          sales_quantity: quantity,
          payment_pix: pix,
          payment_credit: credit,
          payment_debit: debit,
          payment_boleto: boleto,
          payment_cash: cash,
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
      setSalesQuantity("");
      setTotalValue("");
      setPaymentPix("");
      setPaymentCredit("");
      setPaymentDebit("");
      setPaymentBoleto("");
      setPaymentCash("");
      
      toast.success(`Vendas do dia registradas! R$ ${value.toFixed(2)}`);
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

      // Update current_value
      const newValue = Math.max(0, config.current_value - event.sale_value);
      const { error: updateError } = await supabase
        .from("sales_goals_config")
        .update({ current_value: newValue })
        .eq("id", config.id);

      if (updateError) throw updateError;

      setConfig({ ...config, current_value: newValue });
      setEvents(events.filter(e => e.id !== event.id));
      toast.success("Registro removido");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Erro ao remover registro");
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
        <p className="text-muted-foreground">Registre as vendas do dia para contabilizar nas metas</p>
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
                Vendas do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Quantidade de Vendas *
                  </Label>
                  <Input
                    type="number"
                    value={salesQuantity}
                    onChange={(e) => setSalesQuantity(e.target.value)}
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor Total (R$) *
                  </Label>
                  <Input
                    type="number"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  Métodos de Pagamento (quantidade por tipo)
                </Label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">PIX</Label>
                      <Input
                        type="number"
                        value={paymentPix}
                        onChange={(e) => setPaymentPix(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Crédito</Label>
                      <Input
                        type="number"
                        value={paymentCredit}
                        onChange={(e) => setPaymentCredit(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Débito</Label>
                      <Input
                        type="number"
                        value={paymentDebit}
                        onChange={(e) => setPaymentDebit(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Boleto</Label>
                      <Input
                        type="number"
                        value={paymentBoleto}
                        onChange={(e) => setPaymentBoleto(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 col-span-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Banknote className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Dinheiro</Label>
                      <Input
                        type="number"
                        value={paymentCash}
                        onChange={(e) => setPaymentCash(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {salesQuantity && parseInt(salesQuantity) > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Total de pagamentos: {(parseInt(paymentPix) || 0) + (parseInt(paymentCredit) || 0) + (parseInt(paymentDebit) || 0) + (parseInt(paymentBoleto) || 0) + (parseInt(paymentCash) || 0)} / {salesQuantity} vendas
                  </p>
                )}
              </div>

              <Button 
                onClick={handleSubmitSale} 
                disabled={isSubmitting || !salesQuantity || !totalValue}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Registrar Vendas do Dia
              </Button>
            </CardContent>
          </Card>

          {/* Sales History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="w-5 h-5" />
                Histórico de Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum registro de vendas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg bg-muted/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs bg-green-600">
                              R$ {event.sale_value.toFixed(2)}
                            </Badge>
                            {event.sales_quantity && (
                              <Badge variant="outline" className="text-xs">
                                {event.sales_quantity} venda(s)
                              </Badge>
                            )}
                          </div>
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
                        
                        {/* Payment breakdown */}
                        <div className="flex flex-wrap gap-1">
                          {event.payment_pix && event.payment_pix > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Receipt className="w-3 h-3 mr-1" /> {event.payment_pix} PIX
                            </Badge>
                          )}
                          {event.payment_credit && event.payment_credit > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <CreditCard className="w-3 h-3 mr-1" /> {event.payment_credit} Crédito
                            </Badge>
                          )}
                          {event.payment_debit && event.payment_debit > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <CreditCard className="w-3 h-3 mr-1" /> {event.payment_debit} Débito
                            </Badge>
                          )}
                          {event.payment_boleto && event.payment_boleto > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Wallet className="w-3 h-3 mr-1" /> {event.payment_boleto} Boleto
                            </Badge>
                          )}
                          {event.payment_cash && event.payment_cash > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Banknote className="w-3 h-3 mr-1" /> {event.payment_cash} Dinheiro
                            </Badge>
                          )}
                        </div>

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