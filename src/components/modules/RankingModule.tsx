import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingMember {
  id: string;
  name: string;
  avatar: string;
  score: number;
  checklistsCompleted: number;
  goalsAchieved: number;
  trend: "up" | "down" | "stable";
  previousRank: number;
}

const weeklyRanking: RankingMember[] = [
  { id: "1", name: "Carla Mendes", avatar: "CM", score: 98, checklistsCompleted: 7, goalsAchieved: 5, trend: "up", previousRank: 2 },
  { id: "2", name: "Juliana Santos", avatar: "JS", score: 92, checklistsCompleted: 7, goalsAchieved: 4, trend: "stable", previousRank: 2 },
  { id: "3", name: "Ana Oliveira", avatar: "AO", score: 85, checklistsCompleted: 6, goalsAchieved: 3, trend: "up", previousRank: 5 },
  { id: "4", name: "Patricia Lima", avatar: "PL", score: 78, checklistsCompleted: 6, goalsAchieved: 2, trend: "down", previousRank: 3 },
  { id: "5", name: "Fernanda Costa", avatar: "FC", score: 65, checklistsCompleted: 5, goalsAchieved: 1, trend: "down", previousRank: 4 },
];

const monthlyRanking: RankingMember[] = [
  { id: "1", name: "Juliana Santos", avatar: "JS", score: 380, checklistsCompleted: 28, goalsAchieved: 18, trend: "up", previousRank: 2 },
  { id: "2", name: "Carla Mendes", avatar: "CM", score: 365, checklistsCompleted: 26, goalsAchieved: 17, trend: "down", previousRank: 1 },
  { id: "3", name: "Ana Oliveira", avatar: "AO", score: 320, checklistsCompleted: 24, goalsAchieved: 14, trend: "up", previousRank: 4 },
  { id: "4", name: "Patricia Lima", avatar: "PL", score: 290, checklistsCompleted: 22, goalsAchieved: 12, trend: "stable", previousRank: 4 },
  { id: "5", name: "Fernanda Costa", avatar: "FC", score: 245, checklistsCompleted: 20, goalsAchieved: 8, trend: "down", previousRank: 3 },
];

const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const getMedalColor = (position: number) => {
  switch (position) {
    case 0: return "bg-gold text-white shadow-lg";
    case 1: return "bg-gray-400 text-white";
    case 2: return "bg-rose-gold text-white";
    default: return "bg-muted text-muted-foreground";
  }
};

function RankingList({ ranking, period }: { ranking: RankingMember[]; period: string }) {
  return (
    <div className="space-y-3">
      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {ranking.slice(0, 3).map((member, index) => {
          const podiumOrder = [1, 0, 2];
          const actualIndex = podiumOrder[index];
          const podiumMember = ranking[actualIndex];
          
          return (
            <div
              key={podiumMember.id}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl animate-fade-in",
                actualIndex === 0 ? "bg-gold/10 order-2" : actualIndex === 1 ? "bg-muted/50 order-1" : "bg-rose-gold-light order-3"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative mb-3">
                <div className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full font-bold text-lg",
                  actualIndex === 0 ? "gradient-primary text-primary-foreground shadow-glow" : "bg-secondary text-secondary-foreground"
                )}>
                  {podiumMember.avatar}
                </div>
                {actualIndex === 0 && (
                  <div className="absolute -top-2 -right-2">
                    <Trophy className="h-6 w-6 text-gold" />
                  </div>
                )}
              </div>
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm mb-2",
                getMedalColor(actualIndex)
              )}>
                {actualIndex + 1}º
              </span>
              <span className="font-semibold text-center text-sm">{podiumMember.name}</span>
              <span className="text-2xl font-bold text-primary mt-1">{podiumMember.score}</span>
              <span className="text-xs text-muted-foreground">pontos</span>
            </div>
          );
        })}
      </div>

      {/* Rest of ranking */}
      {ranking.slice(3).map((member, index) => (
        <div
          key={member.id}
          className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
          style={{ animationDelay: `${(index + 3) * 100}ms` }}
        >
          <span className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm shrink-0",
            getMedalColor(index + 3)
          )}>
            {index + 4}º
          </span>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold text-sm shrink-0">
            {member.avatar}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{member.name}</span>
              <TrendIcon trend={member.trend} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{member.checklistsCompleted} checklists</span>
              <span>{member.goalsAchieved} metas</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-bold">{member.score}</span>
            <span className="text-xs text-muted-foreground block">pontos</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RankingModule() {
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="stat" className="p-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-light text-gold">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Líder da Semana</p>
              <p className="text-lg font-bold">Carla Mendes</p>
            </div>
          </div>
        </Card>

        <Card variant="stat" className="p-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-light text-emerald">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maior Pontuação</p>
              <p className="text-lg font-bold">98 pontos</p>
            </div>
          </div>
        </Card>

        <Card variant="stat" className="p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lavender text-lavender-dark">
              <Medal className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Destaque do Mês</p>
              <p className="text-lg font-bold">Juliana Santos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Ranking Tabs */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            Ranking de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full max-w-xs grid-cols-2 mb-6">
              <TabsTrigger value="weekly">Semanal</TabsTrigger>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly">
              <RankingList ranking={weeklyRanking} period="semanal" />
            </TabsContent>
            <TabsContent value="monthly">
              <RankingList ranking={monthlyRanking} period="mensal" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
