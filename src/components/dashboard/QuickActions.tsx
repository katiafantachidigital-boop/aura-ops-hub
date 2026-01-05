import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, FileText } from "lucide-react";

interface QuickActionsProps {
  onNavigate?: (module: string) => void;
  isWeeklySupervisor?: boolean;
}

export function QuickActions({ onNavigate, isWeeklySupervisor = false }: QuickActionsProps) {
  // Only show client registration for weekly supervisors
  const actions = [
    ...(isWeeklySupervisor ? [{
      id: "client-registration",
      label: "Cadastrar Cliente",
      icon: UserPlus,
      variant: "default" as const,
    }] : []),
    {
      id: "client-reports",
      label: "Relatórios",
      icon: FileText,
      variant: "outline" as const,
    },
  ];

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant={action.variant}
                className="h-auto py-3 px-3 flex-row justify-start gap-3 text-sm"
                onClick={() => onNavigate?.(action.id)}
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
