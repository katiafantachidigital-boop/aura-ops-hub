import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function RecentActivity() {
  return (
    <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Atividade Recente</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium mb-1">Nenhuma atividade recente</p>
          <p className="text-sm text-muted-foreground">
            As atividades aparecerão aqui quando checklists forem enviados
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
