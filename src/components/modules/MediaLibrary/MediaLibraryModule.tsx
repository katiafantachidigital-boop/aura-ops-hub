import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder, FolderPlus, Upload, Search, ChevronRight, Home, MoreVertical,
  Pencil, Trash2, FileText, Image as ImageIcon, Video, Download, Copy, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaFolder {
  id: string;
  name: string;
  parent_id: string | null;
}

interface MediaFile {
  id: string;
  folder_id: string | null;
  name: string;
  storage_path: string;
  public_url: string;
  mime_type: string | null;
  file_type: "image" | "video" | "document";
  size_bytes: number | null;
  created_at: string;
}

const BUCKET = "training-content";
const PREFIX = "media-library";

function detectType(mime: string): "image" | "video" | "document" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function MediaLibraryModule() {
  const { user, isManager } = useAuth();
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ kind: "file" | "folder"; id: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "file" | "folder"; id: string; name: string; storage_path?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: f }, { data: m }] = await Promise.all([
      supabase.from("media_folders").select("*").order("name"),
      supabase.from("media_files").select("*").order("created_at", { ascending: false }),
    ]);
    setFolders((f as MediaFolder[]) || []);
    setFiles((m as MediaFile[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!isManager) {
    return <p className="text-muted-foreground">Acesso restrito.</p>;
  }

  const subfolders = folders.filter((f) => f.parent_id === currentFolder);
  const filesHere = files.filter((f) =>
    search ? f.name.toLowerCase().includes(search.toLowerCase()) : f.folder_id === currentFolder
  );

  const breadcrumb = (() => {
    const trail: MediaFolder[] = [];
    let cur = currentFolder;
    while (cur) {
      const found = folders.find((f) => f.id === cur);
      if (!found) break;
      trail.unshift(found);
      cur = found.parent_id;
    }
    return trail;
  })();

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !user) return;
    const { error } = await supabase.from("media_folders").insert({
      name: newFolderName.trim(),
      parent_id: currentFolder,
      created_by: user.id,
    });
    if (error) { toast.error("Erro ao criar pasta"); return; }
    toast.success("Pasta criada");
    setNewFolderName("");
    setShowFolderDialog(false);
    load();
  };

  const uploadFiles = async (selected: File[]) => {
    if (!user || selected.length === 0) return;
    setUploading({ done: 0, total: selected.length });
    let success = 0;
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      try {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${PREFIX}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600", upsert: false,
        });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error: insErr } = await supabase.from("media_files").insert({
          folder_id: currentFolder,
          name: file.name,
          storage_path: path,
          public_url: publicUrl,
          mime_type: file.type,
          file_type: detectType(file.type),
          size_bytes: file.size,
          created_by: user.id,
        });
        if (insErr) throw insErr;
        success++;
      } catch (e) {
        console.error("Upload failed:", file.name, e);
      }
      setUploading({ done: i + 1, total: selected.length });
    }
    setUploading(null);
    toast.success(`${success} de ${selected.length} arquivo(s) enviado(s)`);
    load();
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length) uploadFiles(list);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const list = Array.from(e.dataTransfer.files || []);
    if (list.length) uploadFiles(list);
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    const table = renameTarget.kind === "folder" ? "media_folders" : "media_files";
    const { error } = await supabase.from(table).update({ name: renameName.trim() }).eq("id", renameTarget.id);
    if (error) { toast.error("Erro ao renomear"); return; }
    toast.success("Renomeado");
    setRenameTarget(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "file") {
      if (deleteTarget.storage_path) {
        await supabase.storage.from(BUCKET).remove([deleteTarget.storage_path]);
      }
      await supabase.from("media_files").delete().eq("id", deleteTarget.id);
    } else {
      const descendantFolders = collectDescendantFolderIds(deleteTarget.id, folders);
      const allFolderIds = [deleteTarget.id, ...descendantFolders];
      const affectedFiles = files.filter((f) => f.folder_id && allFolderIds.includes(f.folder_id));
      const paths = affectedFiles.map((f) => f.storage_path).filter(Boolean);
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      await supabase.from("media_folders").delete().eq("id", deleteTarget.id);
    }
    toast.success("Excluído");
    setDeleteTarget(null);
    load();
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const iconFor = (t: MediaFile["file_type"]) => (t === "image" ? ImageIcon : t === "video" ? Video : FileText);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <button onClick={() => setCurrentFolder(null)} className="flex items-center gap-1 hover:text-primary">
            <Home className="h-4 w-4" /> Início
          </button>
          {breadcrumb.map((f) => (
            <div key={f.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <button onClick={() => setCurrentFolder(f.id)} className="hover:text-primary">{f.name}</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFolderDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-2" /> Nova pasta
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={!!uploading}>
            {uploading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{uploading.done}/{uploading.total}</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />Enviar arquivos</>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            className="hidden"
            onChange={onPickFiles}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar arquivo em toda a biblioteca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Drop zone + grid */}
      <Card
        className={cn(
          "p-4 min-h-[60vh] transition-colors",
          isDragging && "border-primary bg-primary/5"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : (
          <ScrollArea className="h-[60vh]">
            {/* Folders */}
            {!search && subfolders.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                {subfolders.map((f) => (
                  <div
                    key={f.id}
                    className="relative group rounded-lg border hover:border-primary hover:bg-accent transition-colors"
                  >
                    <button
                      onClick={() => setCurrentFolder(f.id)}
                      className="flex flex-col items-center gap-2 p-4 w-full"
                    >
                      <Folder className="h-12 w-12 text-primary" />
                      <span className="text-sm truncate w-full text-center">{f.name}</span>
                    </button>
                    <FolderActions
                      onRename={() => { setRenameTarget({ kind: "folder", id: f.id, name: f.name }); setRenameName(f.name); }}
                      onDelete={() => setDeleteTarget({ kind: "folder", id: f.id, name: f.name })}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Files */}
            {filesHere.length === 0 && subfolders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Arraste arquivos aqui ou clique em "Enviar arquivos"</p>
                <p className="text-xs mt-1">Imagens, vídeos e documentos. Você pode enviar vários de uma vez.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filesHere.map((f) => {
                  const Icon = iconFor(f.file_type);
                  return (
                    <div key={f.id} className="relative group rounded-lg border overflow-hidden bg-card">
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        {f.file_type === "image" ? (
                          <img src={f.public_url} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Icon className="h-14 w-14 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-2 space-y-1">
                        <p className="text-xs truncate" title={f.name}>{f.name}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-[10px]">{f.file_type}</Badge>
                          <span className="text-[10px] text-muted-foreground">{formatSize(f.size_bytes)}</span>
                        </div>
                      </div>
                      <FileActions
                        onCopy={() => copyLink(f.public_url)}
                        onDownload={() => window.open(f.public_url, "_blank")}
                        onRename={() => { setRenameTarget({ kind: "file", id: f.id, name: f.name }); setRenameName(f.name); }}
                        onDelete={() => setDeleteTarget({ kind: "file", id: f.id, name: f.name, storage_path: f.storage_path })}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}
      </Card>

      {/* New folder dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova pasta</DialogTitle>
            <DialogDescription>
              {currentFolder ? `Será criada dentro de "${breadcrumb[breadcrumb.length - 1]?.name}".` : "Será criada na raiz."}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Nome da pasta"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateFolder}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancelar</Button>
            <Button onClick={handleRename}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleteTarget?.kind === "folder" ? "pasta" : "arquivo"}?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" será removido permanentemente.
              {deleteTarget?.kind === "folder" && " Todas as subpastas e arquivos dentro também serão excluídos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function collectDescendantFolderIds(rootId: string, all: MediaFolder[]): string[] {
  const out: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    const children = all.filter((f) => f.parent_id === cur);
    for (const c of children) { out.push(c.id); stack.push(c.id); }
  }
  return out;
}

function FolderActions({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  return (
    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRename}><Pencil className="h-4 w-4 mr-2" />Renomear</DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FileActions({ onCopy, onDownload, onRename, onDelete }: { onCopy: () => void; onDownload: () => void; onRename: () => void; onDelete: () => void }) {
  return (
    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onCopy}><Copy className="h-4 w-4 mr-2" />Copiar link</DropdownMenuItem>
          <DropdownMenuItem onClick={onDownload}><Download className="h-4 w-4 mr-2" />Baixar / Abrir</DropdownMenuItem>
          <DropdownMenuItem onClick={onRename}><Pencil className="h-4 w-4 mr-2" />Renomear</DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
