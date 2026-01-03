import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Check, X, Clock, Smile, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

interface DailyChecklistFormProps {
  onBack: () => void;
}

export function DailyChecklistForm({ onBack }: DailyChecklistFormProps) {
  const { toast } = useToast();
  
  const [sections, setSections] = useState<ChecklistSection[]>([
    {
      id: "punctuality",
      title: "Pontualidade e Conduta",
      icon: Clock,
      items: [
        { id: "p1", label: "Colaboradores chegaram no horário estabelecido", value: null },
        { id: "p2", label: "Uniformes limpos e padronizados", value: null },
        { id: "p3", label: "Cabelos presos e aparência profissional", value: null },
        { id: "p4", label: "Maquiagem e acessórios dentro do padrão", value: null },
        { id: "p5", label: "Comportamento ético e respeitoso", value: null },
        { id: "p6", label: "Uso de celular apenas nos intervalos permitidos", value: null },
      ],
    },
    {
      id: "cleanliness",
      title: "Limpeza e Organização",
      icon: Sparkles,
      items: [
        { id: "c1", label: "Recepção limpa e organizada", value: null },
        { id: "c2", label: "Salas higienizadas antes e após clientes", value: null },
        { id: "c3", label: "Equipamentos limpos e guardados", value: null },
        { id: "c4", label: "Toalhas e enxoval organizados", value: null },
        { id: "c5", label: "Banheiros limpos e abastecidos", value: null },
        { id: "c6", label: "Áreas comuns limpas", value: null },
        { id: "c7", label: "Lixeiras higienizadas", value: null },
      ],
    },
    {
      id: "customer",
      title: "Atendimento ao Cliente",
      icon: Smile,
      items: [
        { id: "a1", label: "Atendimento cordial", value: null },
        { id: "a2", label: "Cliente atendido no horário agendado", value: null },
        { id: "a3", label: "Recepção acolhedora e profissional", value: null },
        { id: "a4", label: "Informações claras sobre procedimentos", value: null },
        { id: "a5", label: "Feedbacks dos clientes registrados", value: null },
        { id: "a6", label: "Pós-atendimento realizado", value: null },
      ],
    },
  ]);

  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Checklist enviado com sucesso!",
      description: `${getYesCount()}/${totalItems} itens em conformidade.`,
    });

    setIsSubmitting(false);
    onBack();
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
              {section.items.map((item, itemIndex) => (
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

      {/* Observations */}
      <Card variant="glass">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Observações</CardTitle>
          <CardDescription>
            Adicione comentários ou observações relevantes (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Descreva qualquer ocorrência, pendência ou observação importante do dia..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
        <div>
          <p className="font-medium text-foreground">
            {getTotalAnswered() === getTotalItems()
              ? "Pronto para enviar!"
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
