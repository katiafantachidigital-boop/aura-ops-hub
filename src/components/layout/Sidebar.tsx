import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Settings, 
  LogOut,
  Sparkles,
  ListChecks,
  FileText,
  Shield,
  Building2,
  UsersRound,
  Menu,
  X
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
  { id: "routine", label: "Rotina Operacional", icon: ListChecks },
  { id: "standardization", label: "Padronização", icon: FileText },
];

const managementItems = [
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "governance", label: "Governança", icon: Building2 },
  { id: "people-ops", label: "People & Ops", icon: UsersRound },
];

const operationalItems = [
  { id: "team", label: "Equipe", icon: Users },
];

const bottomItems = [
  { id: "settings", label: "Configurações", icon: Settings },
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
          {/* Main */}
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

          {/* Management */}
          <p className={cn(
            "px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-opacity",
            isOpen ? "opacity-100" : "lg:opacity-0"
          )}>
            Gestão
          </p>
          <div className="space-y-1 mb-6">
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

          {/* Operational */}
          <p className={cn(
            "px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-opacity",
            isOpen ? "opacity-100" : "lg:opacity-0"
          )}>
            Operacional
          </p>
          <div className="space-y-1">
            {operationalItems.map((item) => {
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

        {/* User Profile */}
        <div className={cn(
          "border-t border-sidebar-border p-4 shrink-0",
          !isOpen && "lg:p-2"
        )}>
          <div className={cn("flex items-center gap-3", !isOpen && "lg:justify-center")}>
            <div className="h-10 w-10 shrink-0 rounded-full gradient-secondary flex items-center justify-center">
              <span className="text-sm font-semibold text-rose-gold-dark">AM</span>
            </div>
            <div className={cn("flex-1 min-w-0 transition-opacity", isOpen ? "opacity-100" : "lg:hidden")}>
              <p className="text-sm font-medium text-sidebar-foreground truncate">Ana Maria</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">Administradora</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
