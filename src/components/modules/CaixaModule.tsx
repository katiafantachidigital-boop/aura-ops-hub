import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Plus, 
  Loader2,
  History,
  CalendarIcon,
  User,
  CreditCard,
  Receipt,
  Wallet,
  Banknote,
  Search,
  Trash2,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CashRegisterEntry {
  id: string;
  total_value: number;
  register_date: string;
  registered_by: string;
  registered_by_name: string;
  payment_pix: number | null;
  payment_credit: number | null;
  payment_debit: number | null;
  payment_boleto: number | null;
  payment_cash: number | null;
  created_at: string;
  clinic: string | null;
}

const clinicLabels: Record<string, string> = {
  capao_raso: "Capão Raso",
  batel: "Batel",
};

export function CaixaModule() {
  const { user, profile, isManager, canSubmitChecklist } = useAuth();
  const [entries, setEntries] = useState<CashRegisterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalValue, setTotalValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Payment method states
  const [paymentPix, setPaymentPix] = useState("");
  const [paymentCredit, setPaymentCredit] = useState("");
  const [paymentDebit, setPaymentDebit] = useState("");
  const [paymentBoleto, setPaymentBoleto] = useState("");
  const [paymentCash, setPaymentCash] = useState("");

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedClinicTab, setSelectedClinicTab] = useState<string>("all");

  // Check if user can access this module
  const canAccess = isManager || canSubmitChecklist;

  // Get user's clinic from profile
  const userClinic = profile?.clinic;

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

    // Validate at least one payment method
    const pix = parseFloat(paymentPix) || 0;
    const credit = parseFloat(paymentCredit) || 0;
    const debit = parseFloat(paymentDebit) || 0;
    const boleto = parseFloat(paymentBoleto) || 0;
    const cash = parseFloat(paymentCash) || 0;

    const totalPayments = pix + credit + debit + boleto + cash;
    if (totalPayments === 0) {
      toast.error("Informe ao menos um método de pagamento");
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
          payment_pix: pix > 0 ? pix : null,
          payment_credit: credit > 0 ? credit : null,
          payment_debit: debit > 0 ? debit : null,
          payment_boleto: boleto > 0 ? boleto : null,
          payment_cash: cash > 0 ? cash : null,
          clinic: userClinic || null,
        })
        .select()
        .single();

      if (error) throw error;

      setEntries([data, ...entries]);
      
      // Reset form
      setTotalValue("");
      setPaymentPix("");
      setPaymentCredit("");
      setPaymentDebit("");
      setPaymentBoleto("");
      setPaymentCash("");
      
      toast.success(`Lançamento de R$ ${value.toFixed(2)} registrado!`);
    } catch (error) {
      console.error("Error submitting cash register:", error);
      toast.error("Erro ao registrar lançamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isManager) {
      toast.error("Apenas gestoras podem excluir lançamentos");
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("cash_register")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEntries(entries.filter(e => e.id !== id));
      toast.success("Lançamento excluído com sucesso!");
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Erro ao excluir lançamento");
    } finally {
      setDeletingId(null);
    }
  };

  // Build payment method description for history
  const getPaymentDescription = (entry: CashRegisterEntry) => {
    const methods: string[] = [];
    if (entry.payment_pix) methods.push(`PIX: R$${entry.payment_pix.toFixed(2)}`);
    if (entry.payment_credit) methods.push(`Crédito: R$${entry.payment_credit.toFixed(2)}`);
    if (entry.payment_debit) methods.push(`Débito: R$${entry.payment_debit.toFixed(2)}`);
    if (entry.payment_boleto) methods.push(`Boleto: R$${entry.payment_boleto.toFixed(2)}`);
    if (entry.payment_cash) methods.push(`Dinheiro: R$${entry.payment_cash.toFixed(2)}`);
    return methods.join(" • ");
  };

  // Filter entries based on user's clinic and selected tab
  const getFilteredEntriesByClinic = (clinicFilter: string | null) => {
    return entries.filter(entry => {
      // First filter by clinic
      if (clinicFilter && entry.clinic !== clinicFilter) return false;

      // Then filter by month
      const entryDate = parseISO(entry.register_date);
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const isInMonth = isWithinInterval(entryDate, { start: monthStart, end: monthEnd });
      if (!isInMonth) return false;
      
      // Then filter by search query
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const matchesName = entry.registered_by_name.toLowerCase().includes(query);
      const matchesValue = entry.total_value.toString().includes(query);
      const matchesDate = format(entryDate, "dd/MM/yyyy").includes(query);
      
      return matchesName || matchesValue || matchesDate;
    });
  };

  // For non-managers, filter by their clinic
  const getVisibleEntries = () => {
    if (isManager) {
      if (selectedClinicTab === "all") {
        return getFilteredEntriesByClinic(null);
      }
      return getFilteredEntriesByClinic(selectedClinicTab);
    }
    // Supervisors can only see their clinic
    return getFilteredEntriesByClinic(userClinic || null);
  };

  const filteredEntries = getVisibleEntries();

  // Calculate today's total
  const today = format(new Date(), "yyyy-MM-dd");
  const getTodaysTotal = (clinicFilter: string | null) => {
    return entries
      .filter(entry => {
        if (clinicFilter && entry.clinic !== clinicFilter) return false;
        return entry.register_date === today;
      })
      .reduce((sum, entry) => sum + entry.total_value, 0);
  };

  // Calculate selected month's total
  const getMonthTotal = (clinicFilter: string | null) => {
    return getFilteredEntriesByClinic(clinicFilter).reduce((sum, entry) => sum + entry.total_value, 0);
  };

  const todaysTotal = isManager && selectedClinicTab === "all" 
    ? getTodaysTotal(null) 
    : isManager 
      ? getTodaysTotal(selectedClinicTab) 
      : getTodaysTotal(userClinic || null);

  const selectedMonthTotal = isManager && selectedClinicTab === "all"
    ? getMonthTotal(null)
    : isManager
      ? getMonthTotal(selectedClinicTab)
      : getMonthTotal(userClinic || null);

  const renderEntryCard = (entry: CashRegisterEntry) => (
    <div
      key={entry.id}
      className="p-3 rounded-lg bg-muted/50 border"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-emerald-600">
              R$ {entry.total_value.toFixed(2)}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarIcon className="w-3 h-3" />
              {format(new Date(entry.register_date), "dd/MM/yyyy", { locale: ptBR })}
              <span className="mx-1">•</span>
              <User className="w-3 h-3" />
              {entry.registered_by_name}
              {isManager && entry.clinic && (
                <>
                  <span className="mx-1">•</span>
                  <MapPin className="w-3 h-3" />
                  {clinicLabels[entry.clinic] || entry.clinic}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {format(new Date(entry.created_at), "HH:mm", { locale: ptBR })}
          </span>
          {isManager && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={deletingId === entry.id}
                >
                  {deletingId === entry.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a excluir o lançamento de R$ {entry.total_value.toFixed(2)} 
                    feito por {entry.registered_by_name}. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDelete(entry.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      {/* Payment method breakdown */}
      {getPaymentDescription(entry) && (
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          {getPaymentDescription(entry)}
        </div>
      )}
    </div>
  );

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
        <p className="text-muted-foreground">Registre o valor total das vendas do dia com detalhamento por método de pagamento</p>
      </div>

      {/* Clinic Tabs for Manager */}
      {isManager && (
        <Tabs value={selectedClinicTab} onValueChange={setSelectedClinicTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="batel">Batel</TabsTrigger>
            <TabsTrigger value="capao_raso">Capão Raso</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Vendas de Hoje
                  {isManager && selectedClinicTab !== "all" && ` - ${clinicLabels[selectedClinicTab]}`}
                </p>
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
                <CalendarIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Vendas em {format(selectedMonth, "MMMM", { locale: ptBR })}
                  {isManager && selectedClinicTab !== "all" && ` - ${clinicLabels[selectedClinicTab]}`}
                </p>
                <p className="text-xl font-bold text-blue-600">
                  R$ {selectedMonthTotal.toFixed(2)}
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
              {userClinic && !isManager && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({clinicLabels[userClinic]})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor Total das Vendas de Hoje (R$) *
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

            {/* Payment Methods - Required */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Métodos de Pagamento *
              </Label>
              <p className="text-xs text-muted-foreground">Detalhe o valor recebido por cada método</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">PIX (R$)</Label>
                    <Input
                      type="number"
                      value={paymentPix}
                      onChange={(e) => setPaymentPix(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Crédito (R$)</Label>
                    <Input
                      type="number"
                      value={paymentCredit}
                      onChange={(e) => setPaymentCredit(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Débito (R$)</Label>
                    <Input
                      type="number"
                      value={paymentDebit}
                      onChange={(e) => setPaymentDebit(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Boleto (R$)</Label>
                    <Input
                      type="number"
                      value={paymentBoleto}
                      onChange={(e) => setPaymentBoleto(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 col-span-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Dinheiro (R$)</Label>
                    <Input
                      type="number"
                      value={paymentCash}
                      onChange={(e) => setPaymentCash(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !totalValue || parseFloat(totalValue) <= 0 || (
                !paymentPix && !paymentCredit && !paymentDebit && !paymentBoleto && !paymentCash
              )}
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
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="w-5 h-5" />
              Histórico de Lançamentos
              {isManager && selectedClinicTab !== "all" && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {clinicLabels[selectedClinicTab]}
                </span>
              )}
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
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum lançamento registrado</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {filteredEntries.map(renderEntryCard)}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
