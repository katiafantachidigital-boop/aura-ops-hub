import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { RoutineManagement } from "@/components/modules/RoutineManagement";
import { GoalsRaceModule } from "@/components/modules/GoalsRaceModule";
import { RankingModule } from "@/components/modules/RankingModule";
import { TrainingModule } from "@/components/modules/TrainingModule";
import { TeamModule } from "@/components/modules/TeamModule";
import { SupervisorModule } from "@/components/modules/SupervisorModule";
import { ChecklistHistoryModule } from "@/components/modules/ChecklistHistoryModule";
import { SettingsModule } from "@/components/modules/SettingsModule";
import { useAuth } from "@/hooks/useAuth";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral do dia" },
  checklist: { title: "Checklist Diário", subtitle: "Formulário de execução diária" },
  "goals-race": { title: "Corrida das Metas", subtitle: "Gamificação e progresso da equipe" },
  ranking: { title: "Ranking", subtitle: "Performance semanal e mensal" },
  training: { title: "Treinamentos", subtitle: "Conteúdos e capacitação" },
  team: { title: "Equipe", subtitle: "Gestão de colaboradoras" },
  supervisor: { title: "Supervisora da Semana", subtitle: "Controle de autoridade temporária" },
  "checklist-history": { title: "Histórico de Checklists", subtitle: "Registro de checklists enviados" },
  settings: { title: "Configurações", subtitle: "Preferências do sistema" },
};

const Index = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
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
      case "checklist":
        return <RoutineManagement />;
      case "goals-race":
        return <GoalsRaceModule />;
      case "ranking":
        return <RankingModule />;
      case "training":
        return <TrainingModule />;
      case "team":
        return <TeamModule />;
      case "supervisor":
        return <SupervisorModule />;
      case "checklist-history":
        return <ChecklistHistoryModule />;
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
