import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, FileText, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClientRegistrationDialog } from "./ClientRegistrationDialog";
import { ClientReportDialog } from "./ClientReportDialog";

export function QuickActions() {
  const navigate = useNavigate();
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
      visible: canAccessClientFeatures,
    },
    {
      id: "report",
      label: "Relatório de Cliente",
      icon: FileText,
      variant: "outline" as const,
      onClick: () => setReportDialogOpen(true),
      visible: canAccessClientFeatures,
    },
    {
      id: "feedback",
      label: "Feedback do Cliente",
      icon: MessageSquare,
      variant: "outline" as const,
      onClick: handleOpenFeedback,
      visible: canAccessClientFeatures,
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
