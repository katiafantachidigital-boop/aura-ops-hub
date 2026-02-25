import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, FileText, MessageSquare } from "lucide-react";
import { ClientRegistrationDialog } from "./ClientRegistrationDialog";
import { ClientReportDialog } from "./ClientReportDialog";

export function QuickActions() {
  const navigate = useNavigate();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const handleOpenFeedback = () => {
    navigate("/feedback");
  };

  const actions = [
    {
      id: "new-client",
      label: "Cadastrar Cliente",
      icon: UserPlus,
      variant: "default" as const,
      onClick: () => setClientDialogOpen(true),
    },
    {
      id: "report",
      label: "Relatório de Cliente",
      icon: FileText,
      variant: "outline" as const,
      onClick: () => setReportDialogOpen(true),
    },
    {
      id: "feedback",
      label: "Feedback do Cliente",
      icon: MessageSquare,
      variant: "outline" as const,
      onClick: handleOpenFeedback,
    },
  ];

  return (
    <>
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
                  onClick={action.onClick}
                >
                  <Icon className="h-5 w-5" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ClientRegistrationDialog 
        open={clientDialogOpen} 
        onOpenChange={setClientDialogOpen} 
      />
      
      <ClientReportDialog 
        open={reportDialogOpen} 
        onOpenChange={setReportDialogOpen} 
      />
    </>
  );
}
