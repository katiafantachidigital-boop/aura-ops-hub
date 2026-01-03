import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, FileText, Send } from "lucide-react";

const actions = [
  {
    id: "new-appointment",
    label: "Novo Agendamento",
    icon: Plus,
    variant: "default" as const,
  },
  {
    id: "new-client",
    label: "Cadastrar Cliente",
    icon: UserPlus,
    variant: "outline" as const,
  },
  {
    id: "report",
    label: "Gerar Relatório",
    icon: FileText,
    variant: "outline" as const,
  },
  {
    id: "feedback",
    label: "Enviar Feedback",
    icon: Send,
    variant: "outline" as const,
  },
];

export function QuickActions() {
  return (
    <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant={action.variant}
                className="h-auto py-3 px-3 flex-col gap-2 text-xs"
              >
                <Icon className="h-5 w-5" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
