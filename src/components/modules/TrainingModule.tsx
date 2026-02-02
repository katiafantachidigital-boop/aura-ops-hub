import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GraduationCap,
  Plus,
  Play,
  FileText,
  Music,
  Video,
  CheckCircle2,
  Star,
  Upload,
  Trash2,
  BookOpen,
  Clock,
  Award,
  HelpCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { PDFViewer } from "./PDFViewer";
import { TrainingQuiz, QuizAnswersViewer } from "./TrainingQuiz";

interface Training {
  id: string;
  title: string;
  description: string | null;
  is_mandatory: boolean;
  duration_minutes: number | null;
  target_audience: string[];
  points_reward: number;
  cover_image_url: string | null;
  created_at: string;
}

interface TrainingModule {
  id: string;
  training_id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface TrainingContent {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  content_text: string | null;
  duration_minutes: number | null;
  order_index: number;
}

interface UserProgress {
  content_id: string;
  completed_at: string | null;
}

const FUNCTION_OPTIONS = [
  "Fisioterapia",
  "Estética",
  "Recepção",
  "Serviços Gerais",
];

const MANAGER_EMAIL = "gerenteipfp@gmail.com";

export function TrainingModule() {
  const { user, profile } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [modules, setModules] = useState<Record<string, TrainingModule[]>>({});
  const [contents, setContents] = useState<Record<string, TrainingContent[]>>({});
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [quizContent, setQuizContent] = useState<{ id: string; title: string; trainingId: string } | null>(null);
  const [showAnswersDialog, setShowAnswersDialog] = useState(false);
  const [answersContent, setAnswersContent] = useState<{ id: string; title: string } | null>(null);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  
  // PDF Viewer state
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerData, setPdfViewerData] = useState<{ url: string; title: string } | null>(null);

  // Form states
  const [newTraining, setNewTraining] = useState({
    title: "",
    description: "",
    is_mandatory: false,
    duration_minutes: 30,
    target_audience: [] as string[],
    points_reward: 10,
  });

  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
  });

  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    content_type: "video" as "video" | "audio" | "document" | "text",
    content_text: "",
  });

  const [uploadingFile, setUploadingFile] = useState(false);

  const userRole = profile?.custom_role || profile?.role || "";

  useEffect(() => {
    checkIfManager();
    fetchTrainings();
    fetchUserProgress();
  }, [user]);

  const checkIfManager = async () => {
    if (!user) return;
    
    // Check if user email is the manager email
    const isManagerEmail = user.email === MANAGER_EMAIL;
    
    // Also check user_roles table
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "gestora")
      .single();
    
    setIsManager(isManagerEmail || !!roleData);
  };

  const fetchTrainings = async () => {
    const { data, error } = await supabase
      .from("trainings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching trainings:", error);
      return;
    }

    setTrainings(data || []);

    // Fetch modules for each training
    for (const training of data || []) {
      await fetchModules(training.id);
    }
    
    setLoading(false);
  };

  const fetchModules = async (trainingId: string) => {
    const { data: modulesData } = await supabase
      .from("training_modules")
      .select("*")
      .eq("training_id", trainingId)
      .order("order_index");

    if (modulesData) {
      setModules(prev => ({ ...prev, [trainingId]: modulesData }));

      // Fetch contents for each module
      for (const module of modulesData) {
        await fetchContents(module.id);
      }
    }
  };

  const fetchContents = async (moduleId: string) => {
    const { data: contentsData } = await supabase
      .from("training_contents")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index");

    if (contentsData) {
      setContents(prev => ({ ...prev, [moduleId]: contentsData }));
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("training_progress")
      .select("content_id, completed_at")
      .eq("user_id", user.id);

    if (data) {
      setUserProgress(data.filter(p => p.content_id !== null) as UserProgress[]);
    }
  };

  const handleCreateTraining = async () => {
    if (!newTraining.title) {
      toast.error("Título é obrigatório");
      return;
    }

    const { data, error } = await supabase
      .from("trainings")
      .insert({
        title: newTraining.title,
        description: newTraining.description,
        is_mandatory: newTraining.is_mandatory,
        duration_minutes: newTraining.duration_minutes,
        target_audience: newTraining.target_audience,
        points_reward: newTraining.points_reward,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar treinamento");
      console.error(error);
      return;
    }

    toast.success("Treinamento criado!");
    setTrainings(prev => [data, ...prev]);
    setShowCreateDialog(false);
    setNewTraining({
      title: "",
      description: "",
      is_mandatory: false,
      duration_minutes: 30,
      target_audience: [],
      points_reward: 10,
    });
  };

  const handleDeleteTraining = async (trainingId: string) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este treinamento? Esta ação não pode ser desfeita.");
    if (!confirmed) return;

    // First delete all related contents, modules, and progress
    const trainingModules = modules[trainingId] || [];
    
    for (const module of trainingModules) {
      // Delete contents of this module
      await supabase
        .from("training_contents")
        .delete()
        .eq("module_id", module.id);
    }

    // Delete modules
    await supabase
      .from("training_modules")
      .delete()
      .eq("training_id", trainingId);

    // Delete progress
    await supabase
      .from("training_progress")
      .delete()
      .eq("training_id", trainingId);

    // Delete the training
    const { error } = await supabase
      .from("trainings")
      .delete()
      .eq("id", trainingId);

    if (error) {
      toast.error("Erro ao excluir treinamento");
      console.error(error);
      return;
    }

    toast.success("Treinamento excluído!");
    setTrainings(prev => prev.filter(t => t.id !== trainingId));
    
    // Clean up local state
    setModules(prev => {
      const newModules = { ...prev };
      delete newModules[trainingId];
      return newModules;
    });
  };

  const handleCreateModule = async () => {
    if (!selectedTraining || !newModule.title) {
      toast.error("Título é obrigatório");
      return;
    }

    const existingModules = modules[selectedTraining.id] || [];
    const maxOrder = existingModules.length > 0 
      ? Math.max(...existingModules.map(m => m.order_index)) 
      : -1;

    const { data, error } = await supabase
      .from("training_modules")
      .insert({
        training_id: selectedTraining.id,
        title: newModule.title,
        description: newModule.description,
        order_index: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar módulo");
      console.error(error);
      return;
    }

    toast.success("Módulo criado!");
    setModules(prev => ({
      ...prev,
      [selectedTraining.id]: [...(prev[selectedTraining.id] || []), data],
    }));
    setShowModuleDialog(false);
    setNewModule({ title: "", description: "" });
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    setUploadingFile(true);
    
    // Validate file size (max 500MB - Supabase allows up to 5GB but we limit for practical reasons)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 500MB");
      setUploadingFile(false);
      return null;
    }

    // Validate file type
    const allowedTypes: Record<string, string[]> = {
      video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mpeg'],
      audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    };

    const contentType = newContent.content_type;
    const validTypes = allowedTypes[contentType] || [];
    
    // Check by extension if MIME type is not recognized
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const validExtensions: Record<string, string[]> = {
      video: ['mp4', 'mov', 'avi', 'webm', 'mpeg'],
      audio: ['mp3', 'wav', 'ogg', 'm4a'],
      document: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']
    };

    const isValidType = validTypes.includes(file.type) || validExtensions[contentType]?.includes(fileExt);
    
    if (!isValidType) {
      toast.error(`Tipo de arquivo não suportado para ${contentType}`);
      setUploadingFile(false);
      return null;
    }

    try {
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `contents/${fileName}`;

      console.log('Uploading file:', { fileName, filePath, type: file.type, size: file.size });

      const { error: uploadError } = await supabase.storage
        .from("training-content")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message.includes('security') || uploadError.message.includes('policy')) {
          toast.error("Sem permissão para fazer upload. Verifique se você está logado como gestora.");
        } else if (uploadError.message.includes('Bucket not found')) {
          toast.error("Bucket de storage não encontrado. Contate o suporte.");
        } else {
          toast.error(`Erro no upload: ${uploadError.message}`);
        }
        setUploadingFile(false);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("training-content")
        .getPublicUrl(filePath);

      console.log('Upload successful, URL:', publicUrl);
      setUploadingFile(false);
      return publicUrl;
    } catch (err) {
      console.error('Upload exception:', err);
      toast.error("Erro inesperado ao fazer upload");
      setUploadingFile(false);
      return null;
    }
  };

  const handleCreateContent = async (file?: File) => {
    if (!selectedModule) {
      toast.error("Nenhum módulo selecionado");
      return;
    }
    
    if (!newContent.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    setUploadingFile(true);

    try {
      let contentUrl: string | null = null;
      
      if (file && newContent.content_type !== "text") {
        contentUrl = await handleFileUpload(file);
        if (!contentUrl) {
          setUploadingFile(false);
          return;
        }
      }

      const existingContents = contents[selectedModule.id] || [];
      const maxOrder = existingContents.length > 0 
        ? Math.max(...existingContents.map(c => c.order_index)) 
        : -1;

      console.log('Creating content:', { 
        module_id: selectedModule.id, 
        title: newContent.title,
        content_type: newContent.content_type,
        content_url: contentUrl 
      });

      const { data, error } = await supabase
        .from("training_contents")
        .insert({
          module_id: selectedModule.id,
          title: newContent.title.trim(),
          description: newContent.description?.trim() || null,
          content_type: newContent.content_type,
          content_url: contentUrl,
          content_text: newContent.content_type === "text" ? newContent.content_text : null,
          order_index: maxOrder + 1,
        })
        .select()
        .single();

      if (error) {
        console.error('Content creation error:', error);
        if (error.message.includes('security') || error.message.includes('policy')) {
          toast.error("Sem permissão para criar conteúdo. Verifique se você está logado como gestora.");
        } else {
          toast.error(`Erro ao criar conteúdo: ${error.message}`);
        }
        setUploadingFile(false);
        return;
      }

      toast.success("Conteúdo adicionado com sucesso!");
      setContents(prev => ({
        ...prev,
        [selectedModule.id]: [...(prev[selectedModule.id] || []), data],
      }));
      setShowContentDialog(false);
      setNewContent({ title: "", description: "", content_type: "video", content_text: "" });
    } catch (err) {
      console.error('Content creation exception:', err);
      toast.error("Erro inesperado ao criar conteúdo");
    }
  };

  const handleStartComplete = (contentId: string, trainingId: string, contentTitle: string) => {
    if (!user) return;

    // Check if already completed
    if (userProgress.some(p => p.content_id === contentId)) {
      toast.info("Conteúdo já concluído!");
      return;
    }

    // Open quiz dialog
    setQuizContent({ id: contentId, title: contentTitle, trainingId });
    setShowQuizDialog(true);
  };

  const handleCompleteAfterQuiz = async () => {
    if (!user || !quizContent) return;

    const { error } = await supabase
      .from("training_progress")
      .insert([{
        user_id: user.id,
        training_id: quizContent.trainingId,
        content_id: quizContent.id,
        completed_at: new Date().toISOString(),
      }]);

    if (error) {
      toast.error("Erro ao marcar como concluído");
      console.error(error);
      return;
    }

    toast.success("Conteúdo concluído! Pontos adicionados ao seu perfil.");
    setUserProgress(prev => [...prev, { content_id: quizContent.id, completed_at: new Date().toISOString() }]);
  };

  const handleViewAnswers = (contentId: string, contentTitle: string) => {
    setAnswersContent({ id: contentId, title: contentTitle });
    setShowAnswersDialog(true);
  };

  const getTrainingProgress = (trainingId: string) => {
    const trainingModules = modules[trainingId] || [];
    let totalContents = 0;
    let completedContents = 0;

    for (const module of trainingModules) {
      const moduleContents = contents[module.id] || [];
      totalContents += moduleContents.length;
      completedContents += moduleContents.filter(c => 
        userProgress.some(p => p.content_id === c.id)
      ).length;
    }

    return totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;
  };

  const isRecommended = (training: Training) => {
    return training.target_audience.includes(userRole);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />;
      case "audio": return <Music className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  // Sort trainings: recommended first, then by creation date
  const sortedTrainings = [...trainings].sort((a, b) => {
    const aRecommended = isRecommended(a);
    const bRecommended = isRecommended(b);
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Treinamentos</h2>
            <p className="text-muted-foreground">Desenvolva suas habilidades</p>
          </div>
        </div>

        {isManager && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Treinamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Novo Treinamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newTraining.title}
                    onChange={(e) => setNewTraining(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Atendimento ao Cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newTraining.description}
                    onChange={(e) => setNewTraining(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o objetivo do treinamento..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newTraining.duration_minutes}
                      onChange={(e) => setNewTraining(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points">Pontos</Label>
                    <Input
                      id="points"
                      type="number"
                      value={newTraining.points_reward}
                      onChange={(e) => setNewTraining(prev => ({ ...prev, points_reward: parseInt(e.target.value) || 10 }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Público-alvo (funções)</Label>
                  <div className="flex flex-wrap gap-2">
                    {FUNCTION_OPTIONS.map((func) => (
                      <label key={func} className="flex items-center gap-2">
                        <Checkbox
                          checked={newTraining.target_audience.includes(func)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewTraining(prev => ({
                                ...prev,
                                target_audience: [...prev.target_audience, func],
                              }));
                            } else {
                              setNewTraining(prev => ({
                                ...prev,
                                target_audience: prev.target_audience.filter(f => f !== func),
                              }));
                            }
                          }}
                        />
                        <span className="text-sm">{func}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newTraining.is_mandatory}
                    onCheckedChange={(checked) => setNewTraining(prev => ({ ...prev, is_mandatory: !!checked }))}
                  />
                  <Label>Treinamento obrigatório</Label>
                </div>
                <Button onClick={handleCreateTraining} className="w-full">
                  Criar Treinamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats for employees */}
      {!isManager && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trainings.length}</p>
                <p className="text-sm text-muted-foreground">Treinamentos disponíveis</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {trainings.filter(t => getTrainingProgress(t.id) === 100).length}
                </p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {trainings.filter(t => isRecommended(t)).length}
                </p>
                <p className="text-sm text-muted-foreground">Recomendados para você</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trainings List */}
      {sortedTrainings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhum treinamento disponível</p>
            {isManager && (
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Novo Treinamento" para começar
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedTrainings.map((training) => {
            const progress = getTrainingProgress(training.id);
            const recommended = isRecommended(training);
            const trainingModules = modules[training.id] || [];

            return (
              <Card key={training.id} className={recommended ? "ring-2 ring-primary/50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {recommended && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <Star className="h-3 w-3 mr-1" />
                            Recomendado
                          </Badge>
                        )}
                        {training.is_mandatory && (
                          <Badge variant="destructive">Obrigatório</Badge>
                        )}
                        {progress === 100 && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Concluído
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{training.title}</CardTitle>
                      {training.description && (
                        <p className="text-sm text-muted-foreground mt-1">{training.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {training.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {training.duration_minutes}min
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        {training.points_reward} pts
                      </div>
                      {isManager && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTraining(training.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {training.target_audience.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {training.target_audience.map((audience) => (
                        <Badge key={audience} variant="outline" className="text-xs">
                          {audience}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Modules */}
                  <Accordion type="single" collapsible className="w-full">
                    {trainingModules.map((module, index) => {
                      const moduleContents = contents[module.id] || [];
                      const completedInModule = moduleContents.filter(c => 
                        userProgress.some(p => p.content_id === c.id)
                      ).length;

                      return (
                        <AccordionItem key={module.id} value={module.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                                {index + 1}
                              </div>
                              <div className="text-left">
                                <p className="font-medium">{module.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {completedInModule}/{moduleContents.length} conteúdos
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pl-11">
                              {moduleContents.map((content) => {
                                const isCompleted = userProgress.some(p => p.content_id === content.id);

                                return (
                                  <div
                                    key={content.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                      isCompleted ? "bg-green-50 dark:bg-green-900/10 border-green-200" : "bg-muted/50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                        isCompleted ? "bg-green-100 text-green-600" : "bg-background"
                                      }`}>
                                        {isCompleted ? (
                                          <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                          getContentIcon(content.content_type)
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{content.title}</p>
                                        {content.duration_minutes && (
                                          <p className="text-xs text-muted-foreground">
                                            {content.duration_minutes} min
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {content.content_url && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            // If it's a PDF document, open in viewer
                                            const isPDF = content.content_type === "document" && 
                                              (content.content_url!.toLowerCase().includes('.pdf') || 
                                               content.content_url!.toLowerCase().includes('application/pdf'));
                                            
                                            if (isPDF) {
                                              setPdfViewerData({ url: content.content_url!, title: content.title });
                                              setPdfViewerOpen(true);
                                            } else {
                                              // For videos, audio, and other documents, open in new tab
                                              window.open(content.content_url!, "_blank", "noopener,noreferrer");
                                            }
                                          }}
                                          title={content.content_type === "document" ? "Ver documento" : "Reproduzir"}
                                        >
                                          {content.content_type === "document" ? (
                                            <FileText className="h-4 w-4" />
                                          ) : (
                                            <Play className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                      {isManager && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleViewAnswers(content.id, content.title)}
                                          title="Ver respostas"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {!isCompleted && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleStartComplete(content.id, training.id, content.title)}
                                        >
                                          Concluir
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {isManager && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={() => {
                                    setSelectedModule(module);
                                    setShowContentDialog(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Conteúdo
                                </Button>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>

                  {/* Add module button for managers */}
                  {isManager && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => {
                        setSelectedTraining(training);
                        setShowModuleDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Módulo
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Módulo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="module-title">Título do Módulo</Label>
              <Input
                id="module-title"
                value={newModule.title}
                onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Introdução"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-description">Descrição (opcional)</Label>
              <Textarea
                id="module-description"
                value={newModule.description}
                onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o conteúdo do módulo..."
              />
            </div>
            <Button onClick={handleCreateModule} className="w-full">
              Criar Módulo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Content Dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Conteúdo ao Módulo</DialogTitle>
            {selectedModule && (
              <p className="text-sm text-muted-foreground">
                Módulo: {selectedModule.title}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="content-title">Título *</Label>
              <Input
                id="content-title"
                value={newContent.title}
                onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Aula 1 - Conceitos básicos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-description">Descrição (opcional)</Label>
              <Textarea
                id="content-description"
                value={newContent.description}
                onChange={(e) => setNewContent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição do conteúdo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de conteúdo</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { type: "video", icon: Video, label: "Vídeo" },
                  { type: "audio", icon: Music, label: "Áudio" },
                  { type: "document", icon: FileText, label: "Documento" },
                  { type: "text", icon: BookOpen, label: "Texto" },
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                      newContent.content_type === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-primary/50"
                    }`}
                    onClick={() => setNewContent(prev => ({ ...prev, content_type: type as any }))}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {newContent.content_type === "text" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="content-text">Conteúdo</Label>
                  <Textarea
                    id="content-text"
                    value={newContent.content_text}
                    onChange={(e) => setNewContent(prev => ({ ...prev, content_text: e.target.value }))}
                    placeholder="Digite o conteúdo aqui..."
                    rows={6}
                  />
                </div>
                <Button 
                  onClick={() => handleCreateContent()} 
                  className="w-full" 
                  disabled={uploadingFile || !newContent.title}
                >
                  {uploadingFile ? "Salvando..." : "Salvar Conteúdo de Texto"}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload de arquivo</Label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept={
                        newContent.content_type === "video" ? "video/*" :
                        newContent.content_type === "audio" ? "audio/*" :
                        ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                      }
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!newContent.title) {
                            toast.error("Preencha o título antes de fazer upload");
                            return;
                          }
                          handleCreateContent(file);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center gap-3">
                      {uploadingFile ? (
                        <>
                          <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <span className="text-sm text-muted-foreground">Fazendo upload...</span>
                        </>
                      ) : (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <Upload className="h-7 w-7 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Clique para selecionar</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {newContent.content_type === "video" && "Formatos: MP4, MOV, AVI, WebM"}
                              {newContent.content_type === "audio" && "Formatos: MP3, WAV, M4A, OGG"}
                              {newContent.content_type === "document" && "Formatos: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {!newContent.title && (
                  <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                    ⚠️ Preencha o título antes de fazer o upload do arquivo
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Questionário: {quizContent?.title}</DialogTitle>
          </DialogHeader>
          {quizContent && user && (
            <TrainingQuiz
              contentId={quizContent.id}
              contentTitle={quizContent.title}
              trainingId={quizContent.trainingId}
              userId={user.id}
              isManager={isManager}
              onComplete={handleCompleteAfterQuiz}
              onClose={() => {
                setShowQuizDialog(false);
                setQuizContent(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Answers Dialog (Manager Only) */}
      <Dialog open={showAnswersDialog} onOpenChange={setShowAnswersDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Respostas: {answersContent?.title}</DialogTitle>
          </DialogHeader>
          {answersContent && (
            <QuizAnswersViewer
              contentId={answersContent.id}
              contentTitle={answersContent.title}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer */}
      {pdfViewerData && (
        <PDFViewer
          url={pdfViewerData.url}
          title={pdfViewerData.title}
          open={pdfViewerOpen}
          onOpenChange={(open) => {
            setPdfViewerOpen(open);
            if (!open) setPdfViewerData(null);
          }}
        />
      )}
    </div>
  );
}

export default TrainingModule;
