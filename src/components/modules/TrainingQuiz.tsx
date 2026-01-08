import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  Trash2,
  Eye,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  content_id: string;
  question_text: string;
  order_index: number;
}

interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface UserAnswer {
  id: string;
  user_id: string;
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  answered_at: string;
}

interface TrainingQuizProps {
  contentId: string;
  contentTitle: string;
  trainingId: string;
  userId: string;
  isManager: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export function TrainingQuiz({
  contentId,
  contentTitle,
  trainingId,
  userId,
  isManager,
  onComplete,
  onClose,
}: TrainingQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Record<string, QuestionOption[]>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Manager states
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  useEffect(() => {
    fetchQuestions();
  }, [contentId]);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data: questionsData, error } = await supabase
      .from("training_questions")
      .select("*")
      .eq("content_id", contentId)
      .order("order_index");

    if (error) {
      console.error("Error fetching questions:", error);
      setLoading(false);
      return;
    }

    setQuestions(questionsData || []);

    // Fetch options for each question
    for (const question of questionsData || []) {
      const { data: optionsData } = await supabase
        .from("training_question_options")
        .select("*")
        .eq("question_id", question.id)
        .order("order_index");

      if (optionsData) {
        setOptions((prev) => ({ ...prev, [question.id]: optionsData }));
      }
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    // Check all questions are answered
    const unanswered = questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Responda todas as ${questions.length} questões antes de enviar`);
      return;
    }

    // Calculate results
    const newResults: Record<string, boolean> = {};
    for (const question of questions) {
      const selectedOptionId = selectedAnswers[question.id];
      const questionOptions = options[question.id] || [];
      const selectedOption = questionOptions.find((o) => o.id === selectedOptionId);
      newResults[question.id] = selectedOption?.is_correct || false;

      // Save answer to database
      await supabase.from("training_user_answers").upsert({
        user_id: userId,
        question_id: question.id,
        selected_option_id: selectedOptionId,
        is_correct: selectedOption?.is_correct || false,
      }, {
        onConflict: 'user_id,question_id'
      });
    }

    setResults(newResults);
    setSubmitted(true);
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      toast.error("Digite a pergunta");
      return;
    }

    const filledOptions = newOptions.filter((o) => o.text.trim());
    if (filledOptions.length < 2) {
      toast.error("Adicione pelo menos 2 alternativas");
      return;
    }

    const hasCorrect = newOptions.some((o) => o.isCorrect && o.text.trim());
    if (!hasCorrect) {
      toast.error("Marque a alternativa correta");
      return;
    }

    // Create question
    const { data: questionData, error: questionError } = await supabase
      .from("training_questions")
      .insert({
        content_id: contentId,
        question_text: newQuestion.trim(),
        order_index: questions.length,
      })
      .select()
      .single();

    if (questionError) {
      toast.error("Erro ao criar pergunta");
      console.error(questionError);
      return;
    }

    // Create options
    for (let i = 0; i < newOptions.length; i++) {
      const opt = newOptions[i];
      if (opt.text.trim()) {
        await supabase.from("training_question_options").insert({
          question_id: questionData.id,
          option_text: opt.text.trim(),
          is_correct: opt.isCorrect,
          order_index: i,
        });
      }
    }

    toast.success("Pergunta adicionada!");
    setNewQuestion("");
    setNewOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
    setShowAddQuestion(false);
    fetchQuestions();
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const confirmed = window.confirm("Excluir esta pergunta?");
    if (!confirmed) return;

    await supabase.from("training_question_options").delete().eq("question_id", questionId);
    await supabase.from("training_user_answers").delete().eq("question_id", questionId);
    await supabase.from("training_questions").delete().eq("id", questionId);

    toast.success("Pergunta excluída");
    fetchQuestions();
  };

  const correctCount = Object.values(results).filter(Boolean).length;
  const totalQuestions = questions.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // No questions - show manager add option or complete directly
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum questionário configurado para esta aula</p>
        </div>

        {isManager ? (
          <div className="space-y-4">
            <Button onClick={() => setShowAddQuestion(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Pergunta
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <Button onClick={handleFinish} className="w-full">
            Concluir Aula
          </Button>
        )}

        {/* Add Question Dialog */}
        <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Pergunta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Pergunta</Label>
                <Textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Digite a pergunta..."
                  rows={3}
                />
              </div>
              <div className="space-y-3">
                <Label>Alternativas (marque a correta)</Label>
                {newOptions.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={opt.isCorrect}
                      onChange={() => {
                        setNewOptions((prev) =>
                          prev.map((o, i) => ({ ...o, isCorrect: i === index }))
                        );
                      }}
                      className="h-4 w-4"
                    />
                    <Input
                      value={opt.text}
                      onChange={(e) => {
                        setNewOptions((prev) =>
                          prev.map((o, i) =>
                            i === index ? { ...o, text: e.target.value } : o
                          )
                        );
                      }}
                      placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleAddQuestion} className="w-full">
                Salvar Pergunta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Show results
  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <div
            className={`inline-flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
              correctCount === totalQuestions
                ? "bg-green-100 text-green-600"
                : correctCount >= totalQuestions / 2
                ? "bg-amber-100 text-amber-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            <span className="text-2xl font-bold">
              {correctCount}/{totalQuestions}
            </span>
          </div>
          <h3 className="text-lg font-semibold">
            {correctCount === totalQuestions
              ? "Parabéns! Você acertou tudo!"
              : `Você acertou ${correctCount} de ${totalQuestions} questões`}
          </h3>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => {
            const questionOptions = options[question.id] || [];
            const selectedOptionId = selectedAnswers[question.id];
            const isCorrect = results[question.id];
            const correctOption = questionOptions.find((o) => o.is_correct);
            const selectedOption = questionOptions.find((o) => o.id === selectedOptionId);

            return (
              <Card
                key={question.id}
                className={`${
                  isCorrect
                    ? "border-green-200 bg-green-50/50"
                    : "border-red-200 bg-red-50/50"
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">
                        {index + 1}. {question.question_text}
                      </p>
                      {!isCorrect && (
                        <div className="space-y-1 text-sm">
                          <p className="text-red-600">
                            Sua resposta: {selectedOption?.option_text}
                          </p>
                          <p className="text-green-600">
                            Resposta correta: {correctOption?.option_text}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button onClick={handleFinish} className="w-full">
          Concluir e Fechar
        </Button>
      </div>
    );
  }

  // Show quiz form
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Questionário</h3>
          <p className="text-sm text-muted-foreground">
            Responda todas as questões para concluir a aula
          </p>
        </div>
        <Badge variant="outline">{questions.length} questões</Badge>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const questionOptions = options[question.id] || [];

          return (
            <Card key={question.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-4">
                  <p className="font-medium">
                    {index + 1}. {question.question_text}
                  </p>
                  {isManager && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <RadioGroup
                  value={selectedAnswers[question.id] || ""}
                  onValueChange={(value) =>
                    setSelectedAnswers((prev) => ({ ...prev, [question.id]: value }))
                  }
                >
                  {questionOptions.map((option, optIndex) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {String.fromCharCode(65 + optIndex)}) {option.option_text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isManager && (
        <Button
          variant="outline"
          onClick={() => setShowAddQuestion(true)}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Pergunta
        </Button>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          Enviar Respostas
        </Button>
      </div>

      {/* Add Question Dialog */}
      <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Pergunta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Digite a pergunta..."
                rows={3}
              />
            </div>
            <div className="space-y-3">
              <Label>Alternativas (marque a correta)</Label>
              {newOptions.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={opt.isCorrect}
                    onChange={() => {
                      setNewOptions((prev) =>
                        prev.map((o, i) => ({ ...o, isCorrect: i === index }))
                      );
                    }}
                    className="h-4 w-4"
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) => {
                      setNewOptions((prev) =>
                        prev.map((o, i) =>
                          i === index ? { ...o, text: e.target.value } : o
                        )
                      );
                    }}
                    placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleAddQuestion} className="w-full">
              Salvar Pergunta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component for viewing user answers (manager only)
interface QuizAnswersViewerProps {
  contentId: string;
  contentTitle: string;
}

export function QuizAnswersViewer({ contentId, contentTitle }: QuizAnswersViewerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Record<string, QuestionOption[]>>({});
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [contentId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch questions
    const { data: questionsData } = await supabase
      .from("training_questions")
      .select("*")
      .eq("content_id", contentId)
      .order("order_index");

    setQuestions(questionsData || []);

    // Fetch options
    for (const question of questionsData || []) {
      const { data: optionsData } = await supabase
        .from("training_question_options")
        .select("*")
        .eq("question_id", question.id)
        .order("order_index");

      if (optionsData) {
        setOptions((prev) => ({ ...prev, [question.id]: optionsData }));
      }
    }

    // Fetch all answers for these questions
    const questionIds = (questionsData || []).map((q) => q.id);
    if (questionIds.length > 0) {
      const { data: answersData } = await supabase
        .from("training_user_answers")
        .select("*")
        .in("question_id", questionIds);

      setUserAnswers(answersData || []);

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set((answersData || []).map((a) => a.user_id))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profileMap: Record<string, string> = {};
        for (const profile of profilesData || []) {
          profileMap[profile.id] = profile.full_name || "Usuário sem nome";
        }
        setProfiles(profileMap);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma pergunta configurada
      </p>
    );
  }

  // Group answers by user
  const userIds = [...new Set(userAnswers.map((a) => a.user_id))];

  if (userIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma resposta registrada ainda
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {userIds.length} colaborador(es) respondeu(ram) o questionário
      </p>

      <Accordion type="single" collapsible>
        {userIds.map((userId) => {
          const userAnswersList = userAnswers.filter((a) => a.user_id === userId);
          const correctCount = userAnswersList.filter((a) => a.is_correct).length;

          return (
            <AccordionItem key={userId} value={userId}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4" />
                  <span>{profiles[userId] || "Carregando..."}</span>
                  <Badge
                    variant={
                      correctCount === questions.length
                        ? "default"
                        : correctCount >= questions.length / 2
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {correctCount}/{questions.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-7">
                  {questions.map((question, index) => {
                    const answer = userAnswersList.find(
                      (a) => a.question_id === question.id
                    );
                    const questionOptions = options[question.id] || [];
                    const selectedOption = questionOptions.find(
                      (o) => o.id === answer?.selected_option_id
                    );
                    const correctOption = questionOptions.find((o) => o.is_correct);

                    return (
                      <div
                        key={question.id}
                        className={`p-2 rounded text-sm ${
                          answer?.is_correct
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-red-50 dark:bg-red-900/20"
                        }`}
                      >
                        <p className="font-medium">
                          {index + 1}. {question.question_text}
                        </p>
                        <p
                          className={
                            answer?.is_correct ? "text-green-600" : "text-red-600"
                          }
                        >
                          Resposta: {selectedOption?.option_text || "Não respondeu"}
                        </p>
                        {!answer?.is_correct && (
                          <p className="text-muted-foreground">
                            Correta: {correctOption?.option_text}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
