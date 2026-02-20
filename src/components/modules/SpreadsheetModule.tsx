import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Save, Trash2, ArrowLeft, Edit2, PlusCircle, MinusCircle } from "lucide-react";
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
  const [editingTitleMode, setEditingTitleMode] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const canEdit = (sheet: Spreadsheet) => {
    if (!user) return false;
    return sheet.created_by === user.id || isManager;
  };

  const fetchSpreadsheets = useCallback(async () => {
    const { data, error } = await supabase
      .from("spreadsheets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar planilhas", description: error.message, variant: "destructive" });
    } else {
      setSpreadsheets((data || []).map((s: any) => ({
        ...s,
        data: Array.isArray(s.data) ? s.data : [[""]],
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSpreadsheets();
  }, [fetchSpreadsheets]);

  const createSpreadsheet = async () => {
    if (!user || !profile) return;
    const title = newTitle.trim() || "Nova Planilha";
    const initialData = Array.from({ length: 10 }, () => Array.from({ length: 6 }, () => ""));

    const { data, error } = await supabase
      .from("spreadsheets")
      .insert({
        title,
        data: initialData as any,
        created_by: user.id,
        created_by_name: profile.full_name || "Usuário",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar planilha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Planilha criada!" });
      setNewTitle("");
      setCreateDialogOpen(false);
      fetchSpreadsheets();
      if (data) {
        openSheet({ ...data, data: initialData });
      }
    }
  };

  const openSheet = (sheet: Spreadsheet) => {
    setSelectedSheet(sheet);
    setEditingData(sheet.data.map(row => [...row]));
    setEditingTitle(sheet.title);
  };

  const saveSheet = async () => {
    if (!selectedSheet) return;
    setSaving(true);

    const { error } = await supabase
      .from("spreadsheets")
      .update({
        title: editingTitle,
        data: editingData as any,
      })
      .eq("id", selectedSheet.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Planilha salva!" });
      setSelectedSheet({ ...selectedSheet, title: editingTitle, data: editingData });
      fetchSpreadsheets();
    }
  };

  const deleteSheet = async (id: string) => {
    const { error } = await supabase.from("spreadsheets").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Planilha excluída!" });
      if (selectedSheet?.id === id) setSelectedSheet(null);
      fetchSpreadsheets();
    }
  };

  const updateCell = (row: number, col: number, value: string) => {
    const newData = editingData.map(r => [...r]);
    newData[row][col] = value;
    setEditingData(newData);
  };

  const addRow = () => {
    const cols = editingData[0]?.length || 6;
    setEditingData([...editingData, Array(cols).fill("")]);
  };

  const removeRow = () => {
    if (editingData.length <= 1) return;
    setEditingData(editingData.slice(0, -1));
  };

  const addColumn = () => {
    setEditingData(editingData.map(row => [...row, ""]));
  };

  const removeColumn = () => {
    if ((editingData[0]?.length || 0) <= 1) return;
    setEditingData(editingData.map(row => row.slice(0, -1)));
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

  // Spreadsheet editor view
  if (selectedSheet) {
    const editable = canEdit(selectedSheet);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setSelectedSheet(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>

          {editingTitleMode && editable ? (
            <Input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
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
            <div className="ml-auto flex gap-2">
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
                    className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1.5 border border-border min-w-[100px] text-center"
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
                          className="w-full h-full px-2 py-1.5 text-sm bg-background text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 focus:ring-inset min-w-[100px]"
                          value={cell}
                          onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                        />
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-foreground min-w-[100px] min-h-[32px]">
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
              <Input
                placeholder="Título da planilha"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createSpreadsheet()}
              />
              <Button className="w-full" onClick={createSpreadsheet}>
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
            <p className="text-muted-foreground">Nenhuma planilha criada ainda.</p>
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
                <CardTitle className="text-base truncate">{sheet.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  por {sheet.created_by_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(sheet.updated_at).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(sheet.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <div className="flex gap-2 mt-3">
                  {canEdit(sheet) && (
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
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
