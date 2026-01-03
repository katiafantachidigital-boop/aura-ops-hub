import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  Sparkles,
  ClipboardCheck,
  Target,
  Trophy,
  GraduationCap,
  Crown,
  History,
  Menu,
  X,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const mainItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const operationItems = [
  { id: "checklist", label: "Checklist Diário", icon: ClipboardCheck },
  { id: "goals-race", label: "Corrida da Meta", icon: Target },
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "training", label: "Treinamentos", icon: GraduationCap },
];

const managementItems = [
  { id: "team", label: "Equipe", icon: Users },
  { id: "supervisor", label: "Supervisora da Semana", icon: Crown },
  { id: "checklist-history", label: "Histórico de Checklists", icon: History },
  { id: "settings", label: "Configurações", icon: Settings },
];

const profileItems = [
  { id: "profile", label: "Meu Perfil", icon: User },
];

const bottomItems = [
  { id: "logout", label: "Sair", icon: LogOut },
];

export function Sidebar({ activeItem, onItemClick, isOpen, onToggle }: SidebarProps) {
  const handleItemClick = (id: string) => {
    onItemClick(id);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-16 lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className={cn("transition-opacity duration-200", isOpen ? "opacity-100" : "lg:opacity-0 lg:hidden")}>
            <h1 className="text-base font-bold text-sidebar-foreground">EstéticaPro</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestão Completa</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto lg:hidden text-sidebar-foreground"
            onClick={onToggle}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Principal */}
          <p className={cn(
            "px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-opacity",
            isOpen ? "opacity-100" : "lg:opacity-0"
          )}>
            Principal
          </p>
          <div className="space-y-1 mb-6">
            {mainItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={!isOpen ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    !isOpen && "lg:justify-center lg:px-2"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={cn("transition-opacity", isOpen ? "opacity-100" : "lg:hidden")}>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Operação */}
          <p className={cn(
            "px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-opacity",
            isOpen ? "opacity-100" : "lg:opacity-0"
          )}>
            Operação
          </p>
          <div className="space-y-1 mb-6">
            {operationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={!isOpen ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    !isOpen && "lg:justify-center lg:px-2"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={cn("transition-opacity", isOpen ? "opacity-100" : "lg:hidden")}>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Gestão */}
          <p className={cn(
            "px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-opacity",
            isOpen ? "opacity-100" : "lg:opacity-0"
          )}>
            Gestão
          </p>
          <div className="space-y-1">
            {managementItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={!isOpen ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    !isOpen && "lg:justify-center lg:px-2"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={cn("transition-opacity", isOpen ? "opacity-100" : "lg:hidden")}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-sidebar-border px-3 py-4 space-y-1 shrink-0">
          {/* Profile */}
          {profileItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={!isOpen ? item.label : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  !isOpen && "lg:justify-center lg:px-2"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn("transition-opacity", isOpen ? "opacity-100" : "lg:hidden")}>{item.label}</span>
              </button>
            );
          })}
          
          {/* Logout */}
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={!isOpen ? item.label : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  !isOpen && "lg:justify-center lg:px-2"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn("transition-opacity", isOpen ? "opacity-100" : "lg:hidden")}>{item.label}</span>
              </button>
            );
          })}
        </div>

      </aside>
    </>
  );
}
