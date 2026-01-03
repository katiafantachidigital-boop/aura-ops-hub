import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  CheckCircle2, 
  BookOpen, 
  Video,
  Download,
  Eye,
  Clock,
  Users,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Procedure {
  id: string;
  title: string;
  category: string;
  version: string;
  lastUpdate: string;
  adherence: number;
  views: number;
  type: "document" | "video" | "checklist";
}

const procedures: Procedure[] = [
  { id: "1", title: "Protocolo de Limpeza de Pele", category: "Procedimentos", version: "v3.2", lastUpdate: "15/12/2024", adherence: 98, views: 245, type: "document" },
  { id: "2", title: "Atendimento ao Cliente - Padrão", category: "Atendimento", version: "v2.1", lastUpdate: "10/12/2024", adherence: 94, views: 189, type: "document" },
  { id: "3", title: "Preparação de Sala - Checklist", category: "Operacional", version: "v4.0", lastUpdate: "20/12/2024", adherence: 100, views: 312, type: "checklist" },
  { id: "4", title: "Microagulhamento - Técnica", category: "Procedimentos", version: "v2.0", lastUpdate: "05/12/2024", adherence: 92, views: 156, type: "video" },
  { id: "5", title: "Higienização de Equipamentos", category: "Biossegurança", version: "v5.1", lastUpdate: "18/12/2024", adherence: 99, views: 278, type: "checklist" },
  { id: "6", title: "Gestão de Estoque", category: "Operacional", version: "v1.5", lastUpdate: "12/12/2024", adherence: 87, views: 134, type: "document" },
];

const categories = [
  { name: "Procedimentos", count: 12, color: "bg-emerald-light text-emerald" },
  { name: "Atendimento", count: 8, color: "bg-rose-gold-light text-rose-gold-dark" },
  { name: "Operacional", count: 15, color: "bg-gold-light text-gold" },
  { name: "Biossegurança", count: 10, color: "bg-lavender text-lavender-dark" },
];

const typeIcons = {
  document: FileText,
  video: Video,
  checklist: CheckCircle2,
};

export function StandardizationSystem() {
  const avgAdherence = Math.round(procedures.reduce((acc, p) => acc + p.adherence, 0) / procedures.length);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="stat" className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de POPs</p>
                <p className="text-2xl font-bold">45</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-light flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-emerald" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aderência Média</p>
                <p className="text-2xl font-bold">{avgAdherence}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gold-light flex items-center justify-center">
                <Star className="h-6 w-6 text-gold" />
              </div>
            </div>
            <Progress value={avgAdherence} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atualizados (30d)</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-lavender flex items-center justify-center">
                <Clock className="h-6 w-6 text-lavender-dark" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visualizações</p>
                <p className="text-2xl font-bold">1.3k</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-gold-light flex items-center justify-center">
                <Eye className="h-6 w-6 text-rose-gold-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories */}
        <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle className="text-base">Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.map((cat, index) => (
              <div
                key={cat.name}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer animate-fade-in"
                style={{ animationDelay: `${500 + index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", cat.color)}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{cat.name}</span>
                </div>
                <Badge variant="secondary">{cat.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Procedures List */}
        <Card variant="glass" className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "450ms" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Procedimentos Operacionais Padrão
              </CardTitle>
              <Button size="sm">
                Novo POP
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {procedures.map((proc, index) => {
                const TypeIcon = typeIcons[proc.type];

                return (
                  <div
                    key={proc.id}
                    className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-soft transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${550 + index * 50}ms` }}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <TypeIcon className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{proc.title}</p>
                        <Badge variant="outline" className="text-[10px]">{proc.version}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{proc.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {proc.views}
                        </span>
                        <span>•</span>
                        <span>Atualizado: {proc.lastUpdate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-bold",
                          proc.adherence >= 95 ? "text-emerald" : proc.adherence >= 85 ? "text-gold" : "text-destructive"
                        )}>
                          {proc.adherence}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">aderência</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
