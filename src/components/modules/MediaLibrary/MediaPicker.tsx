import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Folder, ImageIcon, FileText, Video, Search, ChevronRight, Home, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaFile {
  id: string;
  folder_id: string | null;
  name: string;
  public_url: string;
  mime_type: string | null;
  file_type: "image" | "video" | "document";
  size_bytes: number | null;
}

interface MediaFolder {
  id: string;
  name: string;
  parent_id: string | null;
}

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: MediaFile) => void;
  /** Filter visible files. Omit to show all types. */
  accept?: Array<"image" | "video" | "document">;
  title?: string;
}

export function MediaPicker({ open, onOpenChange, onSelect, accept, title = "Escolher da Biblioteca" }: MediaPickerProps) {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      load();
    }
  }, [open]);

  const load = async () => {
    setLoading(true);
    const [{ data: f }, { data: m }] = await Promise.all([
      supabase.from("media_folders").select("*").order("name"),
      supabase.from("media_files").select("*").order("created_at", { ascending: false }),
    ]);
    setFolders((f as MediaFolder[]) || []);
    setFiles((m as MediaFile[]) || []);
    setLoading(false);
  };

  const subfolders = folders.filter((f) => f.parent_id === currentFolder);
  const filesHere = files.filter((f) => {
    if (search) return f.name.toLowerCase().includes(search.toLowerCase());
    return f.folder_id === currentFolder;
  });
  const visibleFiles = accept ? filesHere.filter((f) => accept.includes(f.file_type)) : filesHere;

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

  const handleConfirm = () => {
    const file = visibleFiles.find((f) => f.id === selectedId);
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }
    onSelect(file);
    onOpenChange(false);
  };

  const iconFor = (t: MediaFile["file_type"]) => {
    if (t === "image") return ImageIcon;
    if (t === "video") return Video;
    return FileText;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Escolha um arquivo já enviado para a Biblioteca.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setCurrentFolder(null)} className="flex items-center gap-1 hover:text-primary">
            <Home className="h-4 w-4" /> Início
          </button>
          {breadcrumb.map((f) => (
            <div key={f.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <button onClick={() => setCurrentFolder(f.id)} className="hover:text-primary">
                {f.name}
              </button>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar em toda a biblioteca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : (
            <>
              {!search && subfolders.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  {subfolders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setCurrentFolder(f.id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary hover:bg-accent transition-colors"
                    >
                      <Folder className="h-10 w-10 text-primary" />
                      <span className="text-sm truncate w-full text-center">{f.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {visibleFiles.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum arquivo aqui.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {visibleFiles.map((f) => {
                    const Icon = iconFor(f.file_type);
                    const selected = selectedId === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedId(f.id)}
                        onDoubleClick={() => {
                          setSelectedId(f.id);
                          onSelect(f);
                          onOpenChange(false);
                        }}
                        className={cn(
                          "relative flex flex-col rounded-lg border overflow-hidden text-left hover:border-primary transition-all",
                          selected && "ring-2 ring-primary border-primary"
                        )}
                      >
                        {selected && (
                          <div className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          {f.file_type === "image" ? (
                            <img src={f.public_url} alt={f.name} className="w-full h-full object-cover" />
                          ) : (
                            <Icon className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs truncate">{f.name}</p>
                          <Badge variant="secondary" className="text-[10px] mt-1">{f.file_type}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>Usar arquivo selecionado</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
