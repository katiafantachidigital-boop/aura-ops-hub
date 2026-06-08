import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Target,
  TrendingUp,
  Calendar as CalendarIcon,
  CheckCircle2,
  Sparkles,
  Pencil,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Clinic = "capao_raso" | "batel";

interface MonthlyGoal {
  id?: string;
  clinic: Clinic;
  period: string;
  total_goal: number;
  saturday_pct: number;
  morning_pct: number;
}

interface DailyOverride {
  goal_date: string;
  morning_actual: number | null;
  night_actual: number | null;
}

interface CashEntry {
  register_date: string;
  total_value: number;
  clinic: string;
}

const CLINIC_LABEL: Record<Clinic, string> = {
  capao_raso: "Capão Raso",
  batel: "Batel",
};

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function GoalsCalendar() {
  const { isManager, profile } = useAuth();
  const canEdit = isManager;

  // Tab clinic: gestoras choose; supervisoras locked to their clinic
  const supervisorClinic = (profile?.clinic as Clinic | undefined) ?? "capao_raso";
  const [clinic, setClinic] = useState<Clinic>(
    isManager ? "capao_raso" : supervisorClinic
  );

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [goal, setGoal] = useState<MonthlyGoal | null>(null);
  const [overrides, setOverrides] = useState<Record<string, DailyOverride>>({});
  const [cashByDate, setCashByDate] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Form state for monthly goal
  const [formGoal, setFormGoal] = useState("");
  const [formSat, setFormSat] = useState("20");
  const [formMorning, setFormMorning] = useState("55");

  const period = monthKey(cursor);

  useEffect(() => {
    void loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinic, period]);

  async function loadMonth() {
    setLoading(true);
    try {
      const startOfMonth = period;
      const endDate = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const endStr = dateKey(endDate);

      const [{ data: goalRow }, { data: ovRows }, { data: cashRows }] =
        await Promise.all([
          supabase
            .from("monthly_goals")
            .select("*")
            .eq("clinic", clinic)
            .eq("period", startOfMonth)
            .maybeSingle(),
          supabase
            .from("daily_goal_overrides")
            .select("goal_date, morning_actual, night_actual")
            .eq("clinic", clinic)
            .gte("goal_date", startOfMonth)
            .lte("goal_date", endStr),
          supabase
            .from("cash_register")
            .select("register_date, total_value, clinic")
            .eq("clinic", clinic)
            .gte("register_date", startOfMonth)
            .lte("register_date", endStr),
        ]);

      const g = goalRow
        ? (goalRow as MonthlyGoal)
        : {
            clinic,
            period: startOfMonth,
            total_goal: 0,
            saturday_pct: 20,
            morning_pct: 55,
          };
      setGoal(g);
      setFormGoal(String(g.total_goal || ""));
      setFormSat(String(g.saturday_pct ?? 20));
      setFormMorning(String(g.morning_pct ?? 55));

      const ovMap: Record<string, DailyOverride> = {};
      (ovRows ?? []).forEach((r: any) => {
        ovMap[r.goal_date] = r;
      });
      setOverrides(ovMap);

      const cashMap: Record<string, number> = {};
      (cashRows as CashEntry[] | null)?.forEach((c) => {
        cashMap[c.register_date] = (cashMap[c.register_date] ?? 0) + Number(c.total_value);
      });
      setCashByDate(cashMap);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar metas do mês");
    } finally {
      setLoading(false);
    }
  }

  // Build calendar grid
  const calendar = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [cursor]);

  // Distribution math
  const distribution = useMemo(() => {
    if (!goal || !goal.total_goal) {
      return { regularDayGoal: 0, saturdayGoal: 0, regularDays: 0, saturdayCount: 0 };
    }
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let regularDays = 0;
    let saturdayCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const wd = new Date(year, month, d).getDay();
      if (wd === 0) continue;
      if (wd === 6) saturdayCount++;
      else regularDays++;
    }
    const satFactor = goal.saturday_pct / 100;
    const denom = regularDays + saturdayCount * satFactor;
    const regularDayGoal = denom > 0 ? goal.total_goal / denom : 0;
    const saturdayGoal = regularDayGoal * satFactor;
    return { regularDayGoal, saturdayGoal, regularDays, saturdayCount };
  }, [goal, cursor]);

  function goalForDate(date: Date): { total: number; morning: number; night: number } {
    const wd = date.getDay();
    if (wd === 0) return { total: 0, morning: 0, night: 0 };
    const total = wd === 6 ? distribution.saturdayGoal : distribution.regularDayGoal;
    const morningPct = (goal?.morning_pct ?? 55) / 100;
    return { total, morning: total * morningPct, night: total * (1 - morningPct) };
  }

  function actualForDate(date: Date): { total: number; morning: number | null; night: number | null; fromOverride: boolean } {
    const key = dateKey(date);
    const ov = overrides[key];
    if (ov && (ov.morning_actual !== null || ov.night_actual !== null)) {
      const m = ov.morning_actual ?? 0;
      const n = ov.night_actual ?? 0;
      return { total: m + n, morning: ov.morning_actual, night: ov.night_actual, fromOverride: true };
    }
    const cash = cashByDate[key] ?? 0;
    return { total: cash, morning: null, night: null, fromOverride: false };
  }

  // Aggregate totals
  const totals = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let totalActual = 0;
    let daysLaunched = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const a = actualForDate(dt);
      if (a.total > 0) {
        totalActual += a.total;
        daysLaunched++;
      }
    }
    const totalGoal = goal?.total_goal ?? 0;
    const pct = totalGoal > 0 ? (totalActual / totalGoal) * 100 : 0;
    const diff = totalActual - totalGoal;
    const avgDay = daysLaunched > 0 ? totalActual / daysLaunched : 0;
    return { totalActual, totalGoal, pct, diff, daysLaunched, avgDay };
  }, [cursor, overrides, cashByDate, goal]);

  async function saveMonthlyGoal() {
    if (!canEdit) return;
    const total = parseFloat(formGoal.replace(",", ".")) || 0;
    const sat = Math.max(0, Math.min(100, parseInt(formSat) || 0));
    const morn = Math.max(0, Math.min(100, parseInt(formMorning) || 0));
    try {
      const payload = {
        clinic,
        period,
        total_goal: total,
        saturday_pct: sat,
        morning_pct: morn,
      };
      const { error } = await supabase
        .from("monthly_goals")
        .upsert(payload, { onConflict: "clinic,period" });
      if (error) throw error;
      toast.success("Meta do mês salva");
      void loadMonth();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao salvar meta");
    }
  }

  // Edit dialog state for a specific day
  const [editing, setEditing] = useState<{ date: Date; morning: string; night: string } | null>(null);

  function openEdit(date: Date) {
    if (!canEdit) return;
    const key = dateKey(date);
    const ov = overrides[key];
    const cash = cashByDate[key] ?? 0;
    setEditing({
      date,
      morning: ov?.morning_actual != null ? String(ov.morning_actual) : "",
      night: ov?.night_actual != null ? String(ov.night_actual) : (ov ? "" : cash ? String(cash) : ""),
    });
  }

  async function saveEdit() {
    if (!editing || !canEdit) return;
    const morning = editing.morning.trim() === "" ? null : parseFloat(editing.morning.replace(",", "."));
    const night = editing.night.trim() === "" ? null : parseFloat(editing.night.replace(",", "."));
    try {
      const { error } = await supabase
        .from("daily_goal_overrides")
        .upsert(
          {
            clinic,
            goal_date: dateKey(editing.date),
            morning_actual: morning,
            night_actual: night,
            updated_by: profile?.id ?? null,
          },
          { onConflict: "clinic,goal_date" }
        );
      if (error) throw error;
      toast.success("Lançamento salvo");
      setEditing(null);
      void loadMonth();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao salvar lançamento");
    }
  }

  function clearEdit() {
    if (!editing || !canEdit) return;
    void supabase
      .from("daily_goal_overrides")
      .delete()
      .eq("clinic", clinic)
      .eq("goal_date", dateKey(editing.date))
      .then(({ error }) => {
        if (error) toast.error("Erro ao limpar");
        else {
          toast.success("Override removido — usando valor do caixa");
          setEditing(null);
          void loadMonth();
        }
      });
  }

  const monthLabel = cursor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header / hero */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_60%)] pointer-events-none" />
        <div className="relative p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
              <Target className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold capitalize tracking-tight">
                Calendário de Metas — {monthLabel}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isManager
                  ? "Defina a meta mensal por unidade. Realizado conecta automaticamente ao caixa."
                  : `Visualização da unidade ${CLINIC_LABEL[clinic]} (somente leitura)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                const d = new Date(cursor);
                d.setMonth(d.getMonth() - 1);
                setCursor(d);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const d = new Date();
                d.setDate(1);
                setCursor(d);
              }}
            >
              <CalendarIcon className="h-4 w-4 mr-2" /> Hoje
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                const d = new Date(cursor);
                d.setMonth(d.getMonth() + 1);
                setCursor(d);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Clinic tabs (gestora only) */}
      {isManager ? (
        <Tabs value={clinic} onValueChange={(v) => setClinic(v as Clinic)}>
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="capao_raso">Capão Raso</TabsTrigger>
            <TabsTrigger value="batel">Batel</TabsTrigger>
          </TabsList>
          <TabsContent value={clinic} />
        </Tabs>
      ) : null}

      {/* Calculator config */}
      <Card className="p-5 border-primary/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">
              Configuração da meta — {CLINIC_LABEL[clinic]}
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Meta mensal (R$)</Label>
            <Input
              type="number"
              value={formGoal}
              onChange={(e) => setFormGoal(e.target.value)}
              disabled={!canEdit}
              placeholder="90000"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">% Sábado</Label>
            <Input
              type="number"
              value={formSat}
              onChange={(e) => setFormSat(e.target.value)}
              disabled={!canEdit}
              min={0}
              max={100}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">% Turno Manhã</Label>
            <Input
              type="number"
              value={formMorning}
              onChange={(e) => setFormMorning(e.target.value)}
              disabled={!canEdit}
              min={0}
              max={100}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={saveMonthlyGoal}
              disabled={!canEdit}
              className="w-full gradient-primary"
            >
              <Save className="h-4 w-4 mr-2" /> Salvar meta
            </Button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Meta do mês"
          value={formatBRL(totals.totalGoal)}
          icon={Target}
          tone="primary"
        />
        <KpiCard
          label="Total realizado"
          value={formatBRL(totals.totalActual)}
          icon={CheckCircle2}
          tone="emerald"
        />
        <KpiCard
          label="% Atingido"
          value={`${totals.pct.toFixed(1)}%`}
          icon={TrendingUp}
          tone={totals.pct >= 100 ? "emerald" : "amber"}
        />
        <KpiCard
          label="Diferença"
          value={formatBRL(totals.diff)}
          icon={TrendingUp}
          tone={totals.diff >= 0 ? "emerald" : "rose"}
        />
        <KpiCard
          label="Média/dia"
          value={formatBRL(totals.avgDay)}
          icon={CalendarIcon}
          tone="primary"
        />
      </div>

      {/* Shift summary bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ShiftBar
          icon={Sun}
          label="Turno Manhã (07h–14h)"
          goalLabel={`Meta: ${formatBRL(totals.totalGoal * ((goal?.morning_pct ?? 55) / 100))}`}
          realizedLabel={`Realizado: —`}
          tone="amber"
        />
        <ShiftBar
          icon={Moon}
          label="Turno Tarde/Noite (14h–21h)"
          goalLabel={`Meta: ${formatBRL(totals.totalGoal * (1 - (goal?.morning_pct ?? 55) / 100))}`}
          realizedLabel={`Realizado: —`}
          tone="primary"
        />
      </div>

      {/* Calendar */}
      <Card className="p-3 sm:p-5">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                "text-center text-xs font-semibold uppercase tracking-wider py-2 rounded",
                i === 0 ? "text-rose-400" : "text-muted-foreground"
              )}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendar.map((cell, idx) => {
            if (!cell.date) {
              return <div key={idx} className="aspect-square sm:aspect-auto sm:min-h-[120px]" />;
            }
            const date = cell.date;
            const g = goalForDate(date);
            const a = actualForDate(date);
            const wd = date.getDay();
            const isToday = dateKey(date) === dateKey(new Date());
            const isSunday = wd === 0;
            const isSaturday = wd === 6;
            const pct = g.total > 0 ? (a.total / g.total) * 100 : 0;
            const reached = pct >= 100;
            return (
              <button
                key={idx}
                onClick={() => !isSunday && openEdit(date)}
                disabled={isSunday || !canEdit}
                className={cn(
                  "group relative text-left rounded-xl border p-2 sm:p-3 min-h-[110px] sm:min-h-[140px] transition-all",
                  "bg-card/40 backdrop-blur-sm",
                  isSunday && "opacity-40 cursor-not-allowed",
                  !isSunday && canEdit && "hover:border-primary/60 hover:shadow-glow cursor-pointer",
                  isToday && "border-primary ring-2 ring-primary/40",
                  !isToday && "border-border/60",
                  reached && !isSunday && "border-emerald-500/40 bg-emerald-500/5"
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <span
                    className={cn(
                      "text-base font-bold",
                      isSunday && "text-rose-400",
                      isToday && "text-primary"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                      Hoje
                    </span>
                  )}
                  {isSaturday && !isToday && (
                    <span className="text-[9px] text-muted-foreground uppercase">Baixo fluxo</span>
                  )}
                </div>

                {!isSunday && (
                  <>
                    <div className="text-[10px] text-muted-foreground">META</div>
                    <div className="text-[11px] sm:text-xs font-semibold tabular-nums">
                      {formatBRL(g.total)}
                    </div>

                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Sun className="h-3 w-3 text-amber-400" />
                      <span className="tabular-nums">{formatBRL(g.morning)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Moon className="h-3 w-3 text-indigo-400" />
                      <span className="tabular-nums">{formatBRL(g.night)}</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">REALIZ.</span>
                        <span className={cn("font-bold tabular-nums", reached ? "text-emerald-400" : "text-foreground")}>
                          {formatBRL(a.total)}
                        </span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            reached
                              ? "bg-emerald-500"
                              : pct >= 70
                                ? "bg-primary"
                                : pct > 0
                                  ? "bg-amber-400"
                                  : "bg-transparent"
                          )}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      {a.fromOverride && (
                        <div className="mt-1 text-[9px] text-primary/80 uppercase tracking-wider">
                          Lançamento manual
                        </div>
                      )}
                    </div>

                    {canEdit && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="h-3 w-3 text-primary" />
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Edit Day Dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <Card className="w-full max-w-md p-6 border-primary/30" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">
              Lançamento — {editing.date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Meta do dia: {formatBRL(goalForDate(editing.date).total)} ({CLINIC_LABEL[clinic]})
            </p>
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 text-xs">
                  <Sun className="h-3 w-3 text-amber-400" /> Realizado — Manhã (07h–14h)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editing.morning}
                  onChange={(e) => setEditing({ ...editing, morning: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2 text-xs">
                  <Moon className="h-3 w-3 text-indigo-400" /> Realizado — Tarde/Noite (14h–21h)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editing.night}
                  onChange={(e) => setEditing({ ...editing, night: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Deixe em branco para puxar automaticamente do caixa do dia.
              </p>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">
                Cancelar
              </Button>
              <Button variant="ghost" onClick={clearEdit}>
                Limpar
              </Button>
              <Button onClick={saveEdit} className="flex-1 gradient-primary">
                <Save className="h-4 w-4 mr-2" /> Salvar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {loading && (
        <div className="text-center text-sm text-muted-foreground">Carregando…</div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: any;
  tone: "primary" | "emerald" | "amber" | "rose";
}) {
  const toneClasses: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 border-primary/30 text-primary",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400",
  };
  return (
    <Card className={cn("p-4 bg-gradient-to-br border", toneClasses[tone])}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold opacity-80">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-2 text-xl font-bold tabular-nums text-foreground">{value}</div>
    </Card>
  );
}

function ShiftBar({
  icon: Icon,
  label,
  goalLabel,
  realizedLabel,
  tone,
}: {
  icon: any;
  label: string;
  goalLabel: string;
  realizedLabel: string;
  tone: "amber" | "primary";
}) {
  return (
    <Card
      className={cn(
        "p-4 border bg-gradient-to-r",
        tone === "amber"
          ? "border-amber-500/30 from-amber-500/10 to-transparent"
          : "border-primary/30 from-primary/10 to-transparent"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", tone === "amber" ? "text-amber-400" : "text-primary")} />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{goalLabel}</span>
        <span className="font-semibold">{realizedLabel}</span>
      </div>
    </Card>
  );
}
