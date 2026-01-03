import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { RoutineManagement } from "@/components/modules/RoutineManagement";
import { TeamModule } from "@/components/modules/TeamModule";
import { SettingsModule } from "@/components/modules/SettingsModule";
import { useAuth } from "@/hooks/useAuth";

// Placeholder components for new modules
const GoalsRaceModule = () => (
  <div className="text-center py-12">
    <h2 className="text-xl font-semibold text-foreground mb-2">Corrida das Metas</h2>
    <p className="text-muted-foreground">Módulo em desenvolvimento</p>
  </div>
);

const RankingModule = () => (
  <div className="text-center py-12">
    <h2 className="text-xl font-semibold text-foreground mb-2">Ranking</h2>
    <p className="text-muted-foreground">Módulo em desenvolvimento</p>
  </div>
);

const TrainingModule = () => (
  <div className="text-center py-12">
    <h2 className="text-xl font-semibold text-foreground mb-2">Treinamentos</h2>
    <p className="text-muted-foreground">Módulo em desenvolvimento</p>
  </div>
);

const SupervisorModule = () => (
  <div className="text-center py-12">
    <h2 className="text-xl font-semibold text-foreground mb-2">Supervisora da Semana</h2>
    <p className="text-muted-foreground">Módulo em desenvolvimento</p>
  </div>
);

const ChecklistHistoryModule = () => (
  <div className="text-center py-12">
    <h2 className="text-xl font-semibold text-foreground mb-2">Histórico de Checklists</h2>
    <p className="text-muted-foreground">Módulo em desenvolvimento</p>
  </div>
);

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral da sua clínica" },
  checklist: { title: "Checklist Diário", subtitle: "Avaliação diária da equipe" },
  "goals-race": { title: "Corrida das Metas", subtitle: "Acompanhe o progresso das metas" },
  ranking: { title: "Ranking", subtitle: "Classificação da equipe" },
  training: { title: "Treinamentos", subtitle: "Capacitação e desenvolvimento" },
  team: { title: "Equipe", subtitle: "Gerencie sua equipe de profissionais" },
  supervisor: { title: "Supervisora da Semana", subtitle: "Gestão da supervisão semanal" },
  "checklist-history": { title: "Histórico de Checklists", subtitle: "Registros anteriores" },
  settings: { title: "Configurações", subtitle: "Configurações do sistema" },
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
