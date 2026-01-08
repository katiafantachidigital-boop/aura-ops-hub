import { useState, useEffect } from "react";
import { Star, Send, CheckCircle, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PROCEDURES = [
  "Limpeza de Pele",
  "Peeling",
  "Microagulhamento",
  "Botox",
  "Preenchimento",
  "Depilação a Laser",
  "Tratamento Capilar",
  "Massagem",
  "Drenagem Linfática",
  "Outro"
];

const PROFESSIONALS = [
  "Dra. Ana Paula",
  "Dra. Carolina",
  "Dr. Ricardo",
  "Dra. Fernanda",
  "Terapeuta Juliana",
  "Terapeuta Marcos",
  "Outro"
];

interface Client {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
}

export default function ClientFeedback() {
  const [step, setStep] = useState<'select' | 'survey' | 'success'>('select');
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [loading, setLoading] = useState(false);

  // Identificação
  const [unit, setUnit] = useState("");
  const [procedureType, setProcedureType] = useState("");
  const [professionalName, setProfessionalName] = useState("");

  // Experiência na Chegada
  const [receptionRating, setReceptionRating] = useState("");
  const [feltWelcomed, setFeltWelcomed] = useState("");
  const [environmentClean, setEnvironmentClean] = useState("");

  // Atendimento do Profissional
  const [professionalPolite, setProfessionalPolite] = useState("");
  const [procedureExplained, setProcedureExplained] = useState("");
  const [feltComfortable, setFeltComfortable] = useState("");

  // Experiência Geral
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [metExpectations, setMetExpectations] = useState("");

  // Percepção e Indicação
  const [wouldRecommend, setWouldRecommend] = useState("");
  const [wouldReturn, setWouldReturn] = useState("");

  // Comentário
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoadingClients(true);
    // Busca clientes cadastrados hoje
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, phone, created_at')
      .gte('created_at', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      toast.error("Erro ao carregar clientes");
    } else {
      setClients(data || []);
    }
    setLoadingClients(false);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setStep('survey');
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error("Por favor, avalie sua experiência geral com as estrelas");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('client_feedbacks').insert({
      unit: unit || null,
      procedure_type: procedureType || null,
      professional_name: professionalName || null,
      reception_rating: receptionRating || null,
      felt_welcomed: feltWelcomed || null,
      environment_clean: environmentClean || null,
      professional_polite: professionalPolite || null,
      procedure_explained: procedureExplained || null,
      felt_comfortable: feltComfortable || null,
      overall_rating: overallRating,
      met_expectations: metExpectations || null,
      would_recommend: wouldRecommend || null,
      would_return: wouldReturn || null,
      comment: comment.trim() || null,
    });

    setLoading(false);

    if (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Erro ao enviar avaliação. Tente novamente.");
      return;
    }

    setStep('success');
    toast.success("Obrigada pela sua avaliação!");
  };

  const handleNewFeedback = () => {
    setStep('select');
    setSelectedClient(null);
    setSearchQuery("");
    // Reset form
    setUnit("");
    setProcedureType("");
    setProfessionalName("");
    setReceptionRating("");
    setFeltWelcomed("");
    setEnvironmentClean("");
    setProfessionalPolite("");
    setProcedureExplained("");
    setFeltComfortable("");
    setOverallRating(0);
    setMetExpectations("");
    setWouldRecommend("");
    setWouldReturn("");
    setComment("");
    fetchClients();
  };

  // Tela de sucesso
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Obrigada!</h1>
            <p className="text-muted-foreground mb-6">
              Sua avaliação foi enviada com sucesso. Agradecemos muito por compartilhar sua experiência conosco!
            </p>
            <Button onClick={handleNewFeedback} variant="outline">
              Nova Avaliação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de seleção de cliente
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="pt-6 pb-6 text-center">
              <h1 className="text-2xl font-bold mb-1">ATENDIMENTO E EXPERIÊNCIA DO CLIENTE</h1>
              <p className="text-lg font-medium text-primary">IPFP – Instituto Paranaense</p>
              <p className="text-sm text-muted-foreground mt-2">Selecione seu nome para iniciar a avaliação</p>
            </CardContent>
          </Card>

          {/* Busca */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Clientes */}
          <Card>
            <CardContent className="pt-6">
              {loadingClients ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando clientes...
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado hoje"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-accent hover:border-primary transition-colors text-left"
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{client.name}</p>
                        {client.phone && (
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        )}
                      </div>
                      <span className="text-primary text-sm font-medium">Selecionar →</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tela do questionário
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <h1 className="text-2xl font-bold mb-1">ATENDIMENTO E EXPERIÊNCIA DO CLIENTE</h1>
            <p className="text-lg font-medium text-primary">IPFP – Instituto Paranaense</p>
            <p className="text-sm text-muted-foreground mt-2">⏱ Tempo de resposta: menos de 2 minutos</p>
            {selectedClient && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Avaliação de:</p>
                <p className="font-semibold text-primary">{selectedClient.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Identificação */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🔹 IDENTIFICAÇÃO DO ATENDIMENTO
              <span className="text-sm font-normal text-muted-foreground">(opcional)</span>
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">1. Unidade onde foi atendido(a):</Label>
                <RadioGroup value={unit} onValueChange={setUnit} className="mt-2 flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="batel" id="batel" />
                    <Label htmlFor="batel" className="cursor-pointer">Batel</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="capao_raso" id="capao_raso" />
                    <Label htmlFor="capao_raso" className="cursor-pointer">Capão Raso</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">2. Procedimento realizado:</Label>
                <Select value={procedureType} onValueChange={setProcedureType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione o procedimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCEDURES.map((proc) => (
                      <SelectItem key={proc} value={proc}>{proc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">3. Profissional que realizou o atendimento:</Label>
                <Select value={professionalName} onValueChange={setProfessionalName}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSIONALS.map((prof) => (
                      <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experiência na Chegada */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">🌟 EXPERIÊNCIA NA CHEGADA (RECEPÇÃO)</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">4. Como você avalia o atendimento da recepção?</Label>
                <RadioGroup value={receptionRating} onValueChange={setReceptionRating} className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { value: "excelente", label: "Excelente" },
                    { value: "bom", label: "Bom" },
                    { value: "regular", label: "Regular" },
                    { value: "ruim", label: "Ruim" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`reception-${opt.value}`} />
                      <Label htmlFor={`reception-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">5. Você se sentiu bem recebido(a) e acolhido(a)?</Label>
                <RadioGroup value={feltWelcomed} onValueChange={setFeltWelcomed} className="mt-2 space-y-2">
                  {[
                    { value: "sim_totalmente", label: "Sim, totalmente" },
                    { value: "em_parte", label: "Em parte" },
                    { value: "nao", label: "Não" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`welcomed-${opt.value}`} />
                      <Label htmlFor={`welcomed-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">6. O ambiente da clínica estava limpo, organizado e agradável?</Label>
                <RadioGroup value={environmentClean} onValueChange={setEnvironmentClean} className="mt-2 space-y-2">
                  {[
                    { value: "sim", label: "Sim" },
                    { value: "parcialmente", label: "Parcialmente" },
                    { value: "nao", label: "Não" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`environment-${opt.value}`} />
                      <Label htmlFor={`environment-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Atendimento do Profissional */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">💆 ATENDIMENTO DO PROFISSIONAL</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">7. O profissional foi educado, atencioso e respeitoso?</Label>
                <RadioGroup value={professionalPolite} onValueChange={setProfessionalPolite} className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { value: "sim_excelente", label: "Sim, excelente" },
                    { value: "bom", label: "Bom" },
                    { value: "regular", label: "Regular" },
                    { value: "ruim", label: "Ruim" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`polite-${opt.value}`} />
                      <Label htmlFor={`polite-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">8. O procedimento foi explicado de forma clara?</Label>
                <RadioGroup value={procedureExplained} onValueChange={setProcedureExplained} className="mt-2 space-y-2">
                  {[
                    { value: "sim", label: "Sim" },
                    { value: "mais_ou_menos", label: "Mais ou menos" },
                    { value: "nao", label: "Não" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`explained-${opt.value}`} />
                      <Label htmlFor={`explained-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">9. Você se sentiu confortável e seguro(a) durante o atendimento?</Label>
                <RadioGroup value={feltComfortable} onValueChange={setFeltComfortable} className="mt-2 space-y-2">
                  {[
                    { value: "sim", label: "Sim" },
                    { value: "em_parte", label: "Em parte" },
                    { value: "nao", label: "Não" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`comfortable-${opt.value}`} />
                      <Label htmlFor={`comfortable-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experiência Geral */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">💎 EXPERIÊNCIA GERAL</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">10. Como você avalia sua experiência geral na clínica hoje?</Label>
                <div className="flex justify-center gap-2 mt-4 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none focus:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 transition-colors ${
                          star <= (hoveredRating || overallRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {overallRating > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    {overallRating === 1 && "⭐ – Ruim"}
                    {overallRating === 2 && "⭐⭐ – Regular"}
                    {overallRating === 3 && "⭐⭐⭐ – Boa"}
                    {overallRating === 4 && "⭐⭐⭐⭐ – Muito boa"}
                    {overallRating === 5 && "⭐⭐⭐⭐⭐ – Excelente"}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">11. O atendimento atendeu suas expectativas?</Label>
                <RadioGroup value={metExpectations} onValueChange={setMetExpectations} className="mt-2 space-y-2">
                  {[
                    { value: "superou", label: "Superou" },
                    { value: "atendeu", label: "Atendeu" },
                    { value: "ficou_abaixo", label: "Ficou abaixo" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`expectations-${opt.value}`} />
                      <Label htmlFor={`expectations-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Percepção e Indicação */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">📣 PERCEPÇÃO E INDICAÇÃO</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">12. Você indicaria o IPFP para amigos ou familiares?</Label>
                <RadioGroup value={wouldRecommend} onValueChange={setWouldRecommend} className="mt-2 space-y-2">
                  {[
                    { value: "com_certeza", label: "Com certeza" },
                    { value: "talvez", label: "Talvez" },
                    { value: "nao", label: "Não" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`recommend-${opt.value}`} />
                      <Label htmlFor={`recommend-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">13. Você voltaria para novos atendimentos?</Label>
                <RadioGroup value={wouldReturn} onValueChange={setWouldReturn} className="mt-2 space-y-2">
                  {[
                    { value: "sim", label: "Sim" },
                    { value: "talvez", label: "Talvez" },
                    { value: "nao", label: "Não" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`return-${opt.value}`} />
                      <Label htmlFor={`return-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comentário Final */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">💬 COMENTÁRIO FINAL (OPCIONAL)</h2>
            <Label className="text-sm font-medium">14. Se quiser, deixe um comentário, elogio ou sugestão:</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escreva aqui..."
              rows={4}
              className="mt-2 resize-none"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          className="w-full" 
          size="lg"
          disabled={loading || overallRating === 0}
        >
          {loading ? (
            "Enviando..."
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Avaliação
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
