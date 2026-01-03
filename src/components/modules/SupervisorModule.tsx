import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown, UserCheck, UserMinus, Calendar, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isSupervisor: boolean;
  lastSupervisorDate?: string;
  supervisorCount: number;
}

const initialTeamMembers: TeamMember[] = [
  { id: "1", name: "Carla Mendes", avatar: "CM", role: "Esteticista Sênior", isSupervisor: true, lastSupervisorDate: "Atual", supervisorCount: 4 },
  { id: "2", name: "Juliana Santos", avatar: "JS", role: "Esteticista", isSupervisor: false, lastSupervisorDate: "15/12/2024", supervisorCount: 3 },
  { id: "3", name: "Patricia Lima", avatar: "PL", role: "Esteticista", isSupervisor: false, lastSupervisorDate: "08/12/2024", supervisorCount: 2 },
  { id: "4", name: "Fernanda Costa", avatar: "FC", role: "Esteticista Jr.", isSupervisor: false, lastSupervisorDate: "Nunca", supervisorCount: 0 },
  { id: "5", name: "Ana Oliveira", avatar: "AO", role: "Esteticista", isSupervisor: false, lastSupervisorDate: "01/12/2024", supervisorCount: 2 },
];

export function SupervisorModule() {
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [actionType, setActionType] = useState<"promote" | "demote">("promote");

  const currentSupervisor = teamMembers.find(m => m.isSupervisor);

  const handleAction = (member: TeamMember, action: "promote" | "demote") => {
    setSelectedMember(member);
    setActionType(action);
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedMember) return;

    setTeamMembers(prev => prev.map(m => {
      if (actionType === "promote") {
        // Remove supervisor from current
        if (m.isSupervisor) return { ...m, isSupervisor: false };
        // Add supervisor to selected
        if (m.id === selectedMember.id) return { ...m, isSupervisor: true, supervisorCount: m.supervisorCount + 1 };
      } else {
        // Just remove supervisor
        if (m.id === selectedMember.id) return { ...m, isSupervisor: false };
      }
      return m;
    }));

    toast.success(
      actionType === "promote" 
        ? `${selectedMember.name} foi promovida a Supervisora da Semana!`
        : `${selectedMember.name} foi removida do cargo de Supervisora.`
    );

    setDialogOpen(false);
    setSelectedMember(null);
  };

  return (
    <div className="space-y-6">
      {/* Current Supervisor Card */}
      <Card variant="gradient" className="animate-fade-in overflow-hidden">
        <div className="gradient-primary p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white font-bold text-xl">
              {currentSupervisor?.avatar || "?"}
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Supervisora da Semana</span>
              </div>
              <h2 className="text-2xl font-bold">{currentSupervisor?.name || "Nenhuma designada"}</h2>
              <p className="text-sm opacity-80">{currentSupervisor?.role}</p>
            </div>
          </div>
        </div>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Semana 02/01 - 08/01/2025</span>
            </div>
            {currentSupervisor && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAction(currentSupervisor, "demote")}
              >
                <UserMinus className="h-4 w-4 mr-1" />
                Remover
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Sobre a Supervisora da Semana</h4>
              <p className="text-sm text-muted-foreground">
                A supervisora da semana é responsável por enviar o checklist diário e garantir que todos os 
                procedimentos estejam sendo seguidos corretamente. Esta é uma função rotativa que promove 
                liderança e responsabilidade entre a equipe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card variant="glass" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Designar Supervisora
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.filter(m => !m.isSupervisor).map((member, index) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold">
                    {member.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Última vez: {member.lastSupervisorDate}
                      </span>
                      <span>{member.supervisorCount}x supervisora</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleAction(member, "promote")}
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Promover
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "promote" ? "Promover Supervisora" : "Remover Supervisora"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "promote" 
                ? `Deseja promover ${selectedMember?.name} para Supervisora da Semana? A supervisora atual será removida do cargo.`
                : `Deseja remover ${selectedMember?.name} do cargo de Supervisora da Semana?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
