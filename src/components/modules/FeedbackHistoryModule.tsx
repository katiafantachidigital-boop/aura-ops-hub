import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, User, ChevronDown, ChevronUp, Search, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
}

interface Feedback {
  id: string;
  client_id: string | null;
  created_at: string;
  unit: string | null;
  procedure_type: string | null;
  professional_name: string | null;
  reception_rating: string | null;
  felt_welcomed: string | null;
  environment_clean: string | null;
  professional_polite: string | null;
  procedure_explained: string | null;
  felt_comfortable: string | null;
  overall_rating: number | null;
  met_expectations: string | null;
  would_recommend: string | null;
  would_return: string | null;
  comment: string | null;
  clients?: Client;
}

const ratingLabels: Record<string, string> = {
  excelente: "Excelente",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  sim_totalmente: "Sim, totalmente",
  em_parte: "Em parte",
  nao: "Não",
  sim: "Sim",
  parcialmente: "Parcialmente",
  sim_excelente: "Sim, excelente",
  mais_ou_menos: "Mais ou menos",
  superou: "Superou",
  atendeu: "Atendeu",
  ficou_abaixo: "Ficou abaixo",
  com_certeza: "Com certeza",
  talvez: "Talvez",
};

const formatLabel = (value: string | null) => {
  if (!value) return "—";
  return ratingLabels[value] || value;
};

export function FeedbackHistoryModule() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('client_feedbacks')
      .select(`
        *,
        clients:client_id (id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Erro ao carregar histórico de avaliações");
    } else {
      setFeedbacks(data || []);
    }
    setLoading(false);
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const clientName = feedback.clients?.name || "";
    return clientName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderStars = (rating: number | null) => {
    if (!rating) return "—";
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Histórico de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de avaliações */}
      {filteredFeedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery ? "Nenhuma avaliação encontrada" : "Nenhuma avaliação registrada ainda"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => toggleExpand(feedback.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {feedback.clients?.name || "Cliente não identificado"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      {renderStars(feedback.overall_rating)}
                      {feedback.unit && (
                        <Badge variant="outline" className="mt-1">
                          {feedback.unit === 'batel' ? 'Batel' : 'Capão Raso'}
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedId === feedback.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Detalhes expandidos */}
              {expandedId === feedback.id && (
                <CardContent className="pt-0 border-t">
                  <div className="pt-4 grid gap-6">
                    {/* Identificação */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">🔹 Identificação</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Unidade:</span>
                          <p className="font-medium">{feedback.unit === 'batel' ? 'Batel' : feedback.unit === 'capao_raso' ? 'Capão Raso' : '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Procedimento:</span>
                          <p className="font-medium">{feedback.procedure_type || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profissional:</span>
                          <p className="font-medium">{feedback.professional_name || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Recepção */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">🌟 Experiência na Chegada</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Atendimento da recepção:</span>
                          <p className="font-medium">{formatLabel(feedback.reception_rating)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Se sentiu bem recebido(a):</span>
                          <p className="font-medium">{formatLabel(feedback.felt_welcomed)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ambiente limpo/organizado:</span>
                          <p className="font-medium">{formatLabel(feedback.environment_clean)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Atendimento */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">💆 Atendimento do Profissional</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Profissional educado/atencioso:</span>
                          <p className="font-medium">{formatLabel(feedback.professional_polite)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Procedimento explicado:</span>
                          <p className="font-medium">{formatLabel(feedback.procedure_explained)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Se sentiu confortável:</span>
                          <p className="font-medium">{formatLabel(feedback.felt_comfortable)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Experiência Geral */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">💎 Experiência Geral</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Avaliação geral:</span>
                          <div className="mt-1">{renderStars(feedback.overall_rating)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Atendeu expectativas:</span>
                          <p className="font-medium">{formatLabel(feedback.met_expectations)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Percepção */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-primary">📣 Percepção e Indicação</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Indicaria para outros:</span>
                          <p className="font-medium">{formatLabel(feedback.would_recommend)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Voltaria para novos atendimentos:</span>
                          <p className="font-medium">{formatLabel(feedback.would_return)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Comentário */}
                    {feedback.comment && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-primary">💬 Comentário</h4>
                        <p className="text-sm bg-muted p-3 rounded-lg">{feedback.comment}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
