import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Archive, FileSpreadsheet, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const COLS = 100;
const ROWS = 60;

// Header template baseado na planilha enviada
const HEADERS = [
  "Nº", "Data", "Nome do Lead", "Telefone", "Horário", "Ligou?", "Agendou?", "Observações",
];

// Sentinela: usamos uma única planilha contínua por usuário (sem reset diário).
const PERSISTENT_DATE = "1970-01-01";

function emptyData(): string[][] {
  const data: string[][] = [];
  // linha 0: cabeçalhos
  const header = new Array(COLS).fill("");
  HEADERS.forEach((h, i) => (header[i] = h));
  data.push(header);
  for (let i = 1; i < ROWS; i++) {
    const row = new Array(COLS).fill("");
    row[0] = String(i);
    data.push(row);
  }
  return data;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

interface SheetData {
  id?: string;
  user_id: string;
  user_name: string;
  sheet_date: string;
  data: string[][];
}

// Posições reservadas em data[0] para armazenar metas (não visíveis na grade principal)
const META_LIG_COL = 95;
const META_AGEN_COL = 96;
const META_CONV_COL = 97; // armazenado como % (ex: "20" = 20%)

function readGoals(data: string[][]) {
  const row0 = data[0] || [];
  const lig = parseInt(row0[META_LIG_COL] || "") || 35;
  const agen = parseInt(row0[META_AGEN_COL] || "") || 7;
  const conv = parseFloat(row0[META_CONV_COL] || "") || 20;
  return { lig, agen, conv };
}

function countSim(data: string[][], colIdx: number) {
  let n = 0;
  for (let r = 1; r < data.length; r++) {
    const v = (data[r]?.[colIdx] || "").trim().toLowerCase();
    if (v === "sim" || v === "s" || v === "✓" || v === "x") n++;
  }
  return n;
}

function evalLabel(pct: number) {
  if (pct >= 0.9) return { label: "🟢 Ótimo", cls: "text-emerald-600" };
  if (pct >= 0.7) return { label: "🟡 Esperado", cls: "text-yellow-600" };
  if (pct >= 0.5) return { label: "🟠 Mínimo", cls: "text-orange-600" };
  return { label: "🔴 Abaixo", cls: "text-red-600" };
}

function MetricsPanel({
  data,
  readOnly,
  onGoalsChange,
}: {
  data: string[][];
  readOnly?: boolean;
  onGoalsChange?: (goals: { lig: number; agen: number; conv: number }) => void;
}) {
  const goals = readGoals(data);
  const ligacoes = countSim(data, 4);
  const agendamentos = countSim(data, 5);
  const pctLig = goals.lig > 0 ? ligacoes / goals.lig : 0;
  const pctAgen = goals.agen > 0 ? agendamentos / goals.agen : 0;
  const taxaConv = ligacoes > 0 ? agendamentos / ligacoes : 0;
  const metaConv = goals.conv / 100;
  const evLig = evalLabel(pctLig);
  const evAgen = evalLabel(pctAgen);
  const evConv = ligacoes === 0
    ? { label: "—", cls: "text-muted-foreground" }
    : taxaConv >= metaConv * 1.2 ? { label: "🟢 Ótimo", cls: "text-emerald-600" }
    : taxaConv >= metaConv ? { label: "🟡 Esperado", cls: "text-yellow-600" }
    : taxaConv >= metaConv * 0.6 ? { label: "🟠 Mínimo", cls: "text-orange-600" }
    : { label: "🔴 Abaixo", cls: "text-red-600" };
  const overall =
    pctLig >= 0.9 && pctAgen >= 0.9 ? { label: "🟢 META BATIDA!", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" }
    : pctLig >= 0.7 && pctAgen >= 0.7 ? { label: "🟡 NO CAMINHO CERTO", cls: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" }
    : pctLig >= 0.5 || pctAgen >= 0.5 ? { label: "🟠 ATENÇÃO NECESSÁRIA", cls: "bg-orange-500/10 text-orange-700 dark:text-orange-400" }
    : { label: "🔴 REVISAR ESTRATÉGIA", cls: "bg-red-500/10 text-red-700 dark:text-red-400" };

  const setGoal = (key: "lig" | "agen" | "conv", val: string) => {
    const num = parseFloat(val) || 0;
    onGoalsChange?.({ ...goals, [key]: num });
  };

  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold">📊 Resumo do Dia</h3>
        <div className={`text-xs px-3 py-1 rounded-md font-medium ${overall.cls}`}>{overall.label}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Ligações */}
        <div className="border rounded-md p-3 space-y-1">
          <div className="text-xs text-muted-foreground">📞 Ligações</div>
          <div className="text-2xl font-bold">{ligacoes} <span className="text-sm font-normal text-muted-foreground">/ {goals.lig}</span></div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">{fmtPct(pctLig)}</span>
            <span className={evLig.cls}>{evLig.label}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Faltam: {Math.max(goals.lig - ligacoes, 0)}</div>
          <div className="h-1.5 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.min(pctLig * 100, 100)}%` }} />
          </div>
          {!readOnly && (
            <label className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              Meta:
              <input type="number" min={0} value={goals.lig}
                onChange={(e) => setGoal("lig", e.target.value)}
                className="w-16 px-1 py-0.5 border rounded bg-background text-foreground text-xs" />
            </label>
          )}
        </div>

        {/* Agendamentos */}
        <div className="border rounded-md p-3 space-y-1">
          <div className="text-xs text-muted-foreground">📅 Agendamentos</div>
          <div className="text-2xl font-bold">{agendamentos} <span className="text-sm font-normal text-muted-foreground">/ {goals.agen}</span></div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">{fmtPct(pctAgen)}</span>
            <span className={evAgen.cls}>{evAgen.label}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Faltam: {Math.max(goals.agen - agendamentos, 0)}</div>
          <div className="h-1.5 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.min(pctAgen * 100, 100)}%` }} />
          </div>
          {!readOnly && (
            <label className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              Meta:
              <input type="number" min={0} value={goals.agen}
                onChange={(e) => setGoal("agen", e.target.value)}
                className="w-16 px-1 py-0.5 border rounded bg-background text-foreground text-xs" />
            </label>
          )}
        </div>

        {/* Conversão */}
        <div className="border rounded-md p-3 space-y-1">
          <div className="text-xs text-muted-foreground">🔄 Taxa de Conversão</div>
          <div className="text-2xl font-bold">{fmtPct(taxaConv)}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">Meta: {goals.conv}%</span>
            <span className={evConv.cls}>{evConv.label}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Ligações → Agendamentos</div>
          <div className="h-1.5 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.min((taxaConv / Math.max(metaConv, 0.0001)) * 100, 100)}%` }} />
          </div>
          {!readOnly && (
            <label className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
              Meta %:
              <input type="number" min={0} max={100} step={1} value={goals.conv}
                onChange={(e) => setGoal("conv", e.target.value)}
                className="w-16 px-1 py-0.5 border rounded bg-background text-foreground text-xs" />
            </label>
          )}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Marque "Sim" nas colunas <strong>Ligou?</strong> e <strong>Agendou?</strong> — os cálculos atualizam automaticamente.
      </p>
    </Card>
  );
}

function SheetEditor({
  initial,
  readOnly,
  onChange,
  saving,
}: {
  initial: string[][];
  readOnly?: boolean;
  onChange?: (data: string[][]) => void;
  saving?: boolean;
}) {
  const [data, setData] = useState<string[][]>(initial);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  const handleCell = (r: number, c: number, val: string) => {
    if (readOnly) return;
    setData((prev) => {
      const next = prev.map((row) => [...row]);
      if (!next[r]) next[r] = new Array(COLS).fill("");
      next[r][c] = val;
      onChange?.(next);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-h-[20px]">
        {saving ? (
          <><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</>
        ) : !readOnly ? (
          <>✓ Tudo salvo automaticamente</>
        ) : null}
      </div>
      <div className="border rounded-md overflow-auto max-h-[70vh] no-screenshot">
        <table className="text-xs border-collapse">
          <tbody>
            {data.map((row, r) => (
              <tr key={r}>
                <td className="sticky left-0 bg-muted/80 border border-border px-2 text-muted-foreground font-mono text-[10px] z-10">
                  {r + 1}
                </td>
                {row.map((cell, c) => (
                  <td key={c} className="border border-border p-0">
                    <input
                      value={cell || ""}
                      onChange={(e) => handleCell(r, c, e.target.value)}
                      readOnly={readOnly}
                      className={`w-32 px-2 py-1 bg-background outline-none focus:bg-accent/30 focus:ring-1 focus:ring-primary ${
                        r === 0 ? "font-semibold bg-muted/40" : ""
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserSheetView({ targetUserId, targetUserName }: { targetUserId: string; targetUserName: string }) {
  const { isManager, user } = useAuth();
  const isOwn = user?.id === targetUserId;
  const today = todayISO();

  const [todaySheet, setTodaySheet] = useState<SheetData | null>(null);
  const [archive, setArchive] = useState<SheetData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("today");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("prospeccao_sheets")
      .select("*")
      .eq("user_id", targetUserId)
      .order("sheet_date", { ascending: false });

    const list = (rows || []) as any[];
    const todayRow = list.find((r) => r.sheet_date === today);
    setTodaySheet(
      todayRow
        ? { ...todayRow, data: Array.isArray(todayRow.data) ? todayRow.data : emptyData() }
        : { user_id: targetUserId, user_name: targetUserName, sheet_date: today, data: emptyData() }
    );
    setArchive(list.filter((r) => r.sheet_date !== today).map((r) => ({ ...r, data: r.data })));
    setLoading(false);
  }, [targetUserId, targetUserName, today]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(
    async (data: string[][]) => {
      if (!isOwn) return;
      setSaving(true);
      const { error } = await supabase
        .from("prospeccao_sheets")
        .upsert(
          {
            user_id: targetUserId,
            user_name: targetUserName,
            sheet_date: today,
            data: data as any,
          },
          { onConflict: "user_id,sheet_date" }
        );
      setSaving(false);
      if (error) toast.error("Erro ao salvar: " + error.message);
    },
    [isOwn, targetUserId, targetUserName, today]
  );

  const handleChange = (data: string[][]) => {
    if (!isOwn) return;
    setTodaySheet((prev) => (prev ? { ...prev, data } : prev));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(data), 600);
  };

  const handleGoalsChange = (goals: { lig: number; agen: number; conv: number }) => {
    if (!isOwn || !todaySheet) return;
    const next = todaySheet.data.map((row) => [...row]);
    if (!next[0]) next[0] = new Array(COLS).fill("");
    next[0][META_LIG_COL] = String(goals.lig);
    next[0][META_AGEN_COL] = String(goals.agen);
    next[0][META_CONV_COL] = String(goals.conv);
    handleChange(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  // Colaborador: vê apenas a planilha de hoje
  if (!isManager) {
    return (
      <div className="space-y-3">
        <MetricsPanel data={todaySheet?.data || emptyData()} onGoalsChange={handleGoalsChange} />
        <SheetEditor
          initial={todaySheet?.data || emptyData()}
          onChange={handleChange}
          saving={saving}
        />
      </div>
    );
  }

  // Gestora: tabs Hoje / Arquivado
  const selectedArchive = archive.find((a) => a.sheet_date === selectedDate);

  return (
    <Tabs defaultValue="today" className="w-full">
      <TabsList>
        <TabsTrigger value="today"><FileSpreadsheet className="h-4 w-4 mr-1" /> Hoje</TabsTrigger>
        <TabsTrigger value="archive"><Archive className="h-4 w-4 mr-1" /> Arquivado ({archive.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="today" className="mt-3 space-y-3">
        <MetricsPanel data={todaySheet?.data || emptyData()} readOnly={!isOwn} onGoalsChange={handleGoalsChange} />
        <SheetEditor initial={todaySheet?.data || emptyData()} readOnly={!isOwn} onChange={handleChange} saving={saving} />
      </TabsContent>
      <TabsContent value="archive" className="mt-3 space-y-3">
        {archive.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum dia arquivado ainda.</p>
        ) : (
          <>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full md:w-72">
                <SelectValue placeholder="Selecione um dia" />
              </SelectTrigger>
              <SelectContent>
                {archive.map((a) => (
                  <SelectItem key={a.sheet_date} value={a.sheet_date}>
                    {formatDateBR(a.sheet_date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedArchive && (
              <>
                <MetricsPanel data={selectedArchive.data || emptyData()} readOnly />
                <SheetEditor initial={selectedArchive.data || emptyData()} readOnly />
              </>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function ProspeccaoModule() {
  const { user, isManager } = useAuth();
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [activeUser, setActiveUser] = useState<string>("");
  const [myName, setMyName] = useState<string>("");

  // Anti-screenshot: oculta o conteúdo somente ao tentar capturar (PrintScreen) ou quando a aba está oculta
  const [obscured, setObscured] = useState(false);
  useEffect(() => {
    const onVis = () => setObscured(document.visibilityState === "hidden");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.shiftKey && (e.metaKey || e.ctrlKey) && (e.key === "S" || e.key === "s" || e.key === "3" || e.key === "4" || e.key === "5"))) {
        setObscured(true);
        setTimeout(() => setObscured(false), 1500);
        try { navigator.clipboard.writeText(""); } catch {}
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("keyup", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  // Estilo print: tudo preto ao tentar imprimir/capturar
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print { .no-screenshot, .no-screenshot * { color: transparent !important; background: black !important; text-shadow: none !important; } }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .maybeSingle();
      setMyName(profile?.full_name || user!.email || "Usuário");

      if (isManager) {
        // Inclui a própria gestora para que ela também possa preencher sua planilha.
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name");
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role");
        const managerIds = new Set((roles || []).filter((r: any) => r.role === "gestora").map((r: any) => r.user_id));
        const collaborators = (profiles || [])
          .filter((p: any) => !managerIds.has(p.id) && p.id !== user!.id)
          .map((p: any) => ({ id: p.id, full_name: p.full_name || "Sem nome" }))
          .sort((a, b) => a.full_name.localeCompare(b.full_name));
        const list = [{ id: user!.id, full_name: myName || "Minha planilha" }, ...collaborators];
        setUsers(list);
        if (!activeUser && list.length) setActiveUser(user!.id);
      } else {
        setActiveUser(user!.id);
      }
    };
    loadUsers();
  }, [user, isManager, myName, activeUser]);

  if (!user) return null;

  return (
    <div className="space-y-4">
      <Card className="p-3 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <p className="text-xs text-amber-900 dark:text-amber-200">
          Conteúdo protegido. Capturas de tela e impressões são bloqueadas/obscurecidas.
        </p>
      </Card>

      <div className={obscured ? "blur-2xl pointer-events-none transition-all" : "transition-all"}>
        {isManager ? (
          users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum colaborador disponível.</p>
          ) : (
            <Tabs value={activeUser} onValueChange={setActiveUser}>
              <div className="overflow-x-auto">
                <TabsList className="flex-wrap h-auto">
                  {users.map((u) => (
                    <TabsTrigger key={u.id} value={u.id}>
                      {u.full_name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {users.map((u) => (
                <TabsContent key={u.id} value={u.id} className="mt-4">
                  <UserSheetView targetUserId={u.id} targetUserName={u.full_name} />
                </TabsContent>
              ))}
            </Tabs>
          )
        ) : (
          <UserSheetView targetUserId={user.id} targetUserName={myName} />
        )}
      </div>

      {obscured && (
        <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center pointer-events-none">
          <p className="text-white/70 text-sm">Conteúdo oculto</p>
        </div>
      )}
    </div>
  );
}
