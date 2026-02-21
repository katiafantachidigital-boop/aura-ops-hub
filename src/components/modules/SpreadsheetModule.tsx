import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Save, Trash2, ArrowLeft, Edit2, PlusCircle, MinusCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Spreadsheet {
  id: string;
  title: string;
  data: string[][];
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

const ensureValidData = (data: unknown): string[][] => {
  if (!Array.isArray(data) || data.length === 0) {
    return Array.from({ length: 10 }, () => Array.from({ length: 6 }, () => ""));
  }
  return data.map((row: unknown) => {
    if (!Array.isArray(row)) return [""];
    return row.map((cell: unknown) => (typeof cell === "string" ? cell : String(cell ?? "")));
  });
};

export function SpreadsheetModule() {
  const { user, profile, isManager } = useAuth();
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<Spreadsheet | null>(null);
  const [editingData, setEditingData] = useState<string[][]>([]);
  const [editingTitle, setEditingTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthorName, setNewAuthorName] = useState("");
  const [editingTitleMode, setEditingTitleMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const canEdit = (sheet: Spreadsheet) => {
    if (!user) return false;
    return sheet.created_by === user.id || isManager;
  };

  const fetchSpreadsheets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("spreadsheets")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
        toast({ title: "Erro ao carregar planilhas", description: error.message, variant: "destructive" });
      } else {
        setSpreadsheets((data || []).map((s: any) => ({
          ...s,
          data: ensureValidData(s.data),
        })));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({ title: "Erro inesperado", variant: "destructive" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSpreadsheets();
  }, [fetchSpreadsheets]);

  const createSpreadsheet = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Faça login para criar planilhas.", variant: "destructive" });
      return;
    }
    const title = newTitle.trim() || "Nova Planilha";
    const authorName = newAuthorName.trim() || "Usuário";
    const initialData = Array.from({ length: 10 }, () => Array.from({ length: 6 }, () => ""));

    try {
      const { data, error } = await supabase
        .from("spreadsheets")
        .insert({
          title,
          data: initialData as any,
          created_by: user.id,
          created_by_name: authorName,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error("Create error:", error);
        toast({ title: "Erro ao criar planilha", description: error.message, variant: "destructive" });
      } else if (data) {
        toast({ title: "Planilha criada com sucesso!" });
        setNewTitle("");
        setNewAuthorName("");
        setCreateDialogOpen(false);
        await fetchSpreadsheets();
        openSheet({ ...data, data: initialData });
      }
    } catch (err) {
      console.error("Unexpected create error:", err);
      toast({ title: "Erro inesperado ao criar", variant: "destructive" });
    }
  };

  const openSheet = (sheet: Spreadsheet) => {
    const validData = ensureValidData(sheet.data);
    setSelectedSheet({ ...sheet, data: validData });
    setEditingData(validData.map(row => [...row]));
    setEditingTitle(sheet.title);
    setHasUnsavedChanges(false);
  };

  const saveSheet = async () => {
    if (!selectedSheet) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("spreadsheets")
        .update({
          title: editingTitle,
          data: editingData as any,
        })
        .eq("id", selectedSheet.id);

      if (error) {
        console.error("Save error:", error);
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Planilha salva com sucesso!" });
        setSelectedSheet({ ...selectedSheet, title: editingTitle, data: editingData });
        setHasUnsavedChanges(false);
        fetchSpreadsheets();
      }
    } catch (err) {
      console.error("Unexpected save error:", err);
      toast({ title: "Erro inesperado ao salvar", variant: "destructive" });
    }
    setSaving(false);
  };

  const deleteSheet = async (id: string) => {
    try {
      const { error } = await supabase.from("spreadsheets").delete().eq("id", id);
      if (error) {
        toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Planilha excluída!" });
        if (selectedSheet?.id === id) setSelectedSheet(null);
        fetchSpreadsheets();
      }
    } catch (err) {
      toast({ title: "Erro inesperado ao excluir", variant: "destructive" });
    }
  };

  const updateCell = (row: number, col: number, value: string) => {
    setEditingData(prev => {
      const newData = prev.map(r => [...r]);
      if (newData[row] && col < newData[row].length) {
        newData[row][col] = value;
      }
      return newData;
    });
    setHasUnsavedChanges(true);
  };

  const addRow = () => {
    const cols = editingData[0]?.length || 6;
    setEditingData(prev => [...prev, Array(cols).fill("")]);
    setHasUnsavedChanges(true);
  };

  const removeRow = () => {
    if (editingData.length <= 1) return;
    setEditingData(prev => prev.slice(0, -1));
    setHasUnsavedChanges(true);
  };

  const addColumn = () => {
    setEditingData(prev => prev.map(row => [...row, ""]));
    setHasUnsavedChanges(true);
  };

  const removeColumn = () => {
    if ((editingData[0]?.length || 0) <= 1) return;
    setEditingData(prev => prev.map(row => row.slice(0, -1)));
    setHasUnsavedChanges(true);
  };

  const getColumnLabel = (index: number): string => {
    let label = "";
    let i = index;
    while (i >= 0) {
      label = String.fromCharCode(65 + (i % 26)) + label;
      i = Math.floor(i / 26) - 1;
    }
    return label;
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (!confirm("Você tem alterações não salvas. Deseja sair sem salvar?")) return;
    }
    setSelectedSheet(null);
    setHasUnsavedChanges(false);
  };

  // Spreadsheet editor view
  if (selectedSheet) {
    const editable = canEdit(selectedSheet);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>

          {editingTitleMode && editable ? (
            <Input
              value={editingTitle}
              onChange={(e) => { setEditingTitle(e.target.value); setHasUnsavedChanges(true); }}
              onBlur={() => setEditingTitleMode(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitleMode(false)}
              className="max-w-xs h-9"
              autoFocus
            />
          ) : (
            <h2
              className={cn("text-lg font-semibold text-foreground", editable && "cursor-pointer hover:text-primary")}
              onClick={() => editable && setEditingTitleMode(true)}
            >
              {editingTitle}
              {editable && <Edit2 className="inline h-4 w-4 ml-2 text-muted-foreground" />}
            </h2>
          )}

          <span className="text-xs text-muted-foreground">
            por {selectedSheet.created_by_name}
          </span>

          {editable && (
            <div className="ml-auto flex gap-2 items-center">
              {hasUnsavedChanges && (
                <span className="text-xs text-destructive font-medium">● Não salvo</span>
              )}
              <Button size="sm" onClick={saveSheet} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}
        </div>

        {editable && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={addRow}>
              <PlusCircle className="h-4 w-4 mr-1" /> Linha
            </Button>
            <Button variant="outline" size="sm" onClick={removeRow} disabled={editingData.length <= 1}>
              <MinusCircle className="h-4 w-4 mr-1" /> Linha
            </Button>
            <Button variant="outline" size="sm" onClick={addColumn}>
              <PlusCircle className="h-4 w-4 mr-1" /> Coluna
            </Button>
            <Button variant="outline" size="sm" onClick={removeColumn} disabled={(editingData[0]?.length || 0) <= 1}>
              <MinusCircle className="h-4 w-4 mr-1" /> Coluna
            </Button>
          </div>
        )}

        <div ref={tableRef} className="overflow-auto border border-border rounded-lg max-h-[70vh]">
          <table className="border-collapse min-w-full">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1.5 border border-border w-10 text-center sticky left-0 z-20">
                  #
                </th>
                {editingData[0]?.map((_, colIdx) => (
                  <th
                    key={colIdx}
                    className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1.5 border border-border min-w-[120px] text-center"
                  >
                    {getColumnLabel(colIdx)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editingData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1 border border-border text-center sticky left-0 z-10">
                    {rowIdx + 1}
                  </td>
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="p-0 border border-border">
                      {editable ? (
                        <input
                          className="w-full h-full px-2 py-1.5 text-sm bg-background text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 focus:ring-inset min-w-[120px]"
                          value={cell}
                          onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                        />
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-foreground min-w-[120px] min-h-[32px]">
                          {cell}
                        </div>
                      )}
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

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Planilhas</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova Planilha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Planilha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Título</label>
                <Input
                  placeholder="Título da planilha"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Seu nome</label>
                <Input
                  placeholder="Digite seu nome"
                  value={newAuthorName}
                  onChange={(e) => setNewAuthorName(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={createSpreadsheet} disabled={!newAuthorName.trim()}>
                Criar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : spreadsheets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma planilha criada ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Planilha" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spreadsheets.map((sheet) => (
            <Card
              key={sheet.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => openSheet(sheet)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base truncate flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                  {sheet.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  por {sheet.created_by_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(sheet.updated_at).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(sheet.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {canEdit(sheet) && (
                  <div className="flex gap-2 mt-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir planilha?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteSheet(sheet.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
