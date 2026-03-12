import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadOccurrences } from '@/hooks/useUnreadOccurrences';
import { toast } from 'sonner';
import { Plus, Trash2, User, Calendar, Lock, Globe, Users, Mail, Send, PenLine, Reply, CornerDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface OccurrenceReply {
  id: string;
  occurrence_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface Occurrence {
  id: string;
  user_id: string;
  user_name: string;
  title: string | null;
  content: string;
  signature: string | null;
  created_at: string;
  visibility: string;
  target_profiles: string[] | null;
}

interface Profile {
  id: string;
  full_name: string | null;
}

export const OccurrencesModule = () => {
  const { user, profile, isManager, canSubmitChecklist } = useAuth();
  const { markAllAsRead } = useUnreadOccurrences();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [replies, setReplies] = useState<Record<string, OccurrenceReply[]>>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [signature, setSignature] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'exclusive'>('public');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const isSupervisor = canSubmitChecklist && !isManager;

  const getDisplayName = () => {
    if (profile?.full_name?.trim()) return profile.full_name.trim();

    const metadataName = user?.user_metadata?.full_name;
    if (typeof metadataName === 'string' && metadataName.trim()) {
      return metadataName.trim();
    }

    if (user?.email) {
      return user.email.split('@')[0];
    }

    return 'Gestora';
  };

  const loadOccurrences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const occurrenceData = (data || []) as Occurrence[];
      setOccurrences(occurrenceData);

      if (occurrenceData.length > 0) {
        markAllAsRead(occurrenceData.map(o => o.id));
      }

      // Load replies for all occurrences
      const occurrenceIds = occurrenceData.map(o => o.id);
      if (occurrenceIds.length > 0) {
        const { data: repliesData, error: repliesError } = await supabase
          .from('occurrence_replies')
          .select('*')
          .in('occurrence_id', occurrenceIds)
          .order('created_at', { ascending: true });

        if (!repliesError && repliesData) {
          const grouped: Record<string, OccurrenceReply[]> = {};
          (repliesData as OccurrenceReply[]).forEach(r => {
            if (!grouped[r.occurrence_id]) grouped[r.occurrence_id] = [];
            grouped[r.occurrence_id].push(r);
          });
          setReplies(grouped);
        }
      }
    } catch (error) {
      console.error('Error loading occurrences:', error);
      toast.error('Erro ao carregar ocorrências');
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    if (!isManager) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('profile_completed', true)
        .neq('id', user?.id || '');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  useEffect(() => {
    loadOccurrences();
    loadProfiles();
  }, [user]);

  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      setSignature(profile?.full_name || '');
    } else {
      setTitle('');
      setContent('');
      setSignature('');
      setVisibility('public');
      setSelectedProfiles([]);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    if (!title.trim()) {
      toast.error('Informe o título');
      return;
    }
    if (!content.trim()) {
      toast.error('Escreva o conteúdo da mensagem');
      return;
    }

    if (isManager && visibility === 'exclusive' && selectedProfiles.length === 0) {
      toast.error('Selecione ao menos um destinatário');
      return;
    }

    setSubmitting(true);
    try {
      const finalVisibility = isManager ? visibility : 'public';
      const finalTargetProfiles = isManager && visibility === 'exclusive' ? selectedProfiles : null;

      const { error } = await supabase.from('occurrences').insert({
        user_id: user.id,
        user_name: profile.full_name || 'Usuário',
        title: title.trim(),
        content: content.trim(),
        signature: signature.trim() || null,
        visibility: finalVisibility,
        target_profiles: finalTargetProfiles,
      });

      if (error) throw error;

      toast.success('Mensagem enviada com sucesso!');
      handleDialogOpen(false);
      loadOccurrences();
    } catch (error) {
      console.error('Error creating occurrence:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('occurrences').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Ocorrência excluída');
      loadOccurrences();
    } catch (error) {
      console.error('Error deleting occurrence:', error);
      toast.error('Erro ao excluir ocorrência');
    }
    setDeleteId(null);
  };

  const handleReply = async (occurrenceId: string) => {
    if (!user) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!isManager) {
      toast.error('Apenas gestoras podem responder ocorrências.');
      return;
    }

    const contentToSend = replyContent.trim();
    if (!contentToSend) {
      toast.error('Escreva uma resposta antes de enviar.');
      return;
    }

    setSubmittingReply(true);
    try {
      const { error } = await supabase.from('occurrence_replies').insert({
        occurrence_id: occurrenceId,
        user_id: user.id,
        user_name: getDisplayName(),
        content: contentToSend,
      });

      if (error) throw error;

      toast.success('Resposta enviada!');
      setReplyContent('');
      setReplyingTo(null);
      loadOccurrences();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setSubmittingReply(false);
    }
  };

  const toggleProfileSelection = (profileId: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ocorrências</h2>
          <p className="text-muted-foreground">
            {isManager 
              ? 'Visualize todas as mensagens e ocorrências da equipe' 
              : 'Envie e visualize suas mensagens'}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              {isSupervisor ? (
                <>
                  <Plus className="h-4 w-4" />
                  Registrar Nova Ocorrência
                </>
              ) : (
                <>
                  <PenLine className="h-4 w-4" />
                  Escrever
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {isSupervisor ? 'Nova Ocorrência' : 'Nova Mensagem'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {isManager && (
                <div className="space-y-3 border-b pb-4">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4" />
                    Para:
                  </Label>
                  
                  <RadioGroup 
                    value={visibility} 
                    onValueChange={(value: 'public' | 'exclusive') => setVisibility(value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        Todos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="exclusive" id="exclusive" />
                      <Label htmlFor="exclusive" className="flex items-center gap-2 cursor-pointer text-sm">
                        <Lock className="h-4 w-4 text-orange-500" />
                        Selecionar destinatários
                      </Label>
                    </div>
                  </RadioGroup>

                  {visibility === 'exclusive' && (
                    <div className="space-y-2">
                      <ScrollArea className="h-36 border rounded-md p-3">
                        <div className="space-y-2">
                          {profiles.map((p) => (
                            <div key={p.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`profile-${p.id}`}
                                checked={selectedProfiles.includes(p.id)}
                                onCheckedChange={() => toggleProfileSelection(p.id)}
                              />
                              <Label 
                                htmlFor={`profile-${p.id}`} 
                                className="cursor-pointer text-sm"
                              >
                                {p.full_name || 'Sem nome'}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {selectedProfiles.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {selectedProfiles.length} destinatário(s) selecionado(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isManager && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-3">
                  <Lock className="h-4 w-4" />
                  <span>Esta mensagem será enviada para a gerência</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="occurrence-title" className="text-sm font-medium">Título</Label>
                <Input
                  id="occurrence-title"
                  placeholder="Assunto da mensagem..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="occurrence-content" className="text-sm font-medium">Mensagem</Label>
                <Textarea
                  id="occurrence-content"
                  placeholder="Escreva sua mensagem..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-1.5 border-t pt-3">
                <Label htmlFor="occurrence-signature" className="text-sm text-muted-foreground">
                  Att:
                </Label>
                <Input
                  id="occurrence-signature"
                  placeholder="Seu nome"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !title.trim() || !content.trim()}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {occurrences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma mensagem registrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {occurrences.map((occurrence) => {
            const occurrenceReplies = replies[occurrence.id] || [];
            const isReplyOpen = replyingTo === occurrence.id;
            const canReply = isManager && occurrence.user_id !== user?.id;

            return (
              <Card key={occurrence.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4 text-primary shrink-0" />
                        {occurrence.user_name}
                        {occurrence.user_id === user?.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Você
                          </span>
                        )}
                        {occurrence.visibility === 'exclusive' && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Lock className="h-3 w-3" />
                            Exclusiva
                          </Badge>
                        )}
                      </CardTitle>
                      {occurrence.title && (
                        <p className="text-sm font-medium text-foreground">
                          {occurrence.title}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(occurrence.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    {(occurrence.user_id === user?.id || isManager) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => setDeleteId(occurrence.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {occurrence.content}
                  </p>
                  {occurrence.signature && (
                    <p className="text-sm text-muted-foreground italic pt-2 border-t">
                      Att: {occurrence.signature}
                    </p>
                  )}

                  {/* Replies thread - email style */}
                  {occurrenceReplies.length > 0 && (
                    <div className="mt-3 space-y-0">
                      {occurrenceReplies.map((reply) => (
                        <div
                          key={reply.id}
                          className="border-l-2 border-primary/30 ml-2 pl-4 py-3 relative"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <CornerDownRight className="h-3.5 w-3.5 text-primary/60" />
                            <span className="text-xs font-semibold text-primary">
                              {reply.user_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              — {format(new Date(reply.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap pl-5">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply button for managers on user messages */}
                  {canReply && !isReplyOpen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-muted-foreground hover:text-primary mt-1"
                      onClick={() => {
                        setReplyingTo(occurrence.id);
                        setReplyContent('');
                      }}
                    >
                      <Reply className="h-3.5 w-3.5" />
                      Responder
                    </Button>
                  )}

                  {/* Inline reply form */}
                  {isReplyOpen && (
                    <div className="border-l-2 border-primary/30 ml-2 pl-4 pt-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                        <CornerDownRight className="h-3.5 w-3.5" />
                        Responder a {occurrence.user_name}
                      </div>
                      <Textarea
                        placeholder="Escreva sua resposta..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={3}
                        className="text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={submittingReply || !replyContent.trim()}
                          onClick={() => handleReply(occurrence.id)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {submittingReply ? 'Enviando...' : 'Enviar'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ocorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
