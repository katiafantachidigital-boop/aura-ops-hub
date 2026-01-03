import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Heart,
  Brain,
  Smile,
  Frown,
  Meh,
  MessageSquare,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  mood: "happy" | "neutral" | "stressed";
  engagement: number;
  feedbackPending: number;
  recognitions: number;
  lastCheckIn: string;
}

interface Feedback {
  id: string;
  from: string;
  to: string;
  type: "praise" | "suggestion" | "concern";
  message: string;
  date: string;
}

const teamMembers: TeamMember[] = [
  { id: "1", name: "Carla Mendes", role: "Esteticista Sênior", avatar: "CM", mood: "happy", engagement: 95, feedbackPending: 0, recognitions: 12, lastCheckIn: "Hoje" },
  { id: "2", name: "Juliana Santos", role: "Esteticista", avatar: "JS", mood: "happy", engagement: 88, feedbackPending: 1, recognitions: 8, lastCheckIn: "Hoje" },
  { id: "3", name: "Patricia Lima", role: "Esteticista", avatar: "PL", mood: "neutral", engagement: 75, feedbackPending: 2, recognitions: 5, lastCheckIn: "Ontem" },
  { id: "4", name: "Fernanda Costa", role: "Esteticista Jr.", avatar: "FC", mood: "stressed", engagement: 62, feedbackPending: 3, recognitions: 2, lastCheckIn: "3 dias" },
];

const recentFeedbacks: Feedback[] = [
  { id: "1", from: "Cliente Maria", to: "Carla Mendes", type: "praise", message: "Atendimento excepcional! Super atenciosa.", date: "Há 2h" },
  { id: "2", from: "Ana (Gestora)", to: "Juliana Santos", type: "praise", message: "Ótima evolução nas técnicas de microagulhamento.", date: "Há 5h" },
  { id: "3", from: "Patricia Lima", to: "Equipe", type: "suggestion", message: "Poderíamos melhorar a organização dos produtos.", date: "Ontem" },
  { id: "4", from: "Ana (Gestora)", to: "Fernanda Costa", type: "concern", message: "Vamos conversar sobre os atrasos recentes?", date: "Ontem" },
];

const moodIcons = {
  happy: { icon: Smile, color: "text-emerald bg-emerald-light" },
  neutral: { icon: Meh, color: "text-gold bg-gold-light" },
  stressed: { icon: Frown, color: "text-destructive bg-destructive/10" },
};

const feedbackTypeConfig = {
  praise: { color: "bg-emerald-light text-emerald", label: "Elogio" },
  suggestion: { color: "bg-lavender text-lavender-dark", label: "Sugestão" },
  concern: { color: "bg-gold-light text-gold", label: "Atenção" },
};

export function PeopleOpsSystem() {
  const avgEngagement = Math.round(teamMembers.reduce((acc, m) => acc + m.engagement, 0) / teamMembers.length);
  const happyCount = teamMembers.filter(m => m.mood === "happy").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="stat" className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engajamento</p>
                <p className="text-2xl font-bold">{avgEngagement}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-light flex items-center justify-center">
                <Heart className="h-6 w-6 text-emerald" />
              </div>
            </div>
            <Progress value={avgEngagement} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clima Positivo</p>
                <p className="text-2xl font-bold">{happyCount}/{teamMembers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gold-light flex items-center justify-center">
                <Smile className="h-6 w-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reconhecimentos</p>
                <p className="text-2xl font-bold">27</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-gold-light flex items-center justify-center">
                <Award className="h-6 w-6 text-rose-gold-dark" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Feedbacks Pendentes</p>
                <p className="text-2xl font-bold text-gold">6</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-lavender flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-lavender-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Pulse */}
        <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Pulso da Equipe
              </CardTitle>
              <Button size="sm" variant="outline">
                Check-in
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member, index) => {
              const mood = moodIcons[member.mood];
              const MoodIcon = mood.icon;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-soft transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${500 + index * 50}ms` }}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center font-semibold shrink-0",
                    index === 0 ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}>
                    {member.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{member.name}</p>
                      <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", mood.color)}>
                        <MoodIcon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 text-gold" />
                        <span>{member.recognitions}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Check-in: {member.lastCheckIn}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-bold",
                      member.engagement >= 80 ? "text-emerald" : member.engagement >= 60 ? "text-gold" : "text-destructive"
                    )}>
                      {member.engagement}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">engajamento</p>
                    {member.feedbackPending > 0 && (
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        {member.feedbackPending} pendente(s)
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "450ms" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Feedbacks Recentes
              </CardTitle>
              <Button size="sm">
                Dar Feedback
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentFeedbacks.map((feedback, index) => {
              const config = feedbackTypeConfig[feedback.type];

              return (
                <div
                  key={feedback.id}
                  className="p-4 rounded-xl border bg-card hover:shadow-soft transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${550 + index * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn("text-[10px]", config.color)}>
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{feedback.date}</span>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{feedback.message}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{feedback.from}</span>
                    <span>→</span>
                    <span>{feedback.to}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
