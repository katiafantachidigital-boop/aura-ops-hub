import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, History, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  sale_participants: string[] | null;
  registered_by: string;
}

interface Report {
  id: string;
  client_id: string;
  report_content: string;
  sale_details: string | null;
  commission_notes: string | null;
  created_by_name: string;
  created_at: string;
  client_name?: string;
}

interface ClientReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientReportDialog({ open, onOpenChange }: ClientReportDialogProps) {
  const { user, profile, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState("report");
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [saleDetails, setSaleDetails] = useState("");
  const [commissionNotes, setCommissionNotes] = useState("");

  const selectedClient = clients.find(c => c.id === selectedClientId);

  useEffect(() => {
    if (open && user) {
      loadClients();
      loadReports();
    }
  }, [open, user]);

  const loadClients = async () => {
    if (!user) return;
    
    setLoadingClients(true);
    
    // Gestora can see all clients, others only see clients they registered
    let query = supabase
      .from('clients')
      .select('id, name, sale_participants, registered_by')
      .order('name');
    
    if (!isManager) {
      query = query.eq('registered_by', user.id);
    }
    
    const { data } = await query;
    
    setClients(data || []);
    setLoadingClients(false);
  };

  const loadReports = async () => {
    if (!user) return;
    
    setLoadingReports(true);
    
    // Load reports - gestora sees all, others see only reports for their clients
    let reportsQuery = supabase
      .from('client_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: reportsData } = await reportsQuery;

    if (reportsData) {
      // Get client names and filter by registered_by for non-managers
      let clientsQuery = supabase.from('clients').select('id, name, registered_by');
      
      if (!isManager) {
        clientsQuery = clientsQuery.eq('registered_by', user.id);
      }
      
      const { data: clientsData } = await clientsQuery;

      const clientMap = new Map(clientsData?.map(c => [c.id, c.name]) || []);
      const allowedClientIds = new Set(clientsData?.map(c => c.id) || []);
      
      // Filter reports to only show those for clients the user registered (or all for managers)
      const filteredReports = isManager 
        ? reportsData 
        : reportsData.filter(r => allowedClientIds.has(r.client_id));
      
      const enrichedReports = filteredReports.map(r => ({
        ...r,
        client_name: clientMap.get(r.client_id) || "Cliente removido"
      }));

      setReports(enrichedReports);
    }
    setLoadingReports(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (!reportContent.trim()) {
      toast.error("O conteúdo do relatório é obrigatório");
      return;
    }

    if (!user || !profile) {
      toast.error("Usuário não autenticado");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('client_reports').insert({
      client_id: selectedClientId,
      report_content: reportContent.trim(),
      sale_details: saleDetails.trim() || null,
      commission_notes: commissionNotes.trim() || null,
      created_by: user.id,
      created_by_name: profile.full_name || user.email || "Usuário"
    });

    setLoading(false);

    if (error) {
      console.error("Error creating report:", error);
      toast.error("Erro ao criar relatório: " + error.message);
      return;
    }

    toast.success("Relatório criado com sucesso!");
    resetForm();
    loadReports();
    setActiveTab("history");
  };

  const resetForm = () => {
    setSelectedClientId("");
    setReportContent("");
    setSaleDetails("");
    setCommissionNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Relatórios de Clientes
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="report">Novo Relatório</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Selecionar Cliente *</Label>
                {loadingClients ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum cliente cadastrado. Cadastre um cliente primeiro.
                  </p>
                ) : (
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedClient && selectedClient.sale_participants && selectedClient.sale_participants.length > 0 && (
                <Card variant="glass">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
                      <User className="h-3 w-3" />
                      Participantes da venda:
                    </p>
                    <p className="text-sm mt-1">
                      {selectedClient.sale_participants.join(", ")}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="report-content">Relatório *</Label>
                <Textarea
                  id="report-content"
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="Descreva os detalhes do atendimento, procedimentos realizados, observações..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sale-details">Detalhes da Venda</Label>
                <Textarea
                  id="sale-details"
                  value={saleDetails}
                  onChange={(e) => setSaleDetails(e.target.value)}
                  placeholder="Valores, pacotes, serviços adquiridos..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission-notes">Observações de Comissão</Label>
                <Textarea
                  id="commission-notes"
                  value={commissionNotes}
                  onChange={(e) => setCommissionNotes(e.target.value)}
                  placeholder="Detalhes sobre a divisão de comissão entre os participantes..."
                  rows={2}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || clients.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Salvar Relatório
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[400px]">
              {loadingReports ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum relatório criado ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <Card key={report.id} variant="glass">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-sm">{report.client_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(report.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        
                        <p className="text-sm">{report.report_content}</p>
                        
                        {report.sale_details && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground">Detalhes da Venda:</p>
                            <p className="text-xs">{report.sale_details}</p>
                          </div>
                        )}
                        
                        {report.commission_notes && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground">Comissão:</p>
                            <p className="text-xs">{report.commission_notes}</p>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          Por: {report.created_by_name}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
