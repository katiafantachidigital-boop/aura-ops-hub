import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Calendar, User, CheckCircle2, XCircle, Clock, 
  Sparkles, Smile, ClipboardList, Users, AlertTriangle, Eye,
  Star, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChecklistRecord {
  id: string;
  checklist_date: string;
  submitted_by_name: string;
  created_at: string;
  is_perfect: boolean | null;
  punctuality_on_time: boolean | null;
  punctuality_uniforms: boolean | null;
  punctuality_hair: boolean | null;
  punctuality_makeup: boolean | null;
  cleaning_reception: boolean | null;
  cleaning_rooms: boolean | null;
  cleaning_equipment: boolean | null;
  cleaning_towels: boolean | null;
  cleaning_bathrooms: boolean | null;
  cleaning_common_areas: boolean | null;
  cleaning_trash: boolean | null;
  service_cordial: boolean | null;
  service_on_time: boolean | null;
  service_room_ready: boolean | null;
  service_post_cleaning: boolean | null;
  service_explanations: boolean | null;
  service_satisfied: boolean | null;
  operations_previous_checklist: boolean | null;
  operations_schedule_visible: boolean | null;
  operations_materials_stocked: boolean | null;
  operations_equipment_working: boolean | null;
  operations_agenda_reviewed: boolean | null;
  operations_cash_checked: boolean | null;
  behavior_quiet_environment: boolean | null;
  behavior_clear_communication: boolean | null;
  behavior_no_conflicts: boolean | null;
  behavior_proactivity: boolean | null;
  behavior_positive_climate: boolean | null;
}

interface Occurrence {
  id: string;
  occurrence: string;
  action_taken: string | null;
}

interface ChecklistHistoryProps {
  onBack: () => void;
}

const sections = [
  {
    id: "punctuality",
    title: "Pontualidade e Conduta",
    icon: Clock,
    fields: [
      { key: "punctuality_on_time", label: "Colaboradores chegaram no horário" },
      { key: "punctuality_uniforms", label: "Uniformes limpos e padronizados" },
      { key: "punctuality_hair", label: "Cabelos presos e aparência profissional" },
      { key: "punctuality_makeup", label: "Maquiagem e acessórios no padrão" },
    ],
  },
  {
    id: "cleaning",
    title: "Limpeza e Organização",
    icon: Sparkles,
    fields: [
      { key: "cleaning_reception", label: "Recepção limpa e organizada" },
      { key: "cleaning_rooms", label: "Salas higienizadas" },
      { key: "cleaning_equipment", label: "Equipamentos limpos" },
      { key: "cleaning_towels", label: "Toalhas organizadas" },
      { key: "cleaning_bathrooms", label: "Banheiros limpos" },
      { key: "cleaning_common_areas", label: "Áreas comuns limpas" },
      { key: "cleaning_trash", label: "Lixeiras higienizadas" },
    ],
  },
  {
    id: "service",
    title: "Atendimento e Experiência",
    icon: Smile,
    fields: [
      { key: "service_cordial", label: "Atendimento cordial" },
      { key: "service_on_time", label: "Paciente atendido no horário" },
      { key: "service_room_ready", label: "Sala pronta antes da chegada" },
      { key: "service_post_cleaning", label: "Pós-atendimento adequado" },
      { key: "service_explanations", label: "Explicações claras" },
      { key: "service_satisfied", label: "Cliente satisfeito" },
    ],
  },
  {
    id: "operations",
    title: "Organização Operacional",
    icon: ClipboardList,
    fields: [
      { key: "operations_previous_checklist", label: "Checklist anterior revisado" },
      { key: "operations_schedule_visible", label: "Escala atualizada" },
      { key: "operations_materials_stocked", label: "Materiais repostos" },
      { key: "operations_equipment_working", label: "Equipamentos funcionando" },
      { key: "operations_agenda_reviewed", label: "Agenda revisada" },
      { key: "operations_cash_checked", label: "Caixa conferido" },
    ],
  },
  {
    id: "behavior",
    title: "Comportamento e Clima",
    icon: Users,
    fields: [
      { key: "behavior_quiet_environment", label: "Ambiente tranquilo" },
      { key: "behavior_clear_communication", label: "Comunicação clara" },
      { key: "behavior_no_conflicts", label: "Sem conflitos" },
      { key: "behavior_proactivity", label: "Proatividade" },
      { key: "behavior_positive_climate", label: "Clima positivo" },
    ],
  },
];

export function ChecklistHistory({ onBack }: ChecklistHistoryProps) {
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistRecord | null>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [filterMonth, setFilterMonth] = useState("current");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadChecklists();
  }, [filterMonth, filterStatus]);

  const getDateRange = () => {
    const now = new Date();
    if (filterMonth === "current") {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    } else if (filterMonth === "last") {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    } else if (filterMonth === "last3") {
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
    }
    return { start: startOfMonth(now), end: endOfMonth(now) };
  };

  const loadChecklists = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      let query = supabase
        .from("daily_checklists")
        .select("*")
        .gte("checklist_date", format(start, "yyyy-MM-dd"))
        .lte("checklist_date", format(end, "yyyy-MM-dd"))
        .order("checklist_date", { ascending: false });

      if (filterStatus === "perfect") {
        query = query.eq("is_perfect", true);
      } else if (filterStatus === "issues") {
        query = query.eq("is_perfect", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setChecklists(data || []);
    } catch (error) {
      console.error("Error loading checklists:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOccurrences = async (checklistId: string) => {
    try {
      const { data, error } = await supabase
        .from("checklist_occurrences")
        .select("*")
        .eq("checklist_id", checklistId);

      if (error) throw error;
      setOccurrences(data || []);
    } catch (error) {
      console.error("Error loading occurrences:", error);
      setOccurrences([]);
    }
  };

  const openChecklistDetail = async (checklist: ChecklistRecord) => {
    setSelectedChecklist(checklist);
    await loadOccurrences(checklist.id);
  };

  const getChecklistStats = (checklist: ChecklistRecord) => {
    let total = 0;
    let yesCount = 0;
    
    sections.forEach(section => {
      section.fields.forEach(field => {
        const value = checklist[field.key as keyof ChecklistRecord];
        if (value !== null && value !== undefined) {
          total++;
          if (value === true) yesCount++;
        }
      });
    });

    return { total, yesCount, percentage: total > 0 ? Math.round((yesCount / total) * 100) : 0 };
  };

  const stats = {
    total: checklists.length,
    perfect: checklists.filter(c => c.is_perfect).length,
    withIssues: checklists.filter(c => !c.is_perfect).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Histórico de Checklists</h1>
            <p className="text-muted-foreground mt-1">
              Visualize todos os checklists enviados
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card variant="glass">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Período</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mês atual</SelectItem>
                  <SelectItem value="last">Mês passado</SelectItem>
                  <SelectItem value="last3">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="perfect">Perfeitos</SelectItem>
                  <SelectItem value="issues">Com pendências</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Checklists</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Checklists Perfeitos</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.perfect}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Star className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Com Pendências</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.withIssues}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checklists List */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Checklists Enviados</CardTitle>
          <CardDescription>
            {filterMonth === "current" ? "Este mês" : filterMonth === "last" ? "Mês passado" : "Últimos 3 meses"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : checklists.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum checklist encontrado para o período selecionado
            </p>
          ) : (
            <div className="space-y-3">
              {checklists.map((checklist, index) => {
                const stats = getChecklistStats(checklist);
                return (
                  <div
                    key={checklist.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-all duration-200 animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => openChecklistDetail(checklist)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        checklist.is_perfect ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted"
                      )}>
                        {checklist.is_perfect ? (
                          <Star className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {format(new Date(checklist.checklist_date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{checklist.submitted_by_name}</span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(checklist.created_at), "HH:mm")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-foreground">{stats.percentage}%</p>
                        <p className="text-xs text-muted-foreground">{stats.yesCount}/{stats.total}</p>
                      </div>
                      <Badge className={cn("gap-1.5", checklist.is_perfect 
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {checklist.is_perfect ? "Perfeito" : "Concluído"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedChecklist} onOpenChange={() => setSelectedChecklist(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedChecklist?.is_perfect && <Star className="h-5 w-5 text-amber-500" />}
              Checklist - {selectedChecklist && format(new Date(selectedChecklist.checklist_date), "dd/MM/yyyy")}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedChecklist && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedChecklist.submitted_by_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Enviado às {format(new Date(selectedChecklist.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(
                    selectedChecklist.is_perfect 
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  )}>
                    {selectedChecklist.is_perfect ? "Checklist Perfeito ⭐" : "Concluído"}
                  </Badge>
                </div>

                {/* Sections */}
                {sections.map((section) => {
                  const SectionIcon = section.icon;
                  const sectionYes = section.fields.filter(
                    f => selectedChecklist[f.key as keyof ChecklistRecord] === true
                  ).length;

                  return (
                    <div key={section.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <SectionIcon className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{section.title}</h3>
                        <Badge variant="outline" className="ml-auto">
                          {sectionYes}/{section.fields.length}
                        </Badge>
                      </div>
                      <div className="grid gap-2">
                        {section.fields.map((field) => {
                          const value = selectedChecklist[field.key as keyof ChecklistRecord] as boolean | null;
                          return (
                            <div
                              key={field.key}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border",
                                value === true && "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20",
                                value === false && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                              )}
                            >
                              <span className="text-sm">{field.label}</span>
                              {value === true ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Occurrences */}
                {occurrences.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <h3 className="font-semibold">Ocorrências Registradas</h3>
                        <Badge variant="outline" className="ml-auto">
                          {occurrences.length}
                        </Badge>
                      </div>
                      {occurrences.map((occ, idx) => (
                        <div key={occ.id} className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                              Ocorrência #{idx + 1}
                            </p>
                            <p className="text-sm">{occ.occurrence}</p>
                          </div>
                          {occ.action_taken && (
                            <div>
                              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                Medida tomada
                              </p>
                              <p className="text-sm">{occ.action_taken}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}