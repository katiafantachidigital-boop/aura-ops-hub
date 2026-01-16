import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Megaphone, Trash2, FileAudio, File, Download, Loader2, Eye, X, Globe, Lock, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Announcement {
  id: string;
  title: string;
  content: string;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
  created_by: string;
  created_by_name: string;
  visibility: string;
  target_profiles: string[] | null;
}

interface Profile {
  id: string;
  full_name: string | null;
}

export function AnnouncementsModule() {
  const { user, profile, isManager } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set());
  const [viewingFile, setViewingFile] = useState<{url: string, type: string | null} | null>(null);
  
  // Visibility states
  const [visibility, setVisibility] = useState<"public" | "exclusive">("public");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  useEffect(() => {
    fetchAnnouncements();
    fetchReadAnnouncements();
    if (isManager) {
      fetchAllProfiles();
    }
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isManager]);

  // Mark announcements as read when viewing
  useEffect(() => {
    if (user && announcements.length > 0) {
      markAnnouncementsAsRead();
    }
  }, [user, announcements]);

  const fetchAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setAllProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadAnnouncements = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setReadAnnouncements(new Set(data?.map(r => r.announcement_id) || []));
    } catch (error) {
      console.error('Error fetching read announcements:', error);
    }
  };

  const markAnnouncementsAsRead = async () => {
    if (!user) return;

    const unreadIds = announcements
      .filter(a => !readAnnouncements.has(a.id))
      .map(a => a.id);

    if (unreadIds.length === 0) return;

    try {
      const inserts = unreadIds.map(announcement_id => ({
        announcement_id,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('announcement_reads')
        .upsert(inserts, { onConflict: 'announcement_id,user_id' });

      if (error) throw error;
      
      // Update local state
      setReadAnnouncements(prev => {
        const newSet = new Set(prev);
        unreadIds.forEach(id => newSet.add(id));
        return newSet;
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Preencha o título e o conteúdo');
      return;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (visibility === "exclusive" && selectedProfiles.length === 0) {
      toast.error('Selecione pelo menos um perfil para comunicado exclusivo');
      return;
    }

    setCreating(true);

    try {
      let fileUrl: string | null = null;
      let fileType: string | null = null;

      // Upload file if exists
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('announcements')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('announcements')
          .getPublicUrl(fileName);

        fileUrl = urlData.publicUrl;
        fileType = file.type;
      }

      const { error } = await supabase
        .from('announcements')
        .insert({
          title: title.trim(),
          content: content.trim(),
          file_url: fileUrl,
          file_type: fileType,
          created_by: user.id,
          created_by_name: profile?.full_name || 'Gestora',
          visibility: visibility,
          target_profiles: visibility === "exclusive" ? selectedProfiles : null
        });

      if (error) throw error;

      toast.success('Comunicado publicado!');
      setShowCreateDialog(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Erro ao publicar comunicado');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setFile(null);
    setVisibility('public');
    setSelectedProfiles([]);
  };

  const handleDeleteAnnouncement = async (id: string, fileUrl: string | null) => {
    if (!confirm('Tem certeza que deseja excluir este comunicado?')) return;

    try {
      // Delete file from storage if exists
      if (fileUrl) {
        const fileName = fileUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('announcements')
            .remove([fileName]);
        }
      }

      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Comunicado excluído');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Erro ao excluir comunicado');
    }
  };

  const toggleProfile = (profileId: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-4 w-4" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getVisibilityBadge = (announcement: Announcement) => {
    if (announcement.visibility === 'public') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
          <Globe className="h-3 w-3" /> Público
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
        <Lock className="h-3 w-3" /> Exclusivo
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      {isManager && (
        <div className="flex justify-end">
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Comunicado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Comunicado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Título do comunicado"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    placeholder="Escreva o comunicado aqui..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Anexar arquivo (opcional)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="audio/*,image/*,.pdf,.doc,.docx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      Arquivo selecionado: {file.name}
                    </p>
                  )}
                </div>

                {/* Visibility selection */}
                <div className="space-y-3 pt-2 border-t">
                  <Label>Visibilidade</Label>
                  <RadioGroup
                    value={visibility}
                    onValueChange={(value: "public" | "exclusive") => setVisibility(value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="flex items-center gap-1 cursor-pointer">
                        <Globe className="h-4 w-4 text-green-600" />
                        Público
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="exclusive" id="exclusive" />
                      <Label htmlFor="exclusive" className="flex items-center gap-1 cursor-pointer">
                        <Lock className="h-4 w-4 text-orange-600" />
                        Exclusivo
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Profile selection for exclusive */}
                {visibility === "exclusive" && (
                  <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Selecione quem pode ver
                    </Label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {allProfiles.map((p) => (
                        <div key={p.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={p.id}
                            checked={selectedProfiles.includes(p.id)}
                            onCheckedChange={() => toggleProfile(p.id)}
                          />
                          <Label htmlFor={p.id} className="text-sm cursor-pointer">
                            {p.full_name || 'Usuário sem nome'}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedProfiles.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedProfiles.length} perfil(is) selecionado(s)
                      </p>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleCreateAnnouncement} 
                  className="w-full"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    'Publicar Comunicado'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhum comunicado disponível</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      {isManager && getVisibilityBadge(announcement)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Por {announcement.created_by_name} • {format(new Date(announcement.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {isManager && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAnnouncement(announcement.id, announcement.file_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                
                {announcement.file_url && (
                  <div className="mt-4 pt-4 border-t">
                    {announcement.file_type?.startsWith('audio/') ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <FileAudio className="h-4 w-4" />
                          Áudio anexado
                        </p>
                        <audio controls className="w-full">
                          <source src={announcement.file_url} type={announcement.file_type} />
                          Seu navegador não suporta áudio.
                        </audio>
                        <a
                          href={announcement.file_url}
                          download
                          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <Download className="h-4 w-4" />
                          Baixar áudio
                        </a>
                      </div>
                    ) : announcement.file_type?.startsWith('image/') ? (
                      <div className="space-y-2">
                        <img 
                          src={announcement.file_url} 
                          alt="Anexo" 
                          className="max-w-full h-auto rounded-lg max-h-48 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setViewingFile({url: announcement.file_url!, type: announcement.file_type})}
                        />
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingFile({url: announcement.file_url!, type: announcement.file_type})}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Ver em tela cheia
                          </Button>
                          <a
                            href={announcement.file_url}
                            download
                            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                          >
                            <Download className="h-4 w-4" />
                            Baixar imagem
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 items-center">
                        {getFileIcon(announcement.file_type)}
                        <span className="text-sm text-muted-foreground">Arquivo anexado</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingFile({url: announcement.file_url!, type: announcement.file_type})}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Visualizar
                        </Button>
                        <a
                          href={announcement.file_url}
                          download
                          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <Download className="h-4 w-4" />
                          Baixar
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fullscreen file viewer modal */}
      {viewingFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewingFile(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setViewingFile(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <a
            href={viewingFile.url}
            download
            className="absolute top-4 right-16 text-white hover:bg-white/20 p-2 rounded-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-6 w-6" />
          </a>
          <div 
            className="max-w-full max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {viewingFile.type?.startsWith('image/') ? (
              <img 
                src={viewingFile.url} 
                alt="Visualização" 
                className="max-w-full max-h-[90vh] object-contain"
              />
            ) : viewingFile.type === 'application/pdf' ? (
              <iframe 
                src={viewingFile.url} 
                className="w-[90vw] h-[90vh] bg-white"
                title="Visualização PDF"
              />
            ) : (
              <div className="bg-white p-8 rounded-lg text-center">
                <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground mb-4">Este arquivo não pode ser visualizado diretamente.</p>
                <a
                  href={viewingFile.url}
                  download
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md"
                >
                  <Download className="h-4 w-4" />
                  Baixar arquivo
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnouncementsModule;
