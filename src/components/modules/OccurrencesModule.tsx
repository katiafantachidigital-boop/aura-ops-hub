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
import { Plus, Trash2, User, Calendar, Lock, Globe, Users, Mail, Send, PenLine } from 'lucide-react';
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

  const isSupervisor = canSubmitChecklist && !isManager;

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
      // Non-managers: visibility is always 'public' but RLS ensures only managers + author see it
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
              {/* Recipient / Visibility - Only for Manager */}
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

              {/* Non-manager info */}
              {!isManager && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-3">
                  <Lock className="h-4 w-4" />
                  <span>Esta mensagem será enviada para a gerência</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="occurrence-title" className="text-sm font-medium">Título</Label>
                <Input
                  id="occurrence-title"
                  placeholder="Assunto da mensagem..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Content */}
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

              {/* Signature */}
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
          {occurrences.map((occurrence) => (
            <Card key={occurrence.id} className="relative">
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
              <CardContent className="space-y-2">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {occurrence.content}
                </p>
                {occurrence.signature && (
                  <p className="text-sm text-muted-foreground italic pt-2 border-t">
                    Att: {occurrence.signature}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
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
