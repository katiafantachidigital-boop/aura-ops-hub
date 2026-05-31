import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { RoutineManagement } from "@/components/modules/RoutineManagement";
import { TeamModule } from "@/components/modules/TeamModule";
import { SettingsModule } from "@/components/modules/SettingsModule";
import { useAuth } from "@/hooks/useAuth";
import { GoalsRaceModule } from "@/components/modules/GoalsRaceModule";
import RankingModule from "@/components/modules/RankingModule";
import { CollaboratorProfile } from "@/components/modules/CollaboratorProfile";
import { ProfileOnboarding } from "@/components/modules/ProfileOnboarding";
import { TrainingModule } from "@/components/modules/TrainingModule";
import { SupervisorManagement } from "@/components/modules/SupervisorManagement";
import { FeedbackHistoryModule } from "@/components/modules/FeedbackHistoryModule";
import { AnnouncementsModule } from "@/components/modules/AnnouncementsModule";
import { OccurrencesModule } from "@/components/modules/OccurrencesModule";
import { SalesGoalsModule } from "@/components/modules/SalesGoalsModule";
import { SalesRegistrationModule } from "@/components/modules/SalesRegistrationModule";
import { CaixaModule } from "@/components/modules/CaixaModule";
import { SpreadsheetModule } from "@/components/modules/SpreadsheetModule";
import { ChecklistHistory } from "@/components/modules/ChecklistHistory";
import { ProspeccaoModule } from "@/components/modules/ProspeccaoModule";
import { AgendaModule } from "@/components/modules/AgendaModule";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral da sua clínica" },
  checklist: { title: "Checklist Diário", subtitle: "Avaliação diária da equipe" },
  caixa: { title: "Caixa", subtitle: "Registre o valor total das vendas do dia" },
  "goals-race": { title: "Pontuação", subtitle: "Acompanhe o progresso da equipe" },
  "sales-goals": { title: "Metas de Vendas", subtitle: "Acompanhe as vendas da equipe" },
  "sales-registration": { title: "Registrar Venda", subtitle: "Registre vendas realizadas" },
  ranking: { title: "Ranking", subtitle: "Classificação da equipe" },
  training: { title: "Treinamentos", subtitle: "Capacitação e desenvolvimento" },
  announcements: { title: "Comunicados", subtitle: "Avisos e recados importantes" },
  occurrences: { title: "Ocorrências", subtitle: "Registre e acompanhe ocorrências" },
  team: { title: "Equipe", subtitle: "Gerencie sua equipe de profissionais" },
  supervisor: { title: "Supervisora", subtitle: "Gestão da supervisão" },
  "checklist-history": { title: "Histórico de Checklists", subtitle: "Registros anteriores" },
  "feedback-history": { title: "Histórico de Avaliações", subtitle: "Avaliações dos clientes" },
  settings: { title: "Configurações", subtitle: "Configurações do sistema" },
  spreadsheets: { title: "Planilhas", subtitle: "Crie e gerencie planilhas" },
  prospeccao: { title: "Prospecção", subtitle: "Controle diário de prospecções (auto-salvo)" },
  profile: { title: "Meu Perfil", subtitle: "Seu perfil profissional" },
};

const VALID_SECTIONS = new Set(Object.keys(pageTitles));

const Index = () => {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const { user, loading, signOut, isProfileComplete, isManager } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Derive active item from URL; fallback to dashboard for unknown slugs
  const activeItem = section && VALID_SECTIONS.has(section) ? section : "dashboard";
  const currentPage = pageTitles[activeItem] || pageTitles.dashboard;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Redirect unknown slugs to dashboard URL
  useEffect(() => {
    if (section && !VALID_SECTIONS.has(section)) {
      navigate("/", { replace: true });
    }
  }, [section, navigate]);

  const handleItemClick = async (id: string) => {
    if (id === "logout") {
      await signOut();
      navigate("/auth");
      return;
    }
    if (id === "dashboard") {
      navigate("/");
    } else {
      navigate(`/${id}`);
    }
  };

  const renderContent = () => {
    switch (activeItem) {
      case "dashboard":
        // All users can see dashboard
        return <Dashboard />;
      case "checklist":
        return <RoutineManagement />;
      case "caixa":
        return <CaixaModule />;
      case "goals-race":
        return <GoalsRaceModule />;
      case "sales-goals":
        return <SalesGoalsModule />;
      case "sales-registration":
        return <SalesRegistrationModule />;
      case "ranking":
        return <RankingModule />;
      case "training":
        return <TrainingModule />;
      case "announcements":
        return <AnnouncementsModule />;
      case "occurrences":
        return <OccurrencesModule />;
      case "spreadsheets":
        return <SpreadsheetModule />;
      case "prospeccao":
        return <ProspeccaoModule />;
      case "team":
        return isManager ? <TeamModule /> : <Dashboard />;
      case "supervisor":
        return isManager ? <SupervisorManagement /> : <Dashboard />;
      case "checklist-history":
        return isManager ? <ChecklistHistory onBack={() => navigate("/")} /> : <Dashboard />;
      case "feedback-history":
        return isManager ? <FeedbackHistoryModule /> : <Dashboard />;
      case "settings":
        return isManager ? <SettingsModule /> : <Dashboard />;
      case "profile":
        return <CollaboratorProfile />;
      default:
        return <Dashboard />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return null;
  }

  // Show onboarding if profile is not complete
  if (!isProfileComplete) {
    return <ProfileOnboarding />;
  }

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
