import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Check, X, Clock, Smile, Sparkles, ShieldCheck, Users, ClipboardList, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface ChecklistItem {
  id: string;
  label: string;
  value: boolean | null;
}

interface ChecklistSection {
  id: string;
  title: string;
  icon: typeof Clock;
  items: ChecklistItem[];
}

interface OccurrenceEntry {
  id: string;
  occurrence: string;
  actionTaken: string;
}

interface DailyChecklistFormProps {
  onBack: () => void;
}

export function DailyChecklistForm({ onBack }: DailyChecklistFormProps) {
  const { toast } = useToast();
  
  const [sections, setSections] = useState<ChecklistSection[]>([
    {
      id: "punctuality",
      title: "1. Pontualidade e Conduta",
      icon: Clock,
      items: [
        { id: "p1", label: "Colaboradores chegaram no horário estabelecido", value: null },
        { id: "p2", label: "Uniformes limpos e padronizados conforme normas", value: null },
        { id: "p3", label: "Cabelos presos e aparência profissional", value: null },
        { id: "p4", label: "Maquiagem e acessórios dentro do padrão da clínica", value: null },
      ],
    },
    {
      id: "cleanliness",
      title: "2. Limpeza e Organização",
      icon: Sparkles,
      items: [
        { id: "c1", label: "Recepção limpa, aromatizada e organizada", value: null },
        { id: "c2", label: "Salas de atendimento higienizadas antes e após cada cliente", value: null },
        { id: "c3", label: "Equipamentos limpos e armazenados corretamente", value: null },
        { id: "c4", label: "Toalhas e enxoval organizados (uso exclusivo profissional)", value: null },
        { id: "c5", label: "Banheiros limpos e abastecidos", value: null },
        { id: "c6", label: "Copas e áreas comuns limpas e sem objetos pessoais", value: null },
        { id: "c7", label: "Lixeiras higienizadas e trocadas", value: null },
      ],
    },
    {
      id: "customer",
      title: "3. Atendimento e Experiência do Cliente",
      icon: Smile,
      items: [
        { id: "a1", label: "Atendimento cordial e sorriso no recebimento do cliente", value: null },
        { id: "a2", label: "Paciente atendido no horário agendado", value: null },
        { id: "a3", label: "Sala de atendimento pronta antes da chegada do paciente", value: null },
        { id: "a4", label: "Pós-atendimento: higienização e reposição de materiais", value: null },
        { id: "a5", label: "Cliente recebeu explicações claras sobre o procedimento", value: null },
        { id: "a6", label: "Cliente deixou o ambiente satisfeito e tranquilo", value: null },
      ],
    },
    {
      id: "behavior",
      title: "4. Comportamento e Clima Organizacional",
      icon: Users,
      items: [
        { id: "b1", label: "Ambiente tranquilo e sem ruídos excessivos", value: null },
        { id: "b2", label: "Comunicação entre equipe clara e respeitosa", value: null },
        { id: "b3", label: "Nenhum caso de conflito, fofoca ou desentendimento", value: null },
        { id: "b4", label: "Colaboradores demonstraram proatividade", value: null },
        { id: "b5", label: "Clima organizacional positivo e colaborativo", value: null },
      ],
    },
  ]);

  const [occurrenceEntries, setOccurrenceEntries] = useState<OccurrenceEntry[]>([
    { id: "1", occurrence: "", actionTaken: "" }
  ]);
  const [supervisorName, setSupervisorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOccurrenceEntry = () => {
    setOccurrenceEntries(prev => [
      ...prev,
      { id: Date.now().toString(), occurrence: "", actionTaken: "" }
    ]);
  };

  const removeOccurrenceEntry = (id: string) => {
    if (occurrenceEntries.length > 1) {
      setOccurrenceEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const updateOccurrenceEntry = (id: string, field: "occurrence" | "actionTaken", value: string) => {
    setOccurrenceEntries(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleItemChange = (sectionId: string, itemId: string, value: boolean) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? { ...item, value } : item
              ),
            }
          : section
      )
    );
  };

  const getTotalAnswered = () => {
    return sections.reduce(
      (acc, section) => acc + section.items.filter(item => item.value !== null).length,
      0
    );
  };

  const getTotalItems = () => {
    return sections.reduce((acc, section) => acc + section.items.length, 0);
  };

  const getYesCount = () => {
    return sections.reduce(
      (acc, section) => acc + section.items.filter(item => item.value === true).length,
      0
    );
  };

  const { user } = useAuth();

  const handleSubmit = async () => {
    const totalItems = getTotalItems();
    const totalAnswered = getTotalAnswered();

    if (totalAnswered < totalItems) {
      toast({
        title: "Formulário incompleto",
        description: `Responda todos os ${totalItems} itens antes de enviar.`,
        variant: "destructive",
      });
      return;
    }

    if (!supervisorName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome da responsável pelo checklist.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para enviar o checklist.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if THIS USER already submitted a checklist for today
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: existingChecklist } = await supabase
        .from("daily_checklists")
        .select("id")
        .eq("checklist_date", today)
        .eq("submitted_by", user.id)
        .maybeSingle();

      if (existingChecklist) {
        toast({
          title: "Checklist já enviado",
          description: "Você já enviou seu checklist de hoje. Tente novamente amanhã após às 7h.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Prepare checklist data (is_perfect will be calculated by the database)
      const checklistData = {
        submitted_by: user.id,
        submitted_by_name: supervisorName.trim(),
        checklist_date: today,
        // Punctuality
        punctuality_on_time: sections[0].items[0].value,
        punctuality_uniforms: sections[0].items[1].value,
        punctuality_hair: sections[0].items[2].value,
        punctuality_makeup: sections[0].items[3].value,
        // Cleaning
        cleaning_reception: sections[1].items[0].value,
        cleaning_rooms: sections[1].items[1].value,
        cleaning_equipment: sections[1].items[2].value,
        cleaning_towels: sections[1].items[3].value,
        cleaning_bathrooms: sections[1].items[4].value,
        cleaning_common_areas: sections[1].items[5].value,
        cleaning_trash: sections[1].items[6].value,
        // Service
        service_cordial: sections[2].items[0].value,
        service_on_time: sections[2].items[1].value,
        service_room_ready: sections[2].items[2].value,
        service_post_cleaning: sections[2].items[3].value,
        service_explanations: sections[2].items[4].value,
        service_satisfied: sections[2].items[5].value,
        // Behavior
        behavior_quiet_environment: sections[3].items[0].value,
        behavior_clear_communication: sections[3].items[1].value,
        behavior_no_conflicts: sections[3].items[2].value,
        behavior_proactivity: sections[3].items[3].value,
        behavior_positive_climate: sections[3].items[4].value,
      };

      // Insert checklist
      const { data: checklist, error: checklistError } = await supabase
        .from("daily_checklists")
        .insert(checklistData)
        .select("id")
        .single();

      if (checklistError) throw checklistError;

      // Insert occurrences if any
      const occurrencesToInsert = occurrenceEntries
        .filter(entry => entry.occurrence.trim())
        .map(entry => ({
          checklist_id: checklist.id,
          occurrence: entry.occurrence.trim(),
          action_taken: entry.actionTaken.trim() || null,
        }));

      if (occurrencesToInsert.length > 0) {
        const { error: occError } = await supabase
          .from("checklist_occurrences")
          .insert(occurrencesToInsert);

        if (occError) throw occError;
      }

      const allPerfect = getYesCount() === totalItems;
      toast({
        title: "Checklist enviado com sucesso!",
        description: `${getYesCount()}/${totalItems} itens em conformidade.${allPerfect ? " Checklist Perfeito! ⭐" : ""}`,
      });

      onBack();
    } catch (error: any) {
      console.error("Error submitting checklist:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar o checklist. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = Math.round((getTotalAnswered() / getTotalItems()) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Checklist Diário</h1>
            <p className="text-muted-foreground mt-1">
              Preencha todos os itens de verificação
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progresso</p>
            <p className="text-lg font-bold text-foreground">
              {getTotalAnswered()}/{getTotalItems()} ({progress}%)
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full gradient-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Sections */}
      {sections.map((section, sectionIndex) => {
        const SectionIcon = section.icon;
        const sectionAnswered = section.items.filter(item => item.value !== null).length;
        const sectionYes = section.items.filter(item => item.value === true).length;

        return (
          <Card 
            key={section.id} 
            variant="glass"
            className="animate-fade-in"
            style={{ animationDelay: `${sectionIndex * 100}ms` }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <SectionIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>
                      {sectionAnswered}/{section.items.length} respondidos
                      {sectionAnswered > 0 && ` • ${sectionYes} sim`}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                    item.value === null && "border-border bg-background",
                    item.value === true && "border-emerald/30 bg-emerald-light/50",
                    item.value === false && "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <p className="text-sm font-medium text-foreground flex-1 pr-4">
                    {item.label}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant={item.value === true ? "default" : "outline"}
                      className={cn(
                        "gap-1.5 min-w-[70px]",
                        item.value === true && "bg-emerald hover:bg-emerald/90 text-white"
                      )}
                      onClick={() => handleItemChange(section.id, item.id, true)}
                    >
                      <Check className="h-4 w-4" />
                      Sim
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={item.value === false ? "default" : "outline"}
                      className={cn(
                        "gap-1.5 min-w-[70px]",
                        item.value === false && "bg-destructive hover:bg-destructive/90 text-white"
                      )}
                      onClick={() => handleItemChange(section.id, item.id, false)}
                    >
                      <X className="h-4 w-4" />
                      Não
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Section 6: Ocorrências e Anotações */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: `${sections.length * 100}ms` }}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">6. Ocorrências e Anotações do Dia</CardTitle>
                <CardDescription>
                  Registre cada ocorrência e a medida tomada correspondente
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOccurrenceEntry}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Adicionar Ocorrência
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {occurrenceEntries.map((entry, index) => (
            <div 
              key={entry.id}
              className="relative p-4 rounded-xl border border-border bg-muted/30 space-y-4"
            >
              {/* Entry header with number and delete button */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Ocorrência #{index + 1}
                </span>
                {occurrenceEntries.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOccurrenceEntry(entry.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Occurrence field */}
              <div className="space-y-2">
                <Label htmlFor={`occurrence-${entry.id}`} className="text-sm font-medium">
                  Ocorrência registrada
                </Label>
                <Textarea
                  id={`occurrence-${entry.id}`}
                  placeholder="Descreva a ocorrência (ex: ar condicionado ligado, reclamação de cliente, etc.)"
                  value={entry.occurrence}
                  onChange={(e) => updateOccurrenceEntry(entry.id, "occurrence", e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              {/* Action taken field - only show if occurrence has content */}
              {entry.occurrence.trim() && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor={`action-${entry.id}`} className="text-sm font-medium">
                    Medida tomada / Encaminhamento
                  </Label>
                  <Textarea
                    id={`action-${entry.id}`}
                    placeholder="Descreva a medida tomada para esta ocorrência..."
                    value={entry.actionTaken}
                    onChange={(e) => updateOccurrenceEntry(entry.id, "actionTaken", e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Empty state hint */}
          {occurrenceEntries.length === 1 && !occurrenceEntries[0].occurrence.trim() && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Se não houver ocorrências, você pode deixar o campo em branco.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Responsável pelo Checklist */}
      <Card variant="glass" className="animate-fade-in">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Responsável pelo Checklist</CardTitle>
          <CardDescription>
            Informe o nome da supervisora responsável pelo preenchimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="supervisorName" className="text-sm font-medium">
              Nome completo *
            </Label>
            <Input
              id="supervisorName"
              placeholder="Digite seu nome completo..."
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
        <div>
          <p className="font-medium text-foreground">
            {getTotalAnswered() === getTotalItems() && supervisorName.trim()
              ? "Pronto para enviar!"
              : getTotalAnswered() === getTotalItems()
              ? "Informe o nome da responsável"
              : `Faltam ${getTotalItems() - getTotalAnswered()} itens`}
          </p>
          <p className="text-sm text-muted-foreground">
            {getYesCount()} itens em conformidade de {getTotalAnswered()} respondidos
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Enviar Checklist
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
