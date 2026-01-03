import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { RoutineManagement } from "@/components/modules/RoutineManagement";
import { StandardizationSystem } from "@/components/modules/StandardizationSystem";
import { PerformanceSystem } from "@/components/modules/PerformanceSystem";
import { ComplianceSystem } from "@/components/modules/ComplianceSystem";
import { GovernanceSystem } from "@/components/modules/GovernanceSystem";
import { PeopleOpsSystem } from "@/components/modules/PeopleOpsSystem";
import { TeamModule } from "@/components/modules/TeamModule";
import { SettingsModule } from "@/components/modules/SettingsModule";
import { useAuth } from "@/hooks/useAuth";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral da sua clínica" },
  routine: { title: "Gestão de Rotina Operacional", subtitle: "SGRO - Execução diária e padrão" },
  standardization: { title: "Padronização Operacional", subtitle: "POPs e procedimentos padrão" },
  performance: { title: "Performance da Equipe", subtitle: "Avaliação e acompanhamento de desempenho" },
  compliance: { title: "Compliance Operacional", subtitle: "Normas, conduta e processos internos" },
  governance: { title: "Governança Operacional", subtitle: "Processos e decisões organizacionais" },
  "people-ops": { title: "People & Ops", subtitle: "Gestão de pessoas + operação" },
  team: { title: "Equipe", subtitle: "Gerencie sua equipe de profissionais" },
  settings: { title: "Configurações", subtitle: "Configurações do sistema" },
};

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentPage = pageTitles[activeItem] || pageTitles.dashboard;

  // TEMPORARILY DISABLED: Redirect to auth if not logged in
  // useEffect(() => {
  //   if (!loading && !user) {
  //     navigate("/auth");
  //   }
  // }, [user, loading, navigate]);

  const handleItemClick = async (id: string) => {
    if (id === "logout") {
      await signOut();
      navigate("/auth");
      return;
    }
    setActiveItem(id);
  };

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
      case "team":
        return <TeamModule />;
      case "settings":
        return <SettingsModule />;
      default:
        return <Dashboard />;
    }
  };

  // TEMPORARILY DISABLED: Loading state
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-background">
  //       <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  //     </div>
  //   );
  // }

  // TEMPORARILY DISABLED: User check
  // if (!user) {
  //   return null;
  // }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar 
        activeItem={activeItem} 
        onItemClick={handleItemClick}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        <Header 
          title={currentPage.title} 
          subtitle={currentPage.subtitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-full">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
