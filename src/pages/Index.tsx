import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { RoutineManagement } from "@/components/modules/RoutineManagement";
import { StandardizationSystem } from "@/components/modules/StandardizationSystem";
import { PerformanceSystem } from "@/components/modules/PerformanceSystem";
import { ComplianceSystem } from "@/components/modules/ComplianceSystem";
import { GovernanceSystem } from "@/components/modules/GovernanceSystem";
import { PeopleOpsSystem } from "@/components/modules/PeopleOpsSystem";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral da sua clínica" },
  routine: { title: "Gestão de Rotina Operacional", subtitle: "SGRO - Execução diária e padrão" },
  standardization: { title: "Padronização Operacional", subtitle: "POPs e procedimentos padrão" },
  performance: { title: "Performance da Equipe", subtitle: "Avaliação e acompanhamento de desempenho" },
  compliance: { title: "Compliance Operacional", subtitle: "Normas, conduta e processos internos" },
  governance: { title: "Governança Operacional", subtitle: "Processos e decisões organizacionais" },
  "people-ops": { title: "People & Ops", subtitle: "Gestão de pessoas + operação" },
  team: { title: "Equipe", subtitle: "Gerencie sua equipe de profissionais" },
  appointments: { title: "Agendamentos", subtitle: "Controle de agendamentos e consultas" },
  goals: { title: "Metas", subtitle: "Acompanhamento de metas e objetivos" },
  recognition: { title: "Reconhecimento", subtitle: "Programa de reconhecimento" },
  procedures: { title: "Procedimentos", subtitle: "Catálogo de procedimentos" },
  settings: { title: "Configurações", subtitle: "Configurações do sistema" },
};

const Index = () => {
  const [activeItem, setActiveItem] = useState("dashboard");
  const currentPage = pageTitles[activeItem] || pageTitles.dashboard;

  const renderContent = () => {
    switch (activeItem) {
      case "dashboard":
        return <Dashboard />;
      case "routine":
        return <RoutineManagement />;
      case "standardization":
        return <StandardizationSystem />;
      case "performance":
        return <PerformanceSystem />;
      case "compliance":
        return <ComplianceSystem />;
      case "governance":
        return <GovernanceSystem />;
      case "people-ops":
        return <PeopleOpsSystem />;
      default:
        return (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-2xl">🚧</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {currentPage.title}
              </h2>
              <p className="text-muted-foreground max-w-md">
                Esta seção está em desenvolvimento. Em breve você terá acesso a todas as funcionalidades de {currentPage.title.toLowerCase()}.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} />
      
      <main className="pl-64">
        <Header title={currentPage.title} subtitle={currentPage.subtitle} />
        
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
