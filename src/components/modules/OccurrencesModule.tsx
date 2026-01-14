import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, AlertTriangle, Trash2, User, Calendar } from 'lucide-react';
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

interface Occurrence {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export const OccurrencesModule = () => {
  const { user, profile, isManager } = useAuth();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadOccurrences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOccurrences(data || []);
    } catch (error) {
      console.error('Error loading occurrences:', error);
      toast.error('Erro ao carregar ocorrências');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOccurrences();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !profile) return;
    if (!content.trim()) {
      toast.error('Descreva a ocorrência');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('occurrences').insert({
        user_id: user.id,
        user_name: profile.full_name || 'Usuário',
        content: content.trim(),
      });

      if (error) throw error;

      toast.success('Ocorrência registrada com sucesso!');
      setContent('');
      setIsDialogOpen(false);
      loadOccurrences();
    } catch (error) {
      console.error('Error creating occurrence:', error);
      toast.error('Erro ao registrar ocorrência');
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
              ? 'Visualize todas as ocorrências da equipe' 
              : 'Registre e visualize suas ocorrências'}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Ocorrência
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Ocorrência</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{profile?.full_name || 'Usuário'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Textarea
                  placeholder="Descreva a ocorrência..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !content.trim()}
                className="w-full"
              >
                {submitting ? 'Registrando...' : 'Registrar Ocorrência'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {occurrences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma ocorrência registrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {occurrences.map((occurrence) => (
            <Card key={occurrence.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      {occurrence.user_name}
                      {occurrence.user_id === user?.id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Você
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(occurrence.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  {(occurrence.user_id === user?.id || isManager) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(occurrence.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {occurrence.content}
                </p>
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
