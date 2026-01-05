import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, FileText, History, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  sale_participants: string[];
}

interface Report {
  id: string;
  client_id: string;
  report_content: string;
  sale_details: string | null;
  commission_notes: string | null;
  created_by_name: string;
  created_at: string;
  clients?: {
    name: string;
    sale_participants: string[];
  };
}

export function ClientReports() {
  const { user, profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [saleDetails, setSaleDetails] = useState("");
  const [commissionNotes, setCommissionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, reportsRes] = await Promise.all([
        supabase.from("clients").select("id, name, sale_participants").order("name"),
        supabase
          .from("client_reports")
          .select("*, clients(name, sale_participants)")
          .order("created_at", { ascending: false }),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (reportsRes.error) throw reportsRes.error;

      setClients(clientsRes.data || []);
      setReports(reportsRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedClientId("");
    setReportContent("");
    setSaleDetails("");
    setCommissionNotes("");
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (!reportContent.trim()) {
      toast.error("Conteúdo do relatório é obrigatório");
      return;
    }

    if (!user || !profile) {
      toast.error("Você precisa estar logado");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("client_reports").insert({
        client_id: selectedClientId,
        report_content: reportContent.trim(),
        sale_details: saleDetails.trim() || null,
        commission_notes: commissionNotes.trim() || null,
        created_by: user.id,
        created_by_name: profile.full_name || "Usuário",
      });

      if (error) throw error;

      toast.success("Relatório criado com sucesso!");
      resetForm();
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error creating report:", error);
      toast.error("Erro ao criar relatório: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios de Clientes</h2>
          <p className="text-muted-foreground">Crie e visualize relatórios sobre os clientes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Relatório</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Selecionar Cliente *</Label>
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
              </div>
              
              {selectedClient && selectedClient.sale_participants?.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Label className="text-sm text-muted-foreground">Participantes da Venda</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedClient.sale_participants.map((p) => (
                      <Badge key={p} variant="secondary">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="report">Relatório *</Label>
                <Textarea
                  id="report"
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="Descreva as informações sobre o cliente, atendimento realizado, etc..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="saleDetails">Detalhes da Venda</Label>
                <Textarea
                  id="saleDetails"
                  value={saleDetails}
                  onChange={(e) => setSaleDetails(e.target.value)}
                  placeholder="Serviços vendidos, valores, condições..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="commission">Notas sobre Comissão</Label>
                <Textarea
                  id="commission"
                  value={commissionNotes}
                  onChange={(e) => setCommissionNotes(e.target.value)}
                  placeholder="Informações sobre divisão de comissão entre os participantes..."
                  rows={2}
                />
              </div>
              
              <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
                {submitting ? "Criando..." : "Criar Relatório"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum relatório criado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{report.clients?.name || "Cliente"}</h4>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(report.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.report_content}
                      </p>
                      {report.clients?.sale_participants && report.clients.sale_participants.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {report.clients.sale_participants.map((p) => (
                            <Badge key={p} variant="outline" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Relatório</DialogTitle>
                        </DialogHeader>
                        {selectedReport && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-muted-foreground">Cliente</Label>
                              <p className="font-medium">{selectedReport.clients?.name || "Cliente"}</p>
                            </div>
                            
                            {selectedReport.clients?.sale_participants && selectedReport.clients.sale_participants.length > 0 && (
                              <div>
                                <Label className="text-muted-foreground">Participantes da Venda</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {selectedReport.clients.sale_participants.map((p) => (
                                    <Badge key={p} variant="secondary">
                                      {p}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <Label className="text-muted-foreground">Relatório</Label>
                              <p className="mt-1 whitespace-pre-wrap">{selectedReport.report_content}</p>
                            </div>
                            
                            {selectedReport.sale_details && (
                              <div>
                                <Label className="text-muted-foreground">Detalhes da Venda</Label>
                                <p className="mt-1 whitespace-pre-wrap">{selectedReport.sale_details}</p>
                              </div>
                            )}
                            
                            {selectedReport.commission_notes && (
                              <div>
                                <Label className="text-muted-foreground">Notas sobre Comissão</Label>
                                <p className="mt-1 whitespace-pre-wrap">{selectedReport.commission_notes}</p>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                              <div>
                                <Label className="text-muted-foreground">Criado por</Label>
                                <p>{selectedReport.created_by_name}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Data</Label>
                                <p>
                                  {format(new Date(selectedReport.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
