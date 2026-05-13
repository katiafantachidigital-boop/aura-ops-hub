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
  "Nº", "Nome do Lead", "Telefone", "Horário", "Ligou?", "Agendou?", "Observações",
];

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
      <SheetEditor
        initial={todaySheet?.data || emptyData()}
        onChange={handleChange}
        saving={saving}
      />
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
      <TabsContent value="today" className="mt-3">
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
              <SheetEditor initial={selectedArchive.data || emptyData()} readOnly />
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

  // Anti-screenshot: blur o conteúdo quando a aba perde foco / tecla PrintScreen
  const [obscured, setObscured] = useState(false);
  useEffect(() => {
    const onVis = () => setObscured(document.visibilityState !== "visible");
    const onBlur = () => setObscured(true);
    const onFocus = () => setObscured(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.shiftKey && (e.metaKey || e.ctrlKey))) {
        setObscured(true);
        setTimeout(() => setObscured(false), 1500);
        try { navigator.clipboard.writeText(""); } catch {}
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("keyup", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
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
        // Listar todos os colaboradores que NÃO são gestoras (exclui você e Rosiellen-dona)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name");
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role");
        const managerIds = new Set((roles || []).filter((r: any) => r.role === "gestora").map((r: any) => r.user_id));
        const list = (profiles || [])
          .filter((p: any) => !managerIds.has(p.id) && p.id !== user!.id)
          .map((p: any) => ({ id: p.id, full_name: p.full_name || "Sem nome" }))
          .sort((a, b) => a.full_name.localeCompare(b.full_name));
        setUsers(list);
        if (list.length) setActiveUser(list[0].id);
      } else {
        setActiveUser(user!.id);
      }
    };
    loadUsers();
  }, [user, isManager]);

  if (!user) return null;

  return (
    <div className="space-y-4 select-none" style={{ WebkitUserSelect: "none" }}>
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
