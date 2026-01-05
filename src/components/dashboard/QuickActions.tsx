import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, FileText, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClientRegistrationDialog } from "./ClientRegistrationDialog";
import { ClientReportDialog } from "./ClientReportDialog";
import { toast } from "sonner";

export function QuickActions() {
  const { user, isManager } = useAuth();
  const [isWeeklySupervisor, setIsWeeklySupervisor] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      checkWeeklySupervisor();
    }
  }, [user]);

  const checkWeeklySupervisor = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('weekly_supervisors')
      .select('id')
      .eq('user_id', user.id)
      .lte('week_start', today)
      .gte('week_end', today)
      .maybeSingle();

    setIsWeeklySupervisor(!!data);
  };

  const canAccessClientFeatures = isManager || isWeeklySupervisor;

  const handleNewAppointment = () => {
    toast.info("Funcionalidade de agendamento em desenvolvimento");
  };

  const handleSendFeedback = () => {
    toast.info("Funcionalidade de feedback em desenvolvimento");
  };

  const actions = [
    {
      id: "new-appointment",
      label: "Novo Agendamento",
      icon: Plus,
      variant: "default" as const,
      onClick: handleNewAppointment,
      visible: true,
    },
    {
      id: "new-client",
      label: "Cadastrar Cliente",
      icon: UserPlus,
      variant: "outline" as const,
      onClick: () => setClientDialogOpen(true),
      visible: canAccessClientFeatures,
    },
    {
      id: "report",
      label: "Gerar Relatório",
      icon: FileText,
      variant: "outline" as const,
      onClick: () => setReportDialogOpen(true),
      visible: canAccessClientFeatures,
    },
    {
      id: "feedback",
      label: "Enviar Feedback",
      icon: Send,
      variant: "outline" as const,
      onClick: handleSendFeedback,
      visible: true,
    },
  ];

  const visibleActions = actions.filter(a => a.visible);

  return (
    <>
      <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {visibleActions.map((action) => {
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
