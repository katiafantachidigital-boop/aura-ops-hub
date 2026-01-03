import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Mail, 
  Phone, 
  Star,
  MoreVertical
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  status: "active" | "vacation" | "away";
  performance: number;
  specialties: string[];
  appointments: number;
}

const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Carla Mendes",
    role: "Esteticista Sênior",
    email: "carla@esteticapro.com",
    phone: "(11) 99999-1111",
    avatar: "CM",
    status: "active",
    performance: 94,
    specialties: ["Limpeza de Pele", "Harmonização Facial", "Microagulhamento"],
    appointments: 48,
  },
  {
    id: "2",
    name: "Juliana Santos",
    role: "Esteticista",
    email: "juliana@esteticapro.com",
    phone: "(11) 99999-2222",
    avatar: "JS",
    status: "active",
    performance: 87,
    specialties: ["Drenagem Linfática", "Massagem Modeladora"],
    appointments: 42,
  },
  {
    id: "3",
    name: "Patricia Lima",
    role: "Esteticista",
    email: "patricia@esteticapro.com",
    phone: "(11) 99999-3333",
    avatar: "PL",
    status: "vacation",
    performance: 78,
    specialties: ["Peeling Químico", "Tratamentos Corporais"],
    appointments: 35,
  },
  {
    id: "4",
    name: "Fernanda Costa",
    role: "Esteticista Jr.",
    email: "fernanda@esteticapro.com",
    phone: "(11) 99999-4444",
    avatar: "FC",
    status: "active",
    performance: 72,
    specialties: ["Limpeza de Pele", "Hidratação Facial"],
    appointments: 28,
  },
  {
    id: "5",
    name: "Roberto Alves",
    role: "Recepcionista",
    email: "roberto@esteticapro.com",
    phone: "(11) 99999-5555",
    avatar: "RA",
    status: "active",
    performance: 91,
    specialties: ["Atendimento", "Agendamentos"],
    appointments: 0,
  },
];

const statusConfig = {
  active: { label: "Ativo", className: "bg-emerald-light text-emerald" },
  vacation: { label: "Férias", className: "bg-gold-light text-gold" },
  away: { label: "Ausente", className: "bg-destructive/10 text-destructive" },
};

export function TeamModule() {
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground">
            {teamMembers.length} profissionais cadastrados
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Profissional
        </Button>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id} variant="interactive" className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {member.avatar}
                  </div>
                  <div>
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status & Performance */}
              <div className="flex items-center justify-between">
                <Badge className={statusConfig[member.status].className}>
                  {statusConfig[member.status].label}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-gold fill-gold" />
                  <span className="text-sm font-medium">{member.performance}%</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{member.phone}</span>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1">
                {member.specialties.slice(0, 2).map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {member.specialties.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{member.specialties.length - 2}
                  </Badge>
                )}
              </div>

              {/* Performance Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Performance</span>
                  <span>{member.appointments} atendimentos</span>
                </div>
                <Progress value={member.performance} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
