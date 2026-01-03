import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Play, CheckCircle2, Clock, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Training {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  role: string[];
  mandatory: boolean;
  completed: boolean;
  progress: number;
  locked: boolean;
}

const trainings: Training[] = [
  {
    id: "1",
    title: "Protocolo de Limpeza de Pele",
    description: "Aprenda o passo a passo completo do protocolo de limpeza de pele da clínica.",
    duration: "45 min",
    category: "Procedimentos",
    role: ["Esteticista", "Esteticista Jr."],
    mandatory: true,
    completed: true,
    progress: 100,
    locked: false,
  },
  {
    id: "2",
    title: "Atendimento ao Cliente",
    description: "Técnicas de comunicação e atendimento de excelência.",
    duration: "30 min",
    category: "Comportamental",
    role: ["Todos"],
    mandatory: true,
    completed: false,
    progress: 60,
    locked: false,
  },
  {
    id: "3",
    title: "Biossegurança e Higienização",
    description: "Normas de biossegurança e procedimentos de higienização.",
    duration: "1h",
    category: "Compliance",
    role: ["Todos"],
    mandatory: true,
    completed: false,
    progress: 0,
    locked: false,
  },
  {
    id: "4",
    title: "Técnicas de Microagulhamento",
    description: "Treinamento avançado em microagulhamento facial e corporal.",
    duration: "2h",
    category: "Procedimentos",
    role: ["Esteticista Sênior"],
    mandatory: false,
    completed: false,
    progress: 0,
    locked: true,
  },
  {
    id: "5",
    title: "Gestão de Agenda",
    description: "Como organizar e otimizar a agenda de atendimentos.",
    duration: "20 min",
    category: "Operacional",
    role: ["Recepcionista", "Supervisora"],
    mandatory: false,
    completed: true,
    progress: 100,
    locked: false,
  },
];

const categories = ["Todos", "Procedimentos", "Comportamental", "Compliance", "Operacional"];

export function TrainingModule() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const filteredTrainings = selectedCategory === "Todos" 
    ? trainings 
    : trainings.filter(t => t.category === selectedCategory);

  const completedCount = trainings.filter(t => t.completed).length;
  const mandatoryCount = trainings.filter(t => t.mandatory).length;
  const mandatoryCompletedCount = trainings.filter(t => t.mandatory && t.completed).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="stat" className="p-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-light text-emerald">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Concluídos</p>
              <p className="text-2xl font-bold">{completedCount}/{trainings.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="stat" className="p-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-light text-gold">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Obrigatórios</p>
              <p className="text-2xl font-bold">{mandatoryCompletedCount}/{mandatoryCount}</p>
            </div>
          </div>
        </Card>

        <Card variant="stat" className="p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lavender text-lavender-dark">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tempo Total</p>
              <p className="text-2xl font-bold">4h 35min</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Progresso Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Treinamentos obrigatórios</span>
              <span className="font-medium">{Math.round((mandatoryCompletedCount / mandatoryCount) * 100)}%</span>
            </div>
            <Progress value={(mandatoryCompletedCount / mandatoryCount) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Trainings List */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Treinamentos
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTrainings.map((training, index) => (
              <div
                key={training.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl transition-colors animate-fade-in",
                  training.locked ? "bg-muted/30 opacity-60" : "bg-muted/30 hover:bg-muted/50"
                )}
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                {/* Status Icon */}
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                  training.completed ? "bg-emerald-light text-emerald" :
                  training.locked ? "bg-muted text-muted-foreground" :
                  training.progress > 0 ? "bg-gold-light text-gold" : "bg-lavender text-lavender-dark"
                )}>
                  {training.locked ? <Lock className="h-5 w-5" /> :
                   training.completed ? <CheckCircle2 className="h-5 w-5" /> :
                   <Play className="h-5 w-5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{training.title}</h4>
                      {training.mandatory && (
                        <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">{training.category}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{training.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {training.duration}
                      </span>
                      <span>{training.role.join(", ")}</span>
                    </div>
                    
                    {!training.locked && !training.completed && (
                      <Button size="sm" variant={training.progress > 0 ? "default" : "outline"}>
                        {training.progress > 0 ? "Continuar" : "Iniciar"}
                      </Button>
                    )}
                  </div>

                  {/* Progress bar for in-progress trainings */}
                  {training.progress > 0 && training.progress < 100 && (
                    <div className="mt-3">
                      <Progress value={training.progress} className="h-1.5" />
                      <span className="text-xs text-muted-foreground mt-1">{training.progress}% concluído</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
