import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  FileCheck,
  Clock,
  Calendar,
  User,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceItem {
  id: string;
  title: string;
  category: string;
  status: "compliant" | "pending" | "non-compliant" | "review";
  dueDate: string;
  responsible: string;
  lastAudit: string;
  score: number;
}

const complianceItems: ComplianceItem[] = [
  { id: "1", title: "Licença Sanitária ANVISA", category: "Regulatório", status: "compliant", dueDate: "15/06/2025", responsible: "Admin", lastAudit: "01/12/2024", score: 100 },
  { id: "2", title: "Certificação de Biossegurança", category: "Biossegurança", status: "compliant", dueDate: "20/03/2025", responsible: "Dra. Ana", lastAudit: "15/11/2024", score: 98 },
  { id: "3", title: "Treinamento Obrigatório - Equipe", category: "Capacitação", status: "pending", dueDate: "10/01/2025", responsible: "RH", lastAudit: "20/10/2024", score: 85 },
  { id: "4", title: "Controle de Resíduos", category: "Meio Ambiente", status: "review", dueDate: "05/01/2025", responsible: "Operações", lastAudit: "25/11/2024", score: 92 },
  { id: "5", title: "Manutenção de Equipamentos", category: "Operacional", status: "compliant", dueDate: "28/02/2025", responsible: "Técnico", lastAudit: "10/12/2024", score: 100 },
  { id: "6", title: "LGPD - Proteção de Dados", category: "Legal", status: "pending", dueDate: "15/01/2025", responsible: "TI", lastAudit: "05/12/2024", score: 78 },
];

const statusConfig = {
  compliant: { icon: CheckCircle2, color: "text-emerald bg-emerald-light", label: "Conforme", badge: "default" as const },
  pending: { icon: Clock, color: "text-gold bg-gold-light", label: "Pendente", badge: "secondary" as const },
  "non-compliant": { icon: XCircle, color: "text-destructive bg-destructive/10", label: "Não Conforme", badge: "destructive" as const },
  review: { icon: AlertCircle, color: "text-lavender-dark bg-lavender", label: "Em Revisão", badge: "outline" as const },
};

const categories = [
  { name: "Regulatório", items: 5, compliant: 5 },
  { name: "Biossegurança", items: 8, compliant: 7 },
  { name: "Capacitação", items: 12, compliant: 10 },
  { name: "Operacional", items: 15, compliant: 14 },
  { name: "Legal", items: 6, compliant: 4 },
];

export function ComplianceSystem() {
  const totalCompliant = complianceItems.filter(i => i.status === "compliant").length;
  const complianceRate = Math.round((totalCompliant / complianceItems.length) * 100);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="stat" className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conformidade</p>
                <p className="text-2xl font-bold">{complianceRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-light flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald" />
              </div>
            </div>
            <Progress value={complianceRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Itens Conformes</p>
                <p className="text-2xl font-bold text-emerald">{totalCompliant}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-light flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendências</p>
                <p className="text-2xl font-bold text-gold">2</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gold-light flex items-center justify-center">
                <Clock className="h-6 w-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Não Conformes</p>
                <p className="text-2xl font-bold text-destructive">0</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Summary */}
        <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle className="text-base">Áreas de Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((cat, index) => {
              const percentage = Math.round((cat.compliant / cat.items) * 100);
              return (
                <div key={cat.name} className="space-y-2 animate-fade-in" style={{ animationDelay: `${500 + index * 50}ms` }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <span className={cn(
                      "font-bold",
                      percentage === 100 ? "text-emerald" : percentage >= 80 ? "text-gold" : "text-destructive"
                    )}>
                      {cat.compliant}/{cat.items}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Compliance Items */}
        <Card variant="glass" className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "450ms" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Itens de Compliance
              </CardTitle>
              <Button size="sm">
                Nova Auditoria
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceItems.map((item, index) => {
                const status = statusConfig[item.status];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-soft transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${550 + index * 50}ms` }}
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", status.color)}>
                      <StatusIcon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{item.title}</p>
                        <Badge variant={status.badge} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.responsible}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Vence: {item.dueDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-bold",
                        item.score >= 95 ? "text-emerald" : item.score >= 80 ? "text-gold" : "text-destructive"
                      )}>
                        {item.score}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">score</p>
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
