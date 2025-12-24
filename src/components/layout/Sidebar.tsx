import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  TrendingUp, 
  Heart, 
  Settings, 
  LogOut,
  Sparkles,
  ClipboardList,
  Target,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "team", label: "Equipe", icon: Users },
  { id: "appointments", label: "Agendamentos", icon: Calendar },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "behavior", label: "Comportamental", icon: Heart },
  { id: "goals", label: "Metas", icon: Target },
  { id: "recognition", label: "Reconhecimento", icon: Award },
  { id: "procedures", label: "Procedimentos", icon: ClipboardList },
];

const bottomItems = [
  { id: "settings", label: "Configurações", icon: Settings },
  { id: "logout", label: "Sair", icon: LogOut },
];

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground">EstéticaPro</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestão Clínica</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Menu Principal
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-secondary flex items-center justify-center">
              <span className="text-sm font-semibold text-rose-gold-dark">AM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Ana Maria</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">Administradora</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
