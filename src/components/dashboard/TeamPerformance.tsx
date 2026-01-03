import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export function TeamPerformance() {
  return (
    <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Performance da Equipe</CardTitle>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            Este mês
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium mb-1">Nenhum colaborador cadastrado</p>
          <p className="text-sm text-muted-foreground">
            Adicione colaboradores na seção Equipe para ver a performance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
