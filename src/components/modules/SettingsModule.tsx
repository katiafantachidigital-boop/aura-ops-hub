import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Globe,
  CreditCard
} from "lucide-react";

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: typeof User;
  items: {
    label: string;
    description: string;
    enabled?: boolean;
  }[];
}

const settings: SettingSection[] = [
  {
    id: "profile",
    title: "Perfil da Clínica",
    description: "Informações básicas da sua clínica",
    icon: Building,
    items: [
      { label: "Nome da Clínica", description: "EstéticaPro Centro" },
      { label: "CNPJ", description: "12.345.678/0001-90" },
      { label: "Endereço", description: "Av. Paulista, 1000 - São Paulo, SP" },
    ],
  },
  {
    id: "notifications",
    title: "Notificações",
    description: "Configure suas preferências de notificação",
    icon: Bell,
    items: [
      { label: "Notificações por E-mail", description: "Receba atualizações por e-mail", enabled: true },
      { label: "Notificações Push", description: "Alertas em tempo real no navegador", enabled: true },
      { label: "Relatórios Semanais", description: "Resumo semanal de performance", enabled: false },
    ],
  },
  {
    id: "security",
    title: "Segurança",
    description: "Configurações de segurança e acesso",
    icon: Shield,
    items: [
      { label: "Autenticação em Dois Fatores", description: "Adicione uma camada extra de segurança", enabled: false },
      { label: "Sessões Ativas", description: "Gerencie dispositivos conectados" },
      { label: "Histórico de Login", description: "Visualize acessos recentes" },
    ],
  },
  {
    id: "appearance",
    title: "Aparência",
    description: "Personalize a interface do sistema",
    icon: Palette,
    items: [
      { label: "Modo Escuro", description: "Alterne entre tema claro e escuro", enabled: false },
      { label: "Compactar Sidebar", description: "Reduza o tamanho do menu lateral", enabled: false },
    ],
  },
];

export function SettingsModule() {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: User, label: "Meu Perfil", color: "bg-emerald-light text-emerald" },
          { icon: Database, label: "Backup", color: "bg-lavender text-lavender-dark" },
          { icon: Globe, label: "Integrações", color: "bg-gold-light text-gold" },
          { icon: CreditCard, label: "Faturamento", color: "bg-rose-gold-light text-rose-gold-dark" },
        ].map((action) => (
          <Card key={action.label} variant="interactive" className="p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settings.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} variant="default">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    {item.enabled !== undefined ? (
                      <Switch checked={item.enabled} />
                    ) : (
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
