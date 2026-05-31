import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Link as LinkIcon,
  Users,
  Lock,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  Trash2,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MeetingStatus = "scheduled" | "finalized" | "completed";

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  meeting_time: string;
  meeting_link: string | null;
  agenda: string | null;
  participants: string[];
  status: MeetingStatus;
  created_by: string;
  created_by_name: string;
  finalized_at: string | null;
  completed_at: string | null;
}

interface Signature {
  id: string;
  meeting_id: string;
  user_id: string;
  user_name: string;
  signed_name: string;
  signed_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  custom_role: string | null;
  role: string | null;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function AgendaModule() {
  const { user, isManager } = useAuth();
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [finalizingMeeting, setFinalizingMeeting] = useState<Meeting | null>(null);
  const [signingMeeting, setSigningMeeting] = useState<Meeting | null>(null);

  // form state
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formParticipants, setFormParticipants] = useState<string[]>([]);
  const [formDate, setFormDate] = useState("");
  const [formAgenda, setFormAgenda] = useState("");
  const [signatureName, setSignatureName] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [mRes, sRes, pRes] = await Promise.all([
      supabase.from("meetings").select("*").order("meeting_time"),
      supabase.from("meeting_signatures").select("*"),
      supabase.from("profiles").select("id, full_name, avatar_url, custom_role, role"),
    ]);
    if (mRes.data) setMeetings(mRes.data as Meeting[]);
    if (sRes.data) setSignatures(sRes.data as Signature[]);
    if (pRes.data) setProfiles(pRes.data as Profile[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("agenda-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_signatures" }, () => loadData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadData]);

  const profileById = useMemo(() => {
    const m: Record<string, Profile> = {};
    profiles.forEach((p) => (m[p.id] = p));
    return m;
  }, [profiles]);

  // Build calendar grid
  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(toISODate(new Date(year, month, d)));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewDate]);

  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    meetings.forEach((m) => {
      (map[m.meeting_date] ||= []).push(m);
    });
    return map;
  }, [meetings]);

  const signaturesByMeeting = useMemo(() => {
    const map: Record<string, Signature[]> = {};
    signatures.forEach((s) => {
      (map[s.meeting_id] ||= []).push(s);
    });
    return map;
  }, [signatures]);

  const resetForm = () => {
    setFormTitle("");
    setFormTime("");
    setFormLink("");
    setFormParticipants([]);
    setFormDate(selectedDate || toISODate(new Date()));
    setEditingMeeting(null);
  };

  const openCreate = (date: string) => {
    resetForm();
    setFormDate(date);
    setCreateOpen(true);
  };

  const openEdit = (m: Meeting) => {
    setEditingMeeting(m);
    setFormTitle(m.title);
    setFormTime(m.meeting_time);
    setFormLink(m.meeting_link || "");
    setFormParticipants(m.participants);
    setFormDate(m.meeting_date);
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return toast.error("Informe o título");
    if (!formTime) return toast.error("Informe o horário");
    if (formParticipants.length === 0) return toast.error("Selecione ao menos um participante");
    if (!user) return;

    const payload = {
      title: formTitle.trim(),
      meeting_date: formDate,
      meeting_time: formTime,
      meeting_link: formLink.trim() || null,
      participants: formParticipants,
    };

    if (editingMeeting) {
      const { error } = await supabase.from("meetings").update(payload).eq("id", editingMeeting.id);
      if (error) return toast.error("Erro ao atualizar: " + error.message);
      toast.success("Reunião atualizada");
    } else {
      const myName =
        profileById[user.id]?.full_name || user.email?.split("@")[0] || "Gestora";
      const { error } = await supabase.from("meetings").insert({
        ...payload,
        created_by: user.id,
        created_by_name: myName,
      });
      if (error) return toast.error("Erro ao agendar: " + error.message);
      toast.success("Reunião agendada");
    }
    setCreateOpen(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta reunião?")) return;
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Reunião excluída");
    loadData();
  };

  const handleFinalize = async () => {
    if (!finalizingMeeting) return;
    if (!formAgenda.trim()) return toast.error("Preencha a pauta antes de finalizar");
    const { error } = await supabase
      .from("meetings")
      .update({
        agenda: formAgenda.trim(),
        status: "finalized",
        finalized_at: new Date().toISOString(),
      })
      .eq("id", finalizingMeeting.id);
    if (error) return toast.error("Erro ao finalizar: " + error.message);
    toast.success("Reunião finalizada. Participantes podem assinar agora.");
    setFinalizingMeeting(null);
    setFormAgenda("");
    loadData();
  };

  const handleSign = async () => {
    if (!signingMeeting || !user) return;
    if (!signatureName.trim()) return toast.error("Digite seu nome completo");
    const myProfile = profileById[user.id];
    const { error } = await supabase.from("meeting_signatures").insert({
      meeting_id: signingMeeting.id,
      user_id: user.id,
      user_name: myProfile?.full_name || user.email || "Usuário",
      signed_name: signatureName.trim(),
    });
    if (error) return toast.error("Erro ao assinar: " + error.message);
    toast.success("Assinatura registrada");
    setSigningMeeting(null);
    setSignatureName("");
    loadData();
  };

  const selectableProfiles = profiles.filter((p) => p.id !== user?.id);

  const dayMeetings = selectedDate ? meetingsByDate[selectedDate] || [] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[180px] text-center">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const d = new Date();
                setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
              }}
            >
              Hoje
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="month"
              value={`${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map(Number);
                if (y && m) setViewDate(new Date(y, m - 1, 1));
              }}
              className="w-[160px]"
            />
          </div>
        </div>
      </Card>

      {/* Calendar grid */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-xs font-semibold text-muted-foreground text-center py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((iso, idx) => {
            if (!iso) return <div key={idx} className="aspect-square" />;
            const dayNum = parseInt(iso.split("-")[2], 10);
            const items = meetingsByDate[iso] || [];
            const isToday = iso === toISODate(new Date());
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={cn(
                  "aspect-square rounded-md border p-1.5 text-left transition-all hover:border-primary hover:bg-accent/50 flex flex-col gap-0.5 overflow-hidden",
                  isToday && "border-primary bg-primary/5",
                  items.length > 0 && "bg-accent/30"
                )}
              >
                <span className={cn("text-xs font-medium", isToday && "text-primary font-bold")}>
                  {dayNum}
                </span>
                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                  {items.slice(0, 2).map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "text-[10px] truncate rounded px-1 py-0.5 flex items-center gap-0.5",
                        m.status === "scheduled" && "bg-blue-500/20 text-blue-700 dark:text-blue-300",
                        m.status === "finalized" && "bg-amber-500/20 text-amber-700 dark:text-amber-300",
                        m.status === "completed" && "bg-green-500/20 text-green-700 dark:text-green-300"
                      )}
                    >
                      {m.status === "completed" && <Lock className="h-2 w-2 shrink-0" />}
                      <span className="truncate">{m.meeting_time} {m.title}</span>
                    </div>
                  ))}
                  {items.length > 2 && (
                    <span className="text-[9px] text-muted-foreground">+{items.length - 2}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-4 text-xs flex-wrap">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-blue-500" /> Agendada</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-amber-500" /> Aguardando assinaturas</span>
          <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-green-600" /> Concluída</span>
        </div>
      </Card>

      {/* Day panel */}
      <Sheet open={!!selectedDate} onOpenChange={(o) => !o && setSelectedDate(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDate && formatDateBR(selectedDate)}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {dayMeetings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Nenhuma reunião agendada para este dia</p>
              </div>
            ) : (
              dayMeetings.map((m) => {
                const sigs = signaturesByMeeting[m.id] || [];
                const mySig = sigs.find((s) => s.user_id === user?.id);
                const isParticipant = user ? m.participants.includes(user.id) : false;
                return (
                  <Card key={m.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold flex items-center gap-2">
                          {m.status === "completed" && <Lock className="h-4 w-4 text-green-600" />}
                          {m.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Criada por {m.created_by_name}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          m.status === "scheduled" && "border-blue-500 text-blue-600",
                          m.status === "finalized" && "border-amber-500 text-amber-600",
                          m.status === "completed" && "border-green-500 text-green-600"
                        )}
                      >
                        {m.status === "scheduled" && "Agendada"}
                        {m.status === "finalized" && "Aguardando"}
                        {m.status === "completed" && "Concluída"}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {m.meeting_time}</div>
                      {m.meeting_link && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                            {m.meeting_link}
                          </a>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {m.participants.map((pid) => {
                            const signed = sigs.some((s) => s.user_id === pid);
                            const name = profileById[pid]?.full_name || "?";
                            return (
                              <Badge key={pid} variant={signed ? "default" : "secondary"} className="text-xs">
                                {signed && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {name}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {m.agenda && (
                      <div className="bg-muted/50 rounded-md p-3 text-sm">
                        <p className="font-medium text-xs mb-1 text-muted-foreground uppercase">Pauta</p>
                        <p className="whitespace-pre-wrap">{m.agenda}</p>
                      </div>
                    )}

                    {/* Manager actions */}
                    {isManager && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {m.status === "scheduled" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                              <Edit className="h-3 w-3 mr-1" /> Editar
                            </Button>
                            <Button size="sm" onClick={() => { setFinalizingMeeting(m); setFormAgenda(m.agenda || ""); }}>
                              Finalizar reunião
                            </Button>
                          </>
                        )}
                        {m.status === "finalized" && (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            {sigs.length}/{m.participants.length} assinaturas
                          </div>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)} className="text-destructive ml-auto">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Participant signature */}
                    {!isManager && isParticipant && m.status === "finalized" && !mySig && (
                      <Button size="sm" className="w-full" onClick={() => setSigningMeeting(m)}>
                        Assinar participação
                      </Button>
                    )}
                    {!isManager && isParticipant && mySig && (
                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 rounded p-2">
                        <CheckCircle2 className="h-4 w-4" /> Você assinou como "{mySig.signed_name}"
                      </div>
                    )}
                  </Card>
                );
              })
            )}

            {isManager && selectedDate && (
              <Button className="w-full" onClick={() => openCreate(selectedDate)}>
                <Plus className="h-4 w-4 mr-2" /> Agendar reunião
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create / Edit dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMeeting ? "Editar reunião" : "Agendar reunião"}</DialogTitle>
            <DialogDescription>
              {editingMeeting
                ? "Atualize os dados desta reunião."
                : "Preencha os dados para agendar."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Alinhamento semanal" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div>
                <Label>Horário</Label>
                <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Link da reunião</Label>
              <Input value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
            <div>
              <Label>Participantes</Label>
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1 mt-1">
                {selectableProfiles.length === 0 && (
                  <p className="text-xs text-muted-foreground p-2">Nenhum perfil disponível</p>
                )}
                {selectableProfiles.map((p) => {
                  const selected = formParticipants.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setFormParticipants((prev) =>
                          selected ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                        )
                      }
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded text-left text-sm transition-colors",
                        selected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      )}
                    >
                      {selected ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border" />}
                      <span className="flex-1 truncate">{p.full_name || "Sem nome"}</span>
                      <span className="text-xs opacity-70">{p.custom_role || p.role}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{formParticipants.length} selecionado(s)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingMeeting ? "Salvar" : "Agendar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalize dialog */}
      <Dialog open={!!finalizingMeeting} onOpenChange={(o) => !o && setFinalizingMeeting(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Finalizar reunião</DialogTitle>
            <DialogDescription>
              Preencha a pauta com o que foi discutido e estabelecido. Após finalizar, os participantes poderão assinar.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Pauta da reunião</Label>
            <Textarea
              value={formAgenda}
              onChange={(e) => setFormAgenda(e.target.value)}
              rows={8}
              placeholder="Descreva os tópicos abordados, decisões tomadas, responsabilidades atribuídas..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizingMeeting(null)}>Cancelar</Button>
            <Button onClick={handleFinalize}>Finalizar reunião</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign dialog */}
      <Dialog open={!!signingMeeting} onOpenChange={(o) => !o && setSigningMeeting(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assinatura de participação</DialogTitle>
          </DialogHeader>
          {signingMeeting && (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <p className="font-medium">{signingMeeting.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateBR(signingMeeting.meeting_date)} às {signingMeeting.meeting_time}
                </p>
              </div>
              {signingMeeting.agenda && (
                <div className="bg-muted/30 rounded-md p-3 text-sm max-h-40 overflow-y-auto">
                  <p className="font-medium text-xs mb-1 text-muted-foreground uppercase">Pauta</p>
                  <p className="whitespace-pre-wrap">{signingMeeting.agenda}</p>
                </div>
              )}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-sm leading-relaxed">
                Eu,{" "}
                <Input
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="seu nome completo"
                  className="inline-block w-auto min-w-[200px] mx-1 h-7 text-sm"
                />
                , declaro que participei da reunião realizada em{" "}
                <strong>{formatDateBR(signingMeeting.meeting_date)}</strong>, fui devidamente apresentado(a) a todas as informações,
                diretrizes e responsabilidades discutidas, comprometendo-me a cumpri-las integralmente. Estou ciente de que o não cumprimento
                do que foi estabelecido nesta reunião poderá resultar em advertências, penalidades internas ou medidas legais cabíveis,
                conforme aplicável.
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSigningMeeting(null)}>Cancelar</Button>
                <Button onClick={handleSign}>Enviar assinatura</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
